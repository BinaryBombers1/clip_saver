import fs from "node:fs";
import path from "node:path";
import { connectDb } from "../src/db";
import { Visitor } from "../src/models/Visitor";
import { MediaFile } from "../src/mediaStore";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
};

async function main() {
  await connectDb();
  const dirs = [
    path.resolve(process.cwd(), "uploads"),
    path.resolve(process.cwd(), "server/uploads"),
  ];
  let added = 0;
  let skipped = 0;

  const sessions = await Visitor.find({ "media.0": { $exists: true } }).lean();
  const referenced = new Set<string>();
  for (const s of sessions as any[]) {
    for (const m of s.media || []) if (m.filename) referenced.add(m.filename);
  }

  const seen = new Set<string>();
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const fn of fs.readdirSync(dir)) {
      if (seen.has(fn)) continue;
      seen.add(fn);
      const full = path.join(dir, fn);
      if (!fs.statSync(full).isFile()) continue;
      const existing = await MediaFile.findOne({ filename: fn });
      if (existing) {
        skipped++;
        continue;
      }
      const ext = path.extname(fn).toLowerCase();
      await MediaFile.create({
        filename: fn,
        contentType: MIME[ext] || "application/octet-stream",
        data: fs.readFileSync(full),
        bytes: fs.statSync(full).size,
      });
      added++;
    }
  }

  const missing = [...referenced].filter((f) => !seen.has(f));
  const orphans = [...seen].filter((f) => !referenced.has(f));
  console.log(
    `imported=${added} already=${skipped} referenced=${referenced.size} missing-on-disk=${missing.length} unreferenced=${orphans.length}`
  );
  if (missing.length) console.log("missing:", missing.join(", "));
  const total = await MediaFile.countDocuments();
  console.log(`mediafiles total=${total}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
