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
// No real Google script in tests
vi.mock("../../../lib/googleMaps", () => ({ loadGoogleMaps: () => new Promise(() => {}) }));
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
  primaryLocation: {
    addressLine1: "1 Main St",
    city: "Tampa",
    state: "FL",
    zip: "33602",
    latitude: 27.95,
    longitude: -82.46,
  },
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
  routePolyline: null,
  routeStartLabel: null,
  routeStartLat: null,
  routeStartLng: null,
  routeReturns: null,
  routeSeconds: null,
  routeMeters: null,
  routeOptimizedAt: null,
  items: [
    {
      id: "item-1",
      position: 0,
      plannedTime: null,
      status: "PLANNED",
      legSeconds: null,
      legMeters: null,
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
      legSeconds: null,
      legMeters: null,
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

  it("fills in the visit from a dictated note for the current stop, and logs it with the debrief", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: session() });
    mockApi.post.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.endsWith("/debrief")
          ? {
              debriefId: "d-1",
              proposal: {
                model: "claude-haiku-5-5",
                outcome: "INTERESTED",
                providerType: null,
                comeBackDate: null,
                comeBackTime: null,
                comeBackEstimate: null,
                leftMaterials: false,
                summary: "We spoke with Dana, the owner, who wants pricing.",
                people: [
                  { contactId: "c-1", candidateContactIds: [], firstName: "Dana", lastName: "Lee", title: null, isDecisionMaker: null, spokeWith: true },
                ],
                questions: [],
              },
            }
          : { session: session(), touchpointId: "tp-1", suggestedStage: null },
      }),
    );
    renderPage();
    await screen.findByRole("heading", { name: "Peak Roofing" });

    await user.type(screen.getByLabelText("What happened?"), "talked to dana she wants pricing");
    await user.click(screen.getByRole("button", { name: "Fill in" }));

    expect(mockApi.post).toHaveBeenCalledWith("/api/sessions/s-1/debrief", {
      itemId: "item-1",
      note: "talked to dana she wants pricing",
    });
    await waitFor(() => expect(screen.getByLabelText("Summary")).toHaveValue("We spoke with Dana, the owner, who wants pricing."));
    await user.click(screen.getByRole("button", { name: /Save & next/ }));

    expect(mockApi.post).toHaveBeenCalledWith("/api/sessions/s-1/log", expect.objectContaining({
      itemId: "item-1",
      outcome: "INTERESTED",
      contactIds: ["c-1"],
      debriefId: "d-1",
      summary: "We spoke with Dana, the owner, who wants pricing.",
    }));
  });

  it("re-optimizes the stops left from my location, from the map", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 27.96, longitude: -82.44 } } as GeolocationPosition),
      },
    });
    mockApi.get.mockResolvedValue({ data: session() });
    mockApi.post.mockResolvedValue({ data: session({ routeSeconds: 900, routeMeters: 8000 }) });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Map" }));
    expect(screen.getByRole("dialog", { name: "Map of stops" })).toHaveTextContent("2 stops left");
    await userEvent.click(screen.getByRole("button", { name: "Re-optimize from here" }));

    expect(mockApi.post).toHaveBeenCalledWith("/api/sessions/s-1/route", {
      start: { latitude: 27.96, longitude: -82.44, label: "My location" },
      returnToStart: false,
    });
    expect(await screen.findByText("15 min · 5.0 mi driving")).toBeInTheDocument();
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
