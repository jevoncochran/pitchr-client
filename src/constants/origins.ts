/** How a lead started (pitchr-server's docs/lead-origin.md). Only set by hand; empty until known. */
export const ORIGIN_GROUPS = [
  {
    value: "WE_REACHED_OUT",
    label: "We reached out",
    origins: [
      { value: "IN_PERSON_VISIT", label: "In-person visit" },
      { value: "DM", label: "DM" },
      { value: "EMAIL", label: "Email" },
      { value: "TEXT", label: "Text" },
      { value: "CALL", label: "Call" },
      { value: "NETWORKING_EVENT", label: "Networking event" },
    ],
  },
  {
    value: "THEY_CAME_TO_US",
    label: "They came to us",
    origins: [
      { value: "APPROACHED_US", label: "Approached us" },
      { value: "WEBSITE_FORM", label: "Website form" },
      { value: "REFERRAL", label: "Referral" },
      { value: "INSTAGRAM", label: "Instagram" },
      { value: "FACEBOOK", label: "Facebook" },
      { value: "TIKTOK", label: "TikTok" },
      { value: "YOUTUBE", label: "YouTube" },
      { value: "GOOGLE", label: "Google" },
      { value: "OTHER", label: "Other" },
    ],
  },
] as const;

export type OriginGroup = (typeof ORIGIN_GROUPS)[number]["value"];

export const ORIGIN_LABEL: Record<string, string> = Object.fromEntries(
  ORIGIN_GROUPS.flatMap((g) => g.origins.map((o) => [o.value, o.label])),
);

export const ORIGIN_GROUP_OF: Record<string, OriginGroup> = Object.fromEntries(
  ORIGIN_GROUPS.flatMap((g) => g.origins.map((o) => [o.value, g.value])),
);

/** "Instagram", or Other's description. Null when not known. */
export const originLabel = (lead: { origin?: string | null; originOther?: string | null }) =>
  !lead.origin
    ? null
    : lead.origin === "OTHER"
      ? lead.originOther || "Other"
      : (ORIGIN_LABEL[lead.origin] ?? lead.origin);

/** What a business added on the spot in a session most likely started as (preselected, changeable). */
export const SESSION_CHANNEL_ORIGIN: Record<string, string> = {
  IN_PERSON: "IN_PERSON_VISIT",
  CALL: "CALL",
  INSTAGRAM_DM: "DM",
  EMAIL: "EMAIL",
  TEXT: "TEXT",
  MIXED: "IN_PERSON_VISIT",
};
