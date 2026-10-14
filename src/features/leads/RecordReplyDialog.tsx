import { useEffect, useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { localDateKey } from "../../lib/dates";

export interface Reply {
  /** Their reply, pasted or typed in */
  responseText: string;
  /** YYYY-MM-DD */
  respondedOn: string;
}

type WhenChoice = "today" | "yesterday" | "earlier";

const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
};

const chipClass = (selected: boolean) =>
  `px-3 py-1.5 rounded-full text-xs font-medium border transition ${
    selected
      ? "bg-gray-900 text-white border-gray-900"
      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
  }`;

/** Saves someone's reply to a DM, email or text: their message and when they sent it. */
export const RecordReplyDialog = ({
  open,
  onSave,
  onCancel,
}: {
  open: boolean;
  onSave: (reply: Reply) => Promise<void>;
  onCancel: () => void;
}) => {
  const [responseText, setResponseText] = useState("");
  const [when, setWhen] = useState<WhenChoice>("today");
  const [earlierDate, setEarlierDate] = useState(yesterdayKey);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setResponseText("");
    setWhen("today");
    setEarlierDate(yesterdayKey());
    setError("");
  }, [open]);

  const respondedOn =
    when === "today" ? localDateKey() : when === "yesterday" ? yesterdayKey() : earlierDate;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave({ responseText: responseText.trim(), respondedOn });
    } catch {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmModal
      open={open}
      title="Their reply"
      message={
        <div className="space-y-4 text-gray-700">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Paste or type their reply"
            rows={5}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400 resize-none"
          />

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">When did they reply?</p>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setWhen("today")} className={chipClass(when === "today")}>
                Today
              </button>
              <button type="button" onClick={() => setWhen("yesterday")} className={chipClass(when === "yesterday")}>
                Yesterday
              </button>
              <button type="button" onClick={() => setWhen("earlier")} className={chipClass(when === "earlier")}>
                Earlier
              </button>
            </div>
            {when === "earlier" && (
              <input
                type="date"
                value={earlierDate}
                max={localDateKey()}
                onChange={(e) => setEarlierDate(e.target.value)}
                className="mt-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-gray-400"
              />
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      }
      confirmLabel="Save"
      loading={saving}
      confirmDisabled={!responseText.trim()}
      onConfirm={handleSave}
      onCancel={onCancel}
    />
  );
};
