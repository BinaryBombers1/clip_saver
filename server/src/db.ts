import dotenv from "dotenv";
import path from "node:path";
import mongoose from "mongoose";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export async function connectDb(): Promise<void> {
  let uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri("linklens");
    console.log("[db] MONGODB_URI not set — in-memory MongoDB booted (demo mode)");
  }
  await mongoose.connect(uri);
  console.log("[db] connected");
}
