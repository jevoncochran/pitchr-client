import { useState } from "react";
import type { SessionItem } from "../../types/sessions";

const STATUS = {
  COMPLETED: "text-green-700 bg-green-50",
  SKIPPED: "text-gray-500 bg-gray-100",
};

/** One lead in a DM / email / text session: one tap to log it as sent (or failed). */
export const MessageRow = ({
  item,
  saving,
  onLog,
  onSkip,
}: {
  item: SessionItem;
  saving: boolean;
  onLog: (delivery: "SENT" | "FAILED", note: string) => void;
  onSkip: () => void;
}) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const done = item.status === "COMPLETED";
  const delivery = item.touchPoint?.delivery;

  return (
    <li className="bg-white border border-gray-100 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.lead.business}</p>
          {item.lead.industry && <p className="text-xs text-gray-400">{item.lead.industry.name}</p>}
        </div>

        {done ? (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS.COMPLETED}`}>
            {delivery === "FAILED" ? "Failed" : "Sent"}
          </span>
        ) : (
          <div className="flex gap-1.5 flex-shrink-0">
            {item.status === "SKIPPED" && (
              <span className={`self-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS.SKIPPED}`}>
                Skipped
              </span>
            )}
            <button
              onClick={() => onLog("SENT", note)}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-primary disabled:opacity-50"
            >
              Sent
            </button>
            <button
              onClick={() => onLog("FAILED", note)}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              Failed
            </button>
          </div>
        )}
      </div>

      {!done && (
        <div className="mt-2 flex gap-3 text-xs">
          <button onClick={() => setNoteOpen((v) => !v)} className="text-gray-500 hover:text-gray-800">
            {noteOpen ? "Hide note" : "+ Note"}
          </button>
          {item.status === "PLANNED" && (
            <button onClick={onSkip} disabled={saving} className="text-gray-500 hover:text-gray-800">
              Skip
            </button>
          )}
        </div>
      )}
      {noteOpen && !done && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note, e.g. which template you sent"
          rows={2}
          className="mt-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 resize-none"
        />
      )}
    </li>
  );
};
