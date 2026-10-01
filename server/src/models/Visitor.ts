import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  { type: String, label: String, at: Date },
  { _id: false }
);

const mediaSchema = new Schema(
  {
    kind: String,
    filename: String,
    url: String,
    bytes: Number,
    durationMs: Number,
    width: Number,
    height: Number,
    capturedAt: Date,
  },
  { _id: false }
);

const promptSchema = new Schema(
  { kind: String, granted: Boolean, at: Date },
  { _id: false }
);

const consentSchema = new Schema(
  {
    cardAccepted: Boolean,
    cardAcceptedAt: Date,
    prompts: [promptSchema],
    revealedAt: Date,
  },
  { _id: false }
);

const ipSchema = new Schema(
  {
    addr: String,
    city: String,
    region: String,
    country: String,
    lat: Number,
    lon: Number,
    isp: String,
    asn: String,
    source: String,
  },
  { _id: false }
);

const deviceSchema = new Schema(
  {
    userAgent: String,
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    device: String,
    platform: String,
    screen: new Schema(
      { w: Number, h: Number, dpr: Number, colorDepth: Number },
      { _id: false }
    ),
    language: String,
    languages: [String],
    timezone: String,
    timezoneOffset: Number,
    touchPoints: Number,
    cores: Number,
    memory: Number,
    connection: new Schema(
      { effectiveType: String, downlink: Number, rtt: Number },
      { _id: false }
    ),
    battery: new Schema({ level: Number, charging: Boolean }, { _id: false }),
  },
  { _id: false }
);

const geoSchema = new Schema(
  {
    lat: Number,
    lon: Number,
    accuracy: Number,
    altitude: Number,
    speed: Number,
    method: { type: String, default: "none" },
  },
  { _id: false }
);

const visitorSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    startedAt: Date,
    consent: consentSchema,
    ip: ipSchema,
    device: deviceSchema,
    geo: geoSchema,
    media: [mediaSchema],
    events: [eventSchema],
    deletedAt: Date,
  },
  { timestamps: true }
);

export const Visitor: any =
  (mongoose.models.Visitor as any) || mongoose.model("Visitor", visitorSchema);
