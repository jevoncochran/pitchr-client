import type { SessionChannel, SessionDetail } from "./types";

/** How outreach is done in a session, and what the screen calls each item. */
export const CHANNELS: {
  value: SessionChannel;
  label: string;
  /** What one item on the list is called, e.g. "Stop 3 of 12" */
  item: string;
  items: string;
  /** "10 of 12 stops visited" */
  done: string;
}[] = [
  { value: "IN_PERSON", label: "In person", item: "stop", items: "stops", done: "visited" },
  { value: "CALL", label: "Calls", item: "call", items: "calls", done: "made" },
  { value: "INSTAGRAM_DM", label: "Instagram DMs", item: "message", items: "messages", done: "sent" },
  { value: "EMAIL", label: "Emails", item: "email", items: "emails", done: "sent" },
  { value: "TEXT", label: "Texts", item: "message", items: "messages", done: "sent" },
  { value: "MIXED", label: "Mixed", item: "lead", items: "leads", done: "contacted" },
];

export const channelInfo = (channel: SessionChannel) =>
  CHANNELS.find((c) => c.value === channel) ?? CHANNELS[CHANNELS.length - 1];

/** Planned (not started), in progress, or ended. */
export const sessionStatus = (s: { startedAt: string | null; endedAt: string | null }) =>
  s.endedAt ? "ended" : s.startedAt ? "inProgress" : "planned";

/** A Google Maps directions link (opens the Maps app on phones). */
export const directionsUrl = (address: {
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
}) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${address.addressLine1}, ${address.city}, ${address.state} ${address.zip}`,
  )}`;

/** "12 min", "1 h 40 min" */
export const formatDriveTime = (seconds: number) => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ""}`;
};

/** "4.3 mi" (under 10 miles), "38 mi" */
export const formatMiles = (meters: number) => {
  const miles = meters / 1609.344;
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
};

/** Sessions where stops are visited, so they get the map and route planning */
export const isVisitChannel = (channel: SessionChannel) =>
  channel === "IN_PERSON" || channel === "MIXED";

/** "1 h 40 min · 38 mi driving", or what to do when there's no route yet */
export const routeSummary = (session: SessionDetail) => {
  if (session.routeSeconds != null && session.routeMeters != null) {
    return `${formatDriveTime(session.routeSeconds)} · ${formatMiles(session.routeMeters)} driving${
      session.routeReturns ? " (round trip)" : ""
    }`;
  }
  // A start but no line means the order was changed by hand after optimizing
  return session.routeStartLat != null ? "Order changed · Re-optimize for drive times" : "Not optimized yet";
};
