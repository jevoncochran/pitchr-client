import { PipelineStage } from "../types.d";

export const PIPELINE_STAGES = [
  { value: PipelineStage.New, label: "New" },
  { value: PipelineStage.Contacted, label: "Contacted" },
  { value: PipelineStage.Engaged, label: "Engaged" },
  { value: PipelineStage.MeetingScheduled, label: "Meeting Scheduled" },
  { value: PipelineStage.ProposalSent, label: "Proposal Sent" },
  { value: PipelineStage.Converted, label: "Converted" },
  { value: PipelineStage.Dormant, label: "Dormant" },
  { value: PipelineStage.NotAFit, label: "Not a Fit" },
  { value: PipelineStage.Lost, label: "Lost" },
];

// Sequence position options for the touchpoint form
export const IN_PERSON_TYPES = ["IN_PERSON", "MEETING"];

export const SEQUENCE_POSITIONS_VISIT = [
  { value: "", label: "None (one-off)" },
  { value: "VISIT_A", label: "Visit A" },
  { value: "VISIT_B", label: "Visit B" },
  { value: "VISIT_C", label: "Visit C" },
];

export const SEQUENCE_POSITIONS_OUTREACH = [
  { value: "", label: "None (one-off)" },
  { value: "A1", label: "A1 — First outreach after Visit A" },
  { value: "A2", label: "A2 — Second outreach" },
  { value: "A3", label: "A3 — Third outreach" },
  { value: "B1", label: "B1 — First outreach after Visit B" },
  { value: "B2", label: "B2 — Second outreach" },
  { value: "B3", label: "B3 — Third outreach" },
  { value: "C1", label: "C1 — First outreach after Visit C" },
  { value: "C2", label: "C2 — Second outreach" },
  { value: "C3", label: "C3 — Third outreach" },
];

export const SEQUENCE_POSITIONS = [
  ...SEQUENCE_POSITIONS_VISIT,
  ...SEQUENCE_POSITIONS_OUTREACH.slice(1), // skip the duplicate "None"
];

export const SEQUENCE_POSITION_LABEL: Record<string, string> = {
  VISIT_A: "Visit A",
  A1: "A1", A2: "A2", A3: "A3",
  VISIT_B: "Visit B",
  B1: "B1", B2: "B2", B3: "B3",
  VISIT_C: "Visit C",
  C1: "C1", C2: "C2", C3: "C3",
};

export const SEQUENCE_POSITION_COLOR: Record<string, string> = {
  VISIT_A: "bg-blue-100 text-blue-700",
  A1: "bg-blue-50 text-blue-600",
  A2: "bg-blue-50 text-blue-600",
  A3: "bg-blue-50 text-blue-600",
  VISIT_B: "bg-orange-100 text-orange-700",
  B1: "bg-orange-50 text-orange-600",
  B2: "bg-orange-50 text-orange-600",
  B3: "bg-orange-50 text-orange-600",
  VISIT_C: "bg-purple-100 text-purple-700",
  C1: "bg-purple-50 text-purple-600",
  C2: "bg-purple-50 text-purple-600",
  C3: "bg-purple-50 text-purple-600",
};

// Follow-up sequence: what the check-in asks at step N (after outreach N)
export const CHECK_IN_LABELS: Record<number, string> = {
  1: "Did they respond to outreach A1?",
  2: "Did they respond to outreach A2?",
  3: "Did they respond to outreach A3?",
  4: "Did they respond to outreach B1?",
  5: "Did they respond to outreach B2?",
  6: "Did they respond to outreach B3?",
  7: "Did they respond to outreach C1?",
  8: "Did they respond to outreach C2?",
  9: "Did they respond to outreach C3?",
};

// What happens at each step if no response
export const NEXT_ACTION_LABELS: Record<number, string> = {
  1: "Outreach A2",
  2: "Outreach A3",
  3: "Visit B",
  4: "Outreach B2",
  5: "Outreach B3",
  6: "Visit C",
  7: "Outreach C2",
  8: "Outreach C3",
  9: "Deprioritize — full cycle complete",
};

export const TOUCHPOINT_TYPES = [
  { value: "IN_PERSON", label: "In Person" },
  { value: "MEETING", label: "Meeting" },
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "TEXT", label: "Text" },
  { value: "INSTAGRAM_DM", label: "Instagram DM" },
];

export const stageColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  ENGAGED: "bg-yellow-100 text-yellow-700",
  MEETING_SCHEDULED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  DORMANT: "bg-gray-200 text-gray-500",
  NOT_A_FIT: "bg-red-100 text-red-600",
  LOST: "bg-rose-100 text-rose-700",
};
