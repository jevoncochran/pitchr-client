/** Types available when logging any touchpoint (lead or contact). */
export const TOUCHPOINT_TYPES = [
  { value: "IN_PERSON",         label: "In Person Visit" },
  { value: "NETWORKING",        label: "Networking Event" },
  { value: "WALK_UP",           label: "Walk-Up / Organic Inquiry" },
  { value: "REFERRAL_OUTREACH", label: "Referral / 3rd-Party Contact" },
  { value: "MEETING",           label: "Meeting" },
  { value: "CALL",              label: "Call" },
  { value: "EMAIL",             label: "Email" },
  { value: "TEXT",              label: "Text" },
  { value: "INSTAGRAM_DM",      label: "Instagram DM" },
  { value: "VISIT_ATTEMPT",     label: "Visit Attempt — no contact" },
  { value: "OTHER",             label: "Other" },
];

/** Quick-lookup label map derived from TOUCHPOINT_TYPES. */
export const TOUCHPOINT_LABEL: Record<string, string> = Object.fromEntries(
  TOUCHPOINT_TYPES.map((t) => [t.value, t.label])
);

/** Emoji icons for display in touchpoint timelines. */
export const TOUCHPOINT_ICONS: Record<string, string> = {
  IN_PERSON:         "🤝",
  NETWORKING:        "🌐",
  WALK_UP:           "🚶",
  REFERRAL_OUTREACH: "🔗",
  MEETING:           "📅",
  CALL:              "📞",
  EMAIL:             "✉️",
  TEXT:              "💬",
  INSTAGRAM_DM:      "📸",
  VISIT_ATTEMPT:     "🚪",
  OTHER:             "📌",
};

/**
 * Types that represent a physical visit / in-person presence.
 * Used to show the sequence-position selector for visits vs. outreach.
 */
export const IN_PERSON_TYPES = ["IN_PERSON", "MEETING"];
