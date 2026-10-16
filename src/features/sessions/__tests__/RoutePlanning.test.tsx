import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomSheet } from "../BottomSheet";
import { StopList } from "../StopList";
import { OptimizeRouteDialog } from "../OptimizeRouteDialog";
import { formatDriveTime, formatMiles, routeSummary } from "../constants";
import api from "../../../lib/api";
import type { SessionDetail, SessionItem } from "../types";

vi.mock("../../../lib/api", () => ({ default: { post: vi.fn() } }));
// No real Google script in tests
vi.mock("../../../lib/googleMaps", () => ({ loadGoogleMaps: () => new Promise(() => {}) }));
// The address search, simplified: "Pick" behaves like choosing Google's suggestion,
// which reports the picked address and then its street line as the new text
vi.mock("../../../components/ui/AddressAutocomplete", () => ({
  default: ({ onSelect, onChange }: { onSelect: (a: object) => void; onChange: (t: string) => void }) => (
    <button
      type="button"
      onClick={() => {
        onSelect({ addressLine1: "333 S Franklin St", city: "Tampa", state: "FL", zip: "33602", latitude: 27.94, longitude: -82.45, googlePlaceId: "p" });
        onChange("333 S Franklin St");
      }}
    >
      Pick
    </button>
  ),
}));
const post = api.post as unknown as ReturnType<typeof vi.fn>;

const item = (id: string, business: string, overrides: Partial<SessionItem> = {}): SessionItem => ({
  id,
  position: 0,
  plannedTime: null,
  status: "PLANNED",
  legSeconds: null,
  legMeters: null,
  lead: {
    id: `lead-${id}`,
    business,
    pipelineStage: "NEW",
    industry: null,
    primaryLocation: { addressLine1: "1 Main St", city: "Tampa", state: "FL", zip: "33602", latitude: 27.95, longitude: -82.46 },
    contacts: [],
  },
  touchPoint: null,
  ...overrides,
});

const session = (overrides: Partial<SessionDetail> = {}): SessionDetail => ({
  id: "s-1",
  userId: "u-1",
  channel: "IN_PERSON",
  plannedFor: null,
  startedAt: null,
  endedAt: null,
  area: null,
  goal: null,
  notes: null,
  user: { id: "u-1", firstName: "Jevon", lastName: "C" },
  items: [],
  routePolyline: null,
  routeStartLabel: null,
  routeStartLat: null,
  routeStartLng: null,
  routeReturns: null,
  routeSeconds: null,
  routeMeters: null,
  routeOptimizedAt: null,
  ...overrides,
});

describe("drive times", () => {
  it("formats minutes, hours and miles", () => {
    expect(formatDriveTime(754)).toBe("13 min");
    expect(formatDriveTime(6000)).toBe("1 h 40 min");
    expect(formatDriveTime(3600)).toBe("1 h");
    expect(formatMiles(6920)).toBe("4.3 mi");
    expect(formatMiles(61155)).toBe("38 mi");
  });

  it("summarizes the route, or says to re-optimize after a hand reorder", () => {
    expect(routeSummary(session({ routeSeconds: 6000, routeMeters: 61155 }))).toBe("1 h 40 min · 38 mi driving");
    expect(routeSummary(session({ routeStartLat: 27.9, routeStartLng: -82.4 }))).toBe(
      "Order changed · Re-optimize for drive times",
    );
    expect(routeSummary(session())).toBe("Not optimized yet");
  });

  it("shows the drive to each stop, and which stops aren't on the map", () => {
    render(
      <StopList
        items={[
          item("a", "Peak Roofing", { legSeconds: 720, legMeters: 6920 }),
          item("b", "Bay Builders", {
            lead: { ...item("b", "x").lead, business: "Bay Builders", primaryLocation: null },
          }),
        ]}
        canChangeList
        showDirections
        onReorder={vi.fn()}
        onRemove={vi.fn()}
        onOpenLead={vi.fn()}
      />,
    );

    expect(screen.getByText("↓ 12 min · 4.3 mi")).toBeInTheDocument();
    expect(screen.getByText("Not on the map: add an address")).toBeInTheDocument();
  });
});

describe("BottomSheet", () => {
  it("steps up through its snap points when the handle is tapped, from the keyboard too", async () => {
    const onSnapChange = vi.fn();
    const { rerender } = render(
      <BottomSheet snap="peek" onSnapChange={onSnapChange} header={<p>12 stops</p>}>
        <p>the list</p>
      </BottomSheet>,
    );
    expect(screen.getByRole("region", { name: "Stops" })).toHaveAttribute("data-snap", "peek");

    screen.getByRole("button", { name: "Expand the list" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onSnapChange).toHaveBeenLastCalledWith("half");

    rerender(
      <BottomSheet snap="full" onSnapChange={onSnapChange} header={<p>12 stops</p>}>
        <p>the list</p>
      </BottomSheet>,
    );
    screen.getByRole("button", { name: "Collapse the list" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onSnapChange).toHaveBeenLastCalledWith("peek");
  });

  it("keeps header buttons tappable", async () => {
    const onOptimize = vi.fn();
    render(
      <BottomSheet snap="peek" onSnapChange={vi.fn()} header={<button onClick={onOptimize}>Optimize route</button>}>
        <p>the list</p>
      </BottomSheet>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Optimize route" }));

    expect(onOptimize).toHaveBeenCalled();
  });
});

describe("OptimizeRouteDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  const geolocation = (result: "ok" | "denied") => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback, fail: PositionErrorCallback) =>
          result === "ok"
            ? ok({ coords: { latitude: 27.95, longitude: -82.46 } } as GeolocationPosition)
            : fail({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError),
      },
    });
  };

  it("optimizes from my location, and can return to the start", async () => {
    geolocation("ok");
    post.mockResolvedValue({ data: session({ routeSeconds: 600 }) });
    const onDone = vi.fn();
    render(<OptimizeRouteDialog open session={session()} onDone={onDone} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByLabelText("Return to start at the end"));
    await userEvent.click(screen.getByRole("button", { name: "Optimize" }));

    expect(post).toHaveBeenCalledWith("/api/sessions/s-1/route", {
      start: { latitude: 27.95, longitude: -82.46, label: "My location" },
      returnToStart: true,
    });
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ routeSeconds: 600 }));
  });

  it("explains when location is off, without calling the server", async () => {
    geolocation("denied");
    render(<OptimizeRouteDialog open session={session()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Optimize" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Location access is off");
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps a picked address even though the search box then reports its text", async () => {
    post.mockResolvedValue({ data: session() });
    render(<OptimizeRouteDialog open session={session()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByLabelText("Another address"));
    await userEvent.click(screen.getByRole("button", { name: "Pick" }));
    await userEvent.click(screen.getByRole("button", { name: "Optimize" }));

    expect(post).toHaveBeenCalledWith("/api/sessions/s-1/route", {
      start: { latitude: 27.94, longitude: -82.45, label: "333 S Franklin St, Tampa" },
      returnToStart: false,
    });
  });

  it("suggests a typed-in last start, and needs an address picked for another one", async () => {
    post.mockResolvedValue({ data: session() });
    render(
      <OptimizeRouteDialog
        open
        session={session({ routeStartLat: 28.05, routeStartLng: -82.4, routeStartLabel: "4700 N Florida Ave, Tampa" })}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Last start: 4700 N Florida Ave/)).toBeChecked();

    await userEvent.click(screen.getByLabelText("Another address"));
    expect(screen.getByRole("button", { name: "Optimize" })).toBeDisabled();

    await userEvent.click(screen.getByLabelText(/Last start/));
    await userEvent.click(screen.getByRole("button", { name: "Optimize" }));
    expect(post).toHaveBeenCalledWith("/api/sessions/s-1/route", {
      start: { latitude: 28.05, longitude: -82.4, label: "4700 N Florida Ave, Tampa" },
      returnToStart: false,
    });
  });
});
