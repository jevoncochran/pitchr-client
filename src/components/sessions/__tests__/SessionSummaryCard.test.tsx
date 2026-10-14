import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SessionSummaryCard } from "../SessionSummaryCard";
import type { EndOfSessionSummary, SessionChannel } from "../../../types/sessions";

const summary = (overrides: Partial<EndOfSessionSummary> = {}): EndOfSessionSummary => ({
  sessionId: "s-1",
  startedAt: "2026-10-14T13:00:00.000Z",
  endedAt: "2026-10-14T14:35:00.000Z",
  durationMinutes: 95,
  itemCounts: { total: 12, planned: 0, completed: 10, skipped: 2 },
  conversations: 6,
  decisionMakersReached: 3,
  meetingsBooked: 1,
  outcomes: { INTERESTED: 4, MEETING_BOOKED: 1, BUSINESS_CLOSED: 2 },
  messages: { sent: 0, failed: 0 },
  followUps: [
    {
      id: "t-1",
      type: "EMAIL",
      note: "Did you send the follow-up email?",
      dueDate: "2026-10-14T14:00:00.000Z",
      completed: false,
      lead: { id: "lead-1", business: "Peak Roofing" },
    },
  ],
  ...overrides,
});

const renderCard = (s: EndOfSessionSummary, channel: SessionChannel = "IN_PERSON", goal: number | null = 15) =>
  render(
    <MemoryRouter>
      <SessionSummaryCard summary={s} channel={channel} goal={goal} />
    </MemoryRouter>,
  );

describe("SessionSummaryCard", () => {
  it("shows progress, duration, goal, outcome counts and follow-ups for visits", () => {
    renderCard(summary());

    expect(screen.getByText("10 of 12 stops visited")).toBeInTheDocument();
    expect(screen.getByText("1 h 35 min · Goal: 15 (5 short) · 2 skipped")).toBeInTheDocument();
    expect(screen.getByText("Conversations").previousSibling).toHaveTextContent("6");
    expect(screen.getByText("Decision-makers reached").previousSibling).toHaveTextContent("3");
    expect(screen.getByText("Meetings booked").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("Interested").nextSibling).toHaveTextContent("4");
    expect(screen.queryByText("Messages sent")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Peak Roofing" })).toHaveAttribute("href", "/leads/lead-1");
  });

  it("shows messages sent and failed for a DM session, without visit stats", () => {
    renderCard(
      summary({ outcomes: {}, conversations: 0, messages: { sent: 9, failed: 1 }, followUps: [] }),
      "INSTAGRAM_DM",
      null,
    );

    expect(screen.getByText("10 of 12 messages sent")).toBeInTheDocument();
    expect(screen.getByText("Messages sent").previousSibling).toHaveTextContent("9");
    expect(screen.getByText("Failed to send").previousSibling).toHaveTextContent("1");
    expect(screen.queryByText("Conversations")).not.toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});
