import { connectDb } from "../src/db";
import { Visitor } from "../src/models/Visitor";
import { MediaFile } from "../src/mediaStore";

async function main() {
  await connectDb();
  const docs: any[] = await Visitor.find({ deletedAt: null }).lean();
  console.log("sessions:", docs.length);
  let withMedia = 0;
  let entries = 0;
  for (const d of docs) {
    const m = d.media || [];
    entries += m.length;
    if (m.length) {
      withMedia++;
      console.log(
        d.token,
        String(d.createdAt),
        m
          .map((x: any) => `${x.kind}:${x.filename} (${x.bytes}b) ${x.url}`)
          .join(" | ")
      );
    }
  }
  console.log(`sessionsWithMedia=${withMedia} totalMediaEntries=${entries}`);
  console.log("mediafiles in db:", await MediaFile.countDocuments());
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
