// Shapes returned by the sessions API (pitchr-server src/sessions/)

export type SessionChannel =
  | "IN_PERSON"
  | "CALL"
  | "INSTAGRAM_DM"
  | "EMAIL"
  | "TEXT"
  | "MIXED";

export type SessionItemStatus = "PLANNED" | "COMPLETED" | "SKIPPED";

export interface ItemCounts {
  total: number;
  planned: number;
  completed: number;
  skipped: number;
}

export interface SessionUserSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SessionSummary {
  id: string;
  channel: SessionChannel;
  /** ISO date at midnight UTC; use the first 10 characters (YYYY-MM-DD) */
  plannedFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  area: string | null;
  goal: number | null;
  notes: string | null;
  user: SessionUserSummary;
  itemCounts: ItemCounts;
}

export interface SessionContact {
  id: string;
  firstName: string;
  lastName: string | null;
  title: string | null;
  isDecisionMaker: boolean;
}

export interface SessionItem {
  id: string;
  position: number;
  plannedTime: string | null;
  status: SessionItemStatus;
  lead: {
    id: string;
    business: string;
    pipelineStage: string;
    industry: { name: string } | null;
    primaryLocation: {
      addressLine1: string;
      city: string;
      state: string;
      zip: string;
    } | null;
    contacts: SessionContact[];
  };
  touchPoint: {
    id: string;
    type: string;
    outcome: string | null;
    delivery: string | null;
    response: string | null;
  } | null;
}

export interface SessionDetail extends Omit<SessionSummary, "itemCounts"> {
  userId: string;
  items: SessionItem[];
}
