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
  /** Drive from the previous point of the optimized route (cleared when the order changes by hand) */
  legSeconds: number | null;
  legMeters: number | null;
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
      /** Null until the address has been found on the map */
      latitude: number | null;
      longitude: number | null;
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

/** A follow-up task created by something logged in the session. */
export interface SessionFollowUp {
  id: string;
  type: string;
  note: string | null;
  dueDate: string | null;
  completed: boolean;
  lead: { id: string; business: string } | null;
}

/** What an ended session got done (POST /sessions/:id/end, and on the detail once ended). */
export interface EndOfSessionSummary {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  itemCounts: ItemCounts;
  /** Visits and calls where someone was spoken to */
  conversations: number;
  /** Leads where a decision-maker was spoken to */
  decisionMakersReached: number;
  meetingsBooked: number;
  /** How many of each outcome, e.g. { INTERESTED: 3 } */
  outcomes: Record<string, number>;
  messages: { sent: number; failed: number };
  followUps: SessionFollowUp[];
}

export interface SessionDetail extends Omit<SessionSummary, "itemCounts"> {
  userId: string;
  items: SessionItem[];
  /** The last optimized route (pitchr-server docs/route-planning.md). The line,
   * totals and time are cleared when the order changes by hand; the start stays. */
  routePolyline: string | null;
  routeStartLabel: string | null;
  routeStartLat: number | null;
  routeStartLng: number | null;
  routeReturns: boolean | null;
  routeSeconds: number | null;
  routeMeters: number | null;
  routeOptimizedAt: string | null;
  /** Only once the session has ended */
  summary?: EndOfSessionSummary;
}
