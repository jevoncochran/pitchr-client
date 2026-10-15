import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import type { LeadDetail } from "./useLeadDetail";

/** Notes on the lead. */
export const LeadNotes = ({ detail }: { detail: LeadDetail }) => {
  const {
    lead,
    showNoteForm,
    setShowNoteForm,
    noteText,
    setNoteText,
    submittingNote,
    handleNoteSubmit,
  } = detail;
  return (
    <SectionCard className="rounded-xl p-4">
      <SectionHeader
        title={`Notes (${lead.notes?.length ?? 0})`}
        action={
          <button
            onClick={() => setShowNoteForm((v) => !v)}
            className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
          >
            {showNoteForm ? "Cancel" : "+ Add Note"}
          </button>
        }
      />

      {showNoteForm && (
        <form
          onSubmit={handleNoteSubmit}
          className="bg-gray-50 rounded-lg p-4 mb-4 text-sm"
        >
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingNote}
              className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
            >
              {submittingNote ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {lead.notes?.length === 0 ? (
        <p className="text-sm text-gray-400">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {lead.notes?.map((note: any) => (
            <div
              key={note.id}
              className="border-l-2 border-gray-200 pl-3 text-sm"
            >
              <p className="text-gray-700">{note.text}</p>
              <p className="text-gray-400 text-xs mt-1">
                {note.author?.firstName} {note.author?.lastName} ·{" "}
                {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};
