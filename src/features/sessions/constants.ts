import type { SessionChannel } from "./types";

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
