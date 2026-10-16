import { useEffect, useState } from "react";
import axios from "axios";
import api from "../../lib/api";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import AddressAutocomplete from "../../components/ui/AddressAutocomplete";
import { currentPosition } from "../../lib/geolocation";
import type { SessionDetail } from "./types";

type StartChoice = "here" | "last" | "address";

type Start = Awaited<ReturnType<typeof currentPosition>>;

const choiceClass = (selected: boolean) =>
  `flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
    selected ? "border-gray-900 bg-gray-50" : "border-gray-200"
  }`;

/**
 * Optimize route: choose where the drive starts (my location, the last start,
 * or a typed-in address) and whether to come back, then put the stops in the
 * fastest order. One Google request.
 */
export const OptimizeRouteDialog = ({
  open,
  session,
  onDone,
  onCancel,
}: {
  open: boolean;
  session: SessionDetail;
  onDone: (updated: SessionDetail) => void;
  onCancel: () => void;
}) => {
  const lastStart =
    session.routeStartLat != null && session.routeStartLng != null
      ? { latitude: session.routeStartLat, longitude: session.routeStartLng, label: session.routeStartLabel ?? "Last start" }
      : null;

  const [choice, setChoice] = useState<StartChoice>("here");
  const [addressText, setAddressText] = useState("");
  // The picked address, and the street line the search box shows for it
  const [picked, setPicked] = useState<(Start & { line1: string }) | null>(null);
  const [returnToStart, setReturnToStart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    // A typed-in last start is offered again; "My location" is never stale
    setChoice(lastStart && lastStart.label !== "My location" ? "last" : "here");
    setAddressText("");
    setPicked(null);
    setReturnToStart(session.routeReturns ?? false);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOptimize = async () => {
    setSaving(true);
    setError("");
    try {
      const start =
        choice === "here"
          ? await currentPosition()
          : choice === "last"
            ? lastStart!
            : { latitude: picked!.latitude, longitude: picked!.longitude, label: picked!.label };
      const res = await api.post<SessionDetail>(`/api/sessions/${session.id}/route`, { start, returnToStart });
      onDone(res.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Couldn't optimize the route. Try again.")
          : (err as Error).message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmModal
      open={open}
      title="Optimize route"
      message={
        <div className="space-y-4 text-gray-700">
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-500 mb-1.5">Start from</legend>
            <label className={choiceClass(choice === "here")}>
              <input type="radio" name="start" checked={choice === "here"} onChange={() => setChoice("here")} />
              My location
            </label>
            {lastStart && lastStart.label !== "My location" && (
              <label className={choiceClass(choice === "last")}>
                <input type="radio" name="start" checked={choice === "last"} onChange={() => setChoice("last")} />
                <span className="min-w-0 truncate">Last start: {lastStart.label}</span>
              </label>
            )}
            <label className={choiceClass(choice === "address")}>
              <input type="radio" name="start" checked={choice === "address"} onChange={() => setChoice("address")} />
              Another address
            </label>
            {choice === "address" && (
              <AddressAutocomplete
                value={addressText}
                onChange={(text) => {
                  setAddressText(text);
                  // The search box also reports the picked address's text; only real typing clears the pick
                  setPicked((current) => (current && current.line1 === text ? current : null));
                }}
                onSelect={(address) =>
                  setPicked(
                    address.latitude != null && address.longitude != null
                      ? {
                          latitude: address.latitude,
                          longitude: address.longitude,
                          label: [address.addressLine1, address.city].filter(Boolean).join(", "),
                          line1: address.addressLine1,
                        }
                      : null,
                  )
                }
                placeholder="Search for the starting address"
              />
            )}
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={returnToStart} onChange={(e) => setReturnToStart(e.target.checked)} />
            Return to start at the end
          </label>

          {error && (
            <p className="text-xs text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>
      }
      confirmLabel="Optimize"
      loading={saving}
      confirmDisabled={choice === "address" && !picked}
      onConfirm={handleOptimize}
      onCancel={onCancel}
    />
  );
};
