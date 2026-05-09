import { describe, it, expect } from "vitest";
import { countTouchedThisWeek, countTouchedLastWeek } from "./dashboardCalcs";

// "now" is pinned to Saturday 2026-05-09 for all tests in this file
const NOW = new Date("2026-05-09T12:00:00Z");

// ─── countTouchedThisWeek ─────────────────────────────────────────────────────
// These tests pass a flat array of touchpoint objects (the shape returned by
// GET /api/touchpoints), NOT the nested leads array.

describe("countTouchedThisWeek", () => {
  it("returns 0 when there are no touchpoints", () => {
    expect(countTouchedThisWeek([], NOW)).toBe(0);
  });

  it("returns 0 when all touchpoints are older than 7 days", () => {
    const touchpoints = [
      { date: "2026-04-30T10:00:00Z" }, // 9 days ago
    ];
    expect(countTouchedThisWeek(touchpoints, NOW)).toBe(0);
  });

  it("returns 1 when there is exactly one touchpoint this week", () => {
    const touchpoints = [
      { date: "2026-05-08T10:00:00Z" }, // Friday — within 7 days
    ];
    expect(countTouchedThisWeek(touchpoints, NOW)).toBe(1);
  });

  it("counts each touchpoint individually even when they are on the same lead", () => {
    const touchpoints = [
      { date: "2026-05-09T10:00:00Z" }, // Saturday — follow-up email
      { date: "2026-05-08T10:00:00Z" }, // Friday   — in-person visit
    ];
    expect(countTouchedThisWeek(touchpoints, NOW)).toBe(2);
  });

  it("counts touchpoints across multiple leads", () => {
    const touchpoints = [
      { date: "2026-05-09T10:00:00Z" }, // lead A — this week
      { date: "2026-05-07T10:00:00Z" }, // lead A — this week
      { date: "2026-05-06T10:00:00Z" }, // lead B — this week
    ];
    expect(countTouchedThisWeek(touchpoints, NOW)).toBe(3);
  });

  it("ignores touchpoints outside the 7-day window", () => {
    const touchpoints = [
      { date: "2026-05-09T10:00:00Z" }, // this week  ✓
      { date: "2026-04-30T10:00:00Z" }, // 9 days ago ✗
    ];
    expect(countTouchedThisWeek(touchpoints, NOW)).toBe(1);
  });

  it("does not count VISIT_ATTEMPT touchpoints (no contact was made)", () => {
    const touchpoints = [
      { date: "2026-05-09T10:00:00Z", type: "EMAIL" },         // counts ✓
      { date: "2026-05-08T10:00:00Z", type: "VISIT_ATTEMPT" }, // no contact ✗
      { date: "2026-05-07T10:00:00Z", type: "VISIT_ATTEMPT" }, // no contact ✗
    ];
    expect(countTouchedThisWeek(touchpoints, NOW)).toBe(1);
  });
});

// ─── Real-world scenarios ─────────────────────────────────────────────────────

describe("real-world scenarios", () => {
  /**
   * Scenario: user adds one lead, visits the business in-person on Friday,
   * then sends a follow-up email on Saturday. The Touchpoints stat card
   * should show 2 — one for each outreach action, not one for the lead.
   */
  it("shows 2 after an in-person visit on Friday and a follow-up email on Saturday for the same lead", () => {
    // now = Saturday 2026-05-09 (defined at top of file)
    const touchpoints = [
      { date: "2026-05-08T14:00:00Z", type: "IN_PERSON_VISIT" }, // Friday
      { date: "2026-05-09T10:00:00Z", type: "EMAIL" },           // Saturday
    ];

    expect(countTouchedThisWeek(touchpoints, NOW)).toBe(2);
  });
});

// ─── countTouchedLastWeek ─────────────────────────────────────────────────────

describe("countTouchedLastWeek", () => {
  it("returns 0 when there are no touchpoints", () => {
    expect(countTouchedLastWeek([], NOW)).toBe(0);
  });

  it("counts touchpoints that fall in the 7–14 day window", () => {
    const touchpoints = [
      { date: "2026-05-03T10:00:00Z" }, // 6 days ago  — this week, not last ✗
      { date: "2026-05-01T10:00:00Z" }, // 8 days ago  — last week ✓
      { date: "2026-04-28T10:00:00Z" }, // 11 days ago — last week ✓
      { date: "2026-04-24T10:00:00Z" }, // 15 days ago — too old ✗
    ];
    expect(countTouchedLastWeek(touchpoints, NOW)).toBe(2);
  });
});
