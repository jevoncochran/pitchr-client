/** Interest a lead showed on their own (vs. touchpoints, which are our outreach). */
export const SIGNAL_TYPES = [
  { value: "FOLLOW",          label: "Followed us",                 social: true },
  { value: "POST_ENGAGEMENT", label: "Liked or commented on a post", social: true },
  { value: "DIRECT_MESSAGE",  label: "Sent us a DM",                social: true },
  { value: "WEBSITE_FORM",    label: "Filled out the website form", social: false },
  { value: "REFERRAL",        label: "Referred by someone",         social: false },
];

/** Networks a social signal can happen on. */
export const SOCIAL_PLATFORMS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK",  label: "Facebook" },
  { value: "TIKTOK",    label: "TikTok" },
  { value: "YOUTUBE",   label: "YouTube" },
  { value: "LINKEDIN",  label: "LinkedIn" },
  { value: "OTHER",     label: "Other" },
];

/** Quick-lookup label maps derived from the lists above. */
export const SIGNAL_LABEL: Record<string, string> = Object.fromEntries(
  SIGNAL_TYPES.map((t) => [t.value, t.label])
);
export const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.value, p.label])
);

export const isSocialSignal = (type: string) =>
  SIGNAL_TYPES.some((t) => t.value === type && t.social);
