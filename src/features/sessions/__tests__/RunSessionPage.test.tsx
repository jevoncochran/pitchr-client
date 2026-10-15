import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RunSessionPage from "../RunSessionPage";
import { AuthContext } from "../../auth/AuthContext";
import api from "../../../lib/api";
import type { SessionDetail } from "../types";

vi.mock("../../../lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const lead = (id: string, business: string, contacts: SessionDetail["items"][number]["lead"]["contacts"] = []) => ({
  id,
  business,
  pipelineStage: "CONTACTED",
  industry: { name: "roofing" },
  primaryLocation: { addressLine1: "1 Main St", city: "Tampa", state: "FL", zip: "33602" },
  contacts,
});

const session = (overrides: Partial<SessionDetail> = {}): SessionDetail => ({
  id: "s-1",
  userId: "u-1",
  channel: "IN_PERSON",
  plannedFor: "2026-10-14T00:00:00.000Z",
  startedAt: "2026-10-14T13:00:00.000Z",
  endedAt: null,
  area: "South Tampa",
  goal: 2,
  notes: null,
  user: { id: "u-1", firstName: "Jevon", lastName: "C" },
  items: [
    {
      id: "item-1",
      position: 0,
      plannedTime: null,
      status: "PLANNED",
      lead: lead("lead-1", "Peak Roofing", [
        { id: "c-1", firstName: "Dana", lastName: "Lee", title: "Owner", isDecisionMaker: true },
      ]),
      touchPoint: null,
    },
    {
      id: "item-2",
      position: 1,
      plannedTime: null,
      status: "PLANNED",
      lead: lead("lead-2", "Bay Builders"),
      touchPoint: null,
    },
  ],
  ...overrides,
});

const renderPage = () =>
  render(
    <AuthContext.Provider value={{ user: { id: "u-1", firstName: "Jevon", lastName: "C", role: "STAFF" }, token: "t", login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter initialEntries={["/sessions/s-1/run"]}>
        <Routes>
          <Route path="/sessions/:id/run" element={<RunSessionPage />} />
          <Route path="/sessions/:id" element={<p>session page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("RunSessionPage (visits)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the next planned stop with its progress and Navigate link", async () => {
    mockApi.get.mockResolvedValue({ data: session() });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Peak Roofing" })).toBeInTheDocument();
    expect(screen.getByText(/Stop 1 of 2/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Navigate" })).toHaveAttribute(
      "href",
      expect.stringContaining("1%20Main%20St"),
    );
  });

  it("logs an outcome with the contact spoken to, then moves to the next stop", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: session() });
    const after = session();
    after.items[0] = { ...after.items[0], status: "COMPLETED", touchPoint: { id: "tp-1", type: "IN_PERSON", outcome: "INTERESTED", delivery: null, response: null } };
    mockApi.post.mockResolvedValue({ data: { session: after, touchpointId: "tp-1", suggestedStage: null } });
    renderPage();

    await screen.findByRole("heading", { name: "Peak Roofing" });
    const save = screen.getByRole("button", { name: /Save & next/ });
    expect(save).toBeDisabled(); // nothing picked yet

    await user.click(screen.getByRole("button", { name: "Interested" }));
    await user.click(screen.getByRole("button", { name: /Dana Lee/ }));
    await user.type(screen.getByPlaceholderText(/Note/), "Wants pricing");
    await user.click(save);

    expect(mockApi.post).toHaveBeenCalledWith("/api/sessions/s-1/log", expect.objectContaining({
      itemId: "item-1",
      type: "IN_PERSON",
      outcome: "INTERESTED",
      contactIds: ["c-1"],
      summary: "Wants pricing",
    }));
    expect(await screen.findByRole("heading", { name: "Bay Builders" })).toBeInTheDocument();
    expect(screen.getByText(/Stop 2 of 2/)).toBeInTheDocument();
  });

  it("starts a session that hasn't started yet", async () => {
    mockApi.get.mockResolvedValue({ data: session({ startedAt: null }) });
    mockApi.post.mockResolvedValue({ data: session() });
    renderPage();

    await screen.findByRole("heading", { name: "Peak Roofing" });
    expect(mockApi.post).toHaveBeenCalledWith("/api/sessions/s-1/start");
  });

  it("offers the suggested stage after 'not a fit'", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: session() });
    const after = session();
    after.items[0] = { ...after.items[0], status: "COMPLETED", touchPoint: { id: "tp-1", type: "IN_PERSON", outcome: "NOT_A_FIT", delivery: null, response: null } };
    mockApi.post.mockResolvedValue({ data: { session: after, touchpointId: "tp-1", suggestedStage: "NOT_A_FIT" } });
    mockApi.patch.mockResolvedValue({ data: {} });
    renderPage();

    await screen.findByRole("heading", { name: "Peak Roofing" });
    await user.click(screen.getByRole("button", { name: "Not a fit" }));
    await user.click(screen.getByRole("button", { name: /Save & next/ }));
    expect(await screen.findByText("Move to Not a Fit?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Move" }));
    await waitFor(() =>
      expect(mockApi.patch).toHaveBeenCalledWith("/api/leads/lead-1", { pipelineStage: "NOT_A_FIT" }),
    );
  });

  it("closed business: no 'who did you talk to'", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: session() });
    renderPage();

    await screen.findByRole("heading", { name: "Peak Roofing" });
    await user.click(screen.getByRole("button", { name: "Business closed" }));
    expect(screen.queryByText(/Who did you talk to/)).not.toBeInTheDocument();
  });
});

describe("RunSessionPage (messages)", () => {
  it("logs a DM as sent with one tap", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: session({ channel: "INSTAGRAM_DM" }) });
    mockApi.post.mockResolvedValue({ data: { session: session({ channel: "INSTAGRAM_DM" }), touchpointId: "tp-1", suggestedStage: null } });
    renderPage();

    await screen.findByText("Peak Roofing");
    await user.click(screen.getAllByRole("button", { name: "Sent" })[0]);

    expect(mockApi.post).toHaveBeenCalledWith("/api/sessions/s-1/log", {
      itemId: "item-1",
      type: "INSTAGRAM_DM",
      delivery: "SENT",
      summary: null,
    });
  });
});
