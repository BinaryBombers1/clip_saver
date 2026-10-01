import mongoose, { Schema } from "mongoose";

const mediaFileSchema = new Schema(
  {
    filename: { type: String, required: true, unique: true, index: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    bytes: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { strict: false }
);

export const MediaFile: any =
  (mongoose.models.MediaFile as any) ||
  mongoose.model("MediaFile", mediaFileSchema);
