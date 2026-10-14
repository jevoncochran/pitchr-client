import { useEffect, useState } from "react";
import { ConfirmModal } from "../ui/ConfirmModal";
import { CHANNELS } from "../../constants/sessions";
import { localDateKey } from "../../utils/dates";
import type { SessionChannel } from "../../types/sessions";

export interface SessionDetails {
  channel: SessionChannel;
  /** YYYY-MM-DD */
  plannedFor: string;
  area: string;
  goal: number | null;
  notes: string;
}

const inputClass =
  "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400";

/** Creates a session, or edits one's details. */
export const SessionDetailsDialog = ({
  open,
  initial,
  channelLocked = false,
  onSave,
  onCancel,
}: {
  open: boolean;
  /** Existing details when editing; empty for a new session */
  initial?: Partial<SessionDetails>;
  /** A started session's channel can't change */
  channelLocked?: boolean;
  onSave: (details: SessionDetails) => Promise<void>;
  onCancel: () => void;
}) => {
  const editing = initial !== undefined;
  const [channel, setChannel] = useState<SessionChannel>("IN_PERSON");
  const [plannedFor, setPlannedFor] = useState(localDateKey);
  const [area, setArea] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setChannel(initial?.channel ?? "IN_PERSON");
    setPlannedFor(initial?.plannedFor ?? localDateKey());
    setArea(initial?.area ?? "");
    setGoal(initial?.goal ? String(initial.goal) : "");
    setNotes(initial?.notes ?? "");
    setError("");
    // Only reset when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goalNumber = goal.trim() === "" ? null : Number(goal);
  const goalValid = goalNumber === null || (Number.isInteger(goalNumber) && goalNumber > 0);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave({ channel, plannedFor, area: area.trim(), goal: goalNumber, notes: notes.trim() });
    } catch {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmModal
      open={open}
      title={editing ? "Edit session" : "Plan a session"}
      message={
        <div className="space-y-3 text-gray-700">
          <label className="block">
            <span className="block text-xs font-medium text-gray-500 mb-1">Channel</span>
            <select
              value={channel}
              disabled={channelLocked}
              onChange={(e) => setChannel(e.target.value as SessionChannel)}
              className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {channelLocked && (
              <span className="block text-xs text-gray-400 mt-1">
                Can't change after the session has started
              </span>
            )}
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-gray-500 mb-1">Date</span>
            <input
              type="date"
              value={plannedFor}
              onChange={(e) => setPlannedFor(e.target.value)}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-gray-500 mb-1">Area (optional)</span>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. South Tampa"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-gray-500 mb-1">Goal (optional)</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. 20"
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </label>
          {!goalValid && <p className="text-xs text-red-500">Goal must be a whole number above 0.</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      }
      confirmLabel={editing ? "Save" : "Create session"}
      loading={saving}
      confirmDisabled={!plannedFor || !goalValid}
      onConfirm={handleSave}
      onCancel={onCancel}
    />
  );
};
