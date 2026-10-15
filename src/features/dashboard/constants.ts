export const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ENGAGED: "Engaged",
  MEETING_SCHEDULED: "Meeting Scheduled",
  PROPOSAL_SENT: "Proposal Sent",
  CONVERTED: "Converted",
  DORMANT: "Dormant",
  NOT_A_FIT: "Not a Fit",
  LOST: "Lost",
};

export const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-600",
  CONTACTED: "bg-blue-100 text-blue-700",
  ENGAGED: "bg-yellow-100 text-yellow-700",
  MEETING_SCHEDULED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  DORMANT: "bg-gray-200 text-gray-500",
  NOT_A_FIT: "bg-red-100 text-red-600",
  LOST: "bg-rose-100 text-rose-700",
};

export const TP_LABELS: Record<string, string> = {
  EMAIL: "Email",
  IN_PERSON: "In Person",
  CALL: "Call",
  TEXT: "Text",
  MEETING: "Meeting",
  INSTAGRAM_DM: "Instagram DM",
  NETWORKING: "Networking Event",
  WALK_UP: "Walk-Up",
  VISIT_ATTEMPT: "Visit Attempt",
  REFERRAL_OUTREACH: "Referral / 3rd-Party Contact",
  OTHER: "Other",
};

// Touchpoint types that do NOT count as making contact (e.g. nobody answered).
// Excluded from the Touchpoints stat card and the Activity Goals counts.
export const NO_CONTACT_TYPES = new Set(["VISIT_ATTEMPT"]);

export type GoalPeriod = "today" | "week" | "month";

// Targets are explicit per period. Omitting "today" means the channel is
// not shown on the Today tab (e.g. networking — you can't plan for it daily).
export const ACTIVITY_CHANNELS: Record<
  string,
  {
    label: string;
    category: "outreach" | "followup";
    targets: Partial<Record<GoalPeriod, number>>;
  }
> = {
  IN_PERSON: {
    label: "Door Knocks",
    category: "outreach",
    targets: { today: 10, week: 50, month: 220 },
  },
  INSTAGRAM_DM: {
    label: "Instagram DMs",
    category: "outreach",
    targets: { today: 10, week: 50, month: 220 },
  },
  EMAIL: {
    label: "Emails",
    category: "followup",
    targets: { today: 20, week: 100, month: 440 },
  },
  CALL: {
    label: "Calls",
    category: "followup",
    targets: { today: 5, week: 25, month: 110 },
  },
  TEXT: {
    label: "Texts",
    category: "followup",
    targets: { today: 10, week: 50, month: 220 },
  },
  NETWORKING: {
    label: "Networking",
    category: "outreach",
    targets: { week: 3, month: 12 },
  },
};

export const REVENUE_GOAL = 5000;
export const AVG_DEAL_SIZE = 700;

export const NEXT_ACTION_LABELS: Record<number, string> = {
  1: "Outreach A2",
  2: "Outreach A3",
  3: "Visit B",
  4: "Outreach B2",
  5: "Outreach B3",
  6: "Visit C",
  7: "Outreach C2",
  8: "Outreach C3",
  9: "Deprioritize",
};
