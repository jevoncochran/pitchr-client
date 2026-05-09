import { describe, it, expect } from "vitest";
import { countTouchedThisWeek, countTouchedLastWeek } from "./dashboardCalcs";

// "now" is pinned to Saturday 2026-05-09 for all tests in this file
const NOW = new Date("2026-05-09T12:00:00Z");

// ─── countTouchedThisWeek ─────────────────────────────────────────────────────

describe("countTouchedThisWeek", () => {
  it("returns 0 when there are no leads", () => {
    expect(countTouchedThisWeek([], NOW)).toBe(0);
  });

  it("returns 0 when a lead has no touchpoints", () => {
    const leads = [{ touchPoint: [] }];
    expect(countTouchedThisWeek(leads, NOW)).toBe(0);
  });

  it("returns 0 when all touchpoints are older than 7 days", () => {
    const leads = [
      {
        touchPoint: [
          { date: "2026-04-30T10:00:00Z" }, // 9 days ago
        ],
      },
    ];
    expect(countTouchedThisWeek(leads, NOW)).toBe(0);
  });

  it("returns 1 when a lead has exactly one touchpoint this week", () => {
    const leads = [
      {
        touchPoint: [
          { date: "2026-05-08T10:00:00Z" }, // Friday — within 7 days
        ],
      },
    ];
    expect(countTouchedThisWeek(leads, NOW)).toBe(1);
  });

  /**
   * THE CORE SCENARIO:
   * User adds one lead, logs an in-person visit on Friday, then a follow-up
   * email on Saturday. The stat card should count both touchpoints → 2.
   */
  it("counts each touchpoint individually even when they are on the same lead", () => {
    const leads = [
      {
        touchPoint: [
          { date: "2026-05-09T10:00:00Z" }, // Saturday — follow-up email
          { date: "2026-05-08T10:00:00Z" }, // Friday  — in-person visit
        ],
      },
    ];
    expect(countTouchedThisWeek(leads, NOW)).toBe(2);
  });

  it("counts touchpoints across multiple leads", () => {
    const leads = [
      {
        touchPoint: [
          { date: "2026-05-09T10:00:00Z" }, // this week
          { date: "2026-05-07T10:00:00Z" }, // this week
        ],
      },
      {
        touchPoint: [
          { date: "2026-05-06T10:00:00Z" }, // this week
        ],
      },
    ];
    expect(countTouchedThisWeek(leads, NOW)).toBe(3);
  });

  it("ignores touchpoints outside the 7-day window even if the lead has recent ones too", () => {
    const leads = [
      {
        touchPoint: [
          { date: "2026-05-09T10:00:00Z" }, // this week  ✓
          { date: "2026-04-30T10:00:00Z" }, // 9 days ago ✗
        ],
      },
    ];
    expect(countTouchedThisWeek(leads, NOW)).toBe(1);
  });
});

// ─── countTouchedLastWeek ─────────────────────────────────────────────────────

describe("countTouchedLastWeek", () => {
  it("returns 0 when there are no leads", () => {
    expect(countTouchedLastWeek([], NOW)).toBe(0);
  });

  it("counts touchpoints that fall in the 7–14 day window", () => {
    const leads = [
      {
        touchPoint: [
          { date: "2026-05-03T10:00:00Z" }, // 6 days ago — this week, not last
          { date: "2026-05-01T10:00:00Z" }, // 8 days ago — last week ✓
          { date: "2026-04-28T10:00:00Z" }, // 11 days ago — last week ✓
          { date: "2026-04-24T10:00:00Z" }, // 15 days ago — too old ✗
        ],
      },
    ];
    expect(countTouchedLastWeek(leads, NOW)).toBe(2);
  });
});
