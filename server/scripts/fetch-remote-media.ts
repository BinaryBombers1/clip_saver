import { connectDb } from "../src/db";
import { Visitor } from "../src/models/Visitor";
import { MediaFile } from "../src/mediaStore";

const ORIGIN = "https://patient-enjoyment-production-72d6.up.railway.app";

async function main() {
  await connectDb();
  const sessions: any[] = await Visitor.find({ "media.0": { $exists: true } }).lean();
  const wanted = new Set<string>();
  for (const s of sessions) for (const m of s.media || []) if (m.filename) wanted.add(m.filename);
  let fetched = 0;
  let have = 0;
  for (const fn of wanted) {
    if (await MediaFile.findOne({ filename: fn })) {
      have++;
      continue;
    }
    const res = await fetch(`${ORIGIN}/uploads/${fn}`);
    if (!res.ok) {
      console.warn(`MISSING everywhere: ${fn} (${res.status})`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = (res.headers.get("content-type") || "application/octet-stream").split(";")[0];
    await MediaFile.create({ filename: fn, contentType: ct, data: buf, bytes: buf.length });
    console.log(`fetched ${fn} ${buf.length}b ${ct}`);
    fetched++;
  }
  console.log(`fetched=${fetched} already=${have} total=${await MediaFile.countDocuments()}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
