import { useEffect, useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { localDateKey } from "../../lib/dates";

/**
 * Confirms marking a lead as converted, with the date the conversion happened.
 * Also used to edit the date of a lead that's already converted.
 */
export const ConvertLeadDialog = ({
  open,
  mode,
  currentConvertedAt,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  mode: "convert" | "edit";
  currentConvertedAt?: string | null;
  /** Receives the chosen date (noon local time, so it never shifts a day). */
  onConfirm: (convertedAt: Date) => Promise<void>;
  onCancel: () => void;
}) => {
  const [date, setDate] = useState(() => localDateKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Start from today, or from the saved date when editing
  useEffect(() => {
    if (!open) return;
    setDate(
      mode === "edit" && currentConvertedAt
        ? localDateKey(new Date(currentConvertedAt))
        : localDateKey(),
    );
    setError("");
  }, [open, mode, currentConvertedAt]);

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      await onConfirm(new Date(`${date}T12:00:00`));
    } catch {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmModal
      open={open}
      title={mode === "convert" ? "Mark as converted?" : "Edit conversion date"}
      message={
        <div className="space-y-3">
          {mode === "convert" && (
            <p>
              A conversion is a <strong>booked project with money in the bank</strong>.
              A signed or verbal agreement alone doesn't count yet.
            </p>
          )}
          <label className="block">
            <span className="block text-xs font-medium text-gray-500 mb-1">
              Date converted
            </span>
            <input
              type="date"
              value={date}
              max={localDateKey()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400"
            />
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      }
      confirmLabel={mode === "convert" ? "Mark converted" : "Save date"}
      loading={saving}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    />
  );
};
