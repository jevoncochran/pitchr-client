import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TouchpointResultBadges,
  TouchpointResultDetails,
  type TouchpointResultFields,
} from "../TouchpointResult";
import { canRecordReply } from "../results";

const renderResult = (tp: TouchpointResultFields) =>
  render(
    <div>
      <TouchpointResultBadges tp={tp} />
      <TouchpointResultDetails tp={tp} />
    </div>,
  );

describe("TouchpointResult", () => {
  it("shows a visit's outcome with the provider type", () => {
    renderResult({ type: "IN_PERSON", outcome: "HAS_PROVIDER", providerType: "MARKETING_AGENCY", leftMaterials: true });

    expect(screen.getByText("Has a provider · marketing agency")).toBeInTheDocument();
    expect(screen.getByText("Left materials")).toBeInTheDocument();
  });

  it("shows a pending message and offers to record a reply", () => {
    const tp = { type: "INSTAGRAM_DM", delivery: "SENT", response: "PENDING" };
    renderResult(tp);

    expect(screen.getByText("Sent · Pending")).toBeInTheDocument();
    expect(canRecordReply(tp)).toBe(true);
  });

  it("shows their reply and its date, with nothing left to record", () => {
    const tp = {
      type: "EMAIL",
      delivery: "SENT",
      response: "REPLIED",
      responseText: "Sounds great, what do you charge?",
      respondedOn: "2026-10-12T00:00:00.000Z",
    };
    renderResult(tp);

    expect(screen.getByText("Sent · Replied")).toBeInTheDocument();
    expect(screen.getByText("Sounds great, what do you charge?")).toBeInTheDocument();
    expect(screen.getByText(/Their reply · .*Oct 12/)).toBeInTheDocument();
    expect(canRecordReply(tp)).toBe(false);
  });

  it("still takes a reply after No response, but not on a failed message or a visit", () => {
    expect(canRecordReply({ type: "TEXT", delivery: "SENT", response: "NO_RESPONSE" })).toBe(true);
    expect(canRecordReply({ type: "EMAIL", delivery: "FAILED" })).toBe(false);
    expect(canRecordReply({ type: "IN_PERSON" })).toBe(false);

    renderResult({ type: "EMAIL", delivery: "FAILED" });
    expect(screen.getByText("Not delivered")).toBeInTheDocument();
  });

  it("shows older messages as responded when they were marked that way", () => {
    renderResult({ type: "EMAIL", receivedResponse: true });

    expect(screen.getByText("Responded")).toBeInTheDocument();
  });
});
