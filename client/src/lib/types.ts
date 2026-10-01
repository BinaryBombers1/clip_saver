export type Media = {
  kind: "photo" | "clip";
  url: string;
  filename?: string;
  bytes?: number;
  durationMs?: number;
  width?: number;
  height?: number;
  capturedAt?: string;
};

export type Prompt = { kind: string; granted: boolean; at?: string };

export type SessionEvent = { type: string; label: string; at: string };

export type Visitor = {
  token: string;
  createdAt?: string;
  startedAt?: string;
  points?: number;
  durationMs?: number;
  consent?: {
    cardAccepted?: boolean;
    cardAcceptedAt?: string;
    prompts?: Prompt[];
    revealedAt?: string;
  };
  ip?: {
    addr?: string;
    city?: string;
    region?: string;
    country?: string;
    lat?: number;
    lon?: number;
    isp?: string;
    asn?: string;
    source?: string;
  };
  device?: {
    userAgent?: string;
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    device?: string;
    platform?: string;
    screen?: { w?: number; h?: number; dpr?: number; colorDepth?: number };
    language?: string;
    languages?: string[];
    timezone?: string;
    timezoneOffset?: number;
    touchPoints?: number;
    cores?: number;
    memory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
    battery?: { level?: number; charging?: boolean };
  };
  geo?: {
    lat?: number;
    lon?: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    method?: string;
  };
  media?: Media[];
  events?: SessionEvent[];
};

export type FeedLine = { text: string; kind: string; at: string };
