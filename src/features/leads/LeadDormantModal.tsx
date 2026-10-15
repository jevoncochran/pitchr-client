import DatePicker from "react-datepicker";
import { DORMANT_REASONS } from "./constants";
import type { LeadDetail } from "./useLeadDetail";

/** Mark as Dormant: reason and when to revisit. */
export const LeadDormantModal = ({ detail }: { detail: LeadDetail }) => {
  const {
    showDormantModal,
    setShowDormantModal,
    dormantReason,
    setDormantReason,
    dormantRevisitAt,
    setDormantRevisitAt,
    submittingDormant,
    handleDormantSubmit,
  } = detail;
  return (
    <>
      {showDormantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Mark as Dormant
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Tell us why and when to circle back — we'll create a reminder
              automatically.
            </p>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for going dormant
              </label>
              <select
                value={dormantReason}
                onChange={(e) => setDormantReason(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-primary"
              >
                <option value="">Select a reason…</option>
                {DORMANT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Revisit date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                When to revisit
              </label>
              <DatePicker
                selected={dormantRevisitAt}
                onChange={(date: Date | null) => setDormantRevisitAt(date)}
                minDate={new Date()}
                dateFormat="MMMM d, yyyy"
                placeholderText="Pick a date"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-primary"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                A follow-up reminder will appear on this date.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDormantModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDormantSubmit}
                disabled={
                  !dormantReason || !dormantRevisitAt || submittingDormant
                }
                className="flex-1 bg-gray-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingDormant ? "Saving…" : "Mark Dormant & Set Reminder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
