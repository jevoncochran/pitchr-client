/** For the "has a provider" outcome on visits and calls (session screen). */
export const PROVIDER_OPTIONS = [
  { value: "VIDEO", label: "Video provider" },
  { value: "MARKETING_AGENCY", label: "Marketing agency" },
  { value: "UNKNOWN", label: "Not sure" },
];

/** Messages: delivery at the time, response later. */
export const MESSAGE_TYPES = ["EMAIL", "INSTAGRAM_DM", "TEXT"];

/** A delivered message with no reply recorded yet, so "Record a reply" applies. */
export const canRecordReply = (tp: { type: string; delivery?: string | null; response?: string | null }) =>
  MESSAGE_TYPES.includes(tp.type) && tp.delivery !== "FAILED" && tp.response !== "REPLIED";

/** What happened on a visit or call. The first few only apply to one of them. */
export const OUTCOMES = [
  { value: "BUSINESS_CLOSED", label: "Business closed", types: ["IN_PERSON"] },
  { value: "NO_ANSWER", label: "No answer", types: ["CALL"] },
  { value: "LEFT_VOICEMAIL", label: "Left voicemail", types: ["CALL"] },
  { value: "DECISION_MAKER_NOT_AVAILABLE", label: "Decision-maker not available" },
  { value: "COME_BACK_LATER", label: "Come back later" },
  { value: "INTERESTED", label: "Interested" },
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "HAS_PROVIDER", label: "Has a provider" },
  { value: "NOT_A_FIT", label: "Not a fit" },
  { value: "MEETING_BOOKED", label: "Meeting booked" },
];

export const outcomesFor = (type: string) =>
  OUTCOMES.filter((o) => !o.types || o.types.includes(type));

export const OUTCOME_LABEL: Record<string, string> = Object.fromEntries(
  OUTCOMES.map((o) => [o.value, o.label]),
);

/** Outcomes that can come with a time to go back (a follow-up task is created) */
export const COME_BACK_OUTCOMES = ["COME_BACK_LATER", "INTERESTED", "DECISION_MAKER_NOT_AVAILABLE"];

/** Outcomes where nobody was reached (no "who did you talk to?") */
export const NO_CONVERSATION_OUTCOMES = ["BUSINESS_CLOSED", "NO_ANSWER", "LEFT_VOICEMAIL"];

/** Types a mixed session can log, each item at a time */
export const MIXED_TYPES = [
  { value: "IN_PERSON", label: "Visit" },
  { value: "CALL", label: "Call" },
  { value: "INSTAGRAM_DM", label: "Instagram DM" },
  { value: "EMAIL", label: "Email" },
  { value: "TEXT", label: "Text" },
];
