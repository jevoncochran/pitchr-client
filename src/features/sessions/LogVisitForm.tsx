import { useState } from "react";
import {
  NO_CONVERSATION_OUTCOMES,
  outcomesFor,
  PROVIDER_OPTIONS,
} from "../leads/results";
import { localDateKey } from "../../lib/dates";
import type { SessionContact } from "./types";

/** What the form sends to POST /api/sessions/:id/log (plus the lead/item, added by the page). */
export interface VisitLog {
  type: string;
  outcome: string;
  providerType?: string;
  comeBackAt?: string;
  addBackToRoute?: boolean;
  contactIds: string[];
  newContact?: { firstName: string; lastName: string; title: string; isDecisionMaker: boolean };
  summary: string;
  leftMaterials: boolean;
}

type ComeBackWhen = "today" | "day" | "unknown";

const chip = (selected: boolean) =>
  `px-3 py-2 rounded-lg text-sm border text-left transition ${
    selected
      ? "bg-green-50 border-green-primary text-gray-900 font-medium"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
  }`;
const smallChip = (selected: boolean) =>
  `px-3 py-1.5 rounded-full text-xs font-medium border transition ${
    selected ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
  }`;
const inputClass =
  "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400";

/**
 * Logging an in-person visit or a call: what happened, who we talked to, a note.
 * Remounted for each lead (via key), so it always starts empty.
 */
export const LogVisitForm = ({
  type,
  contacts,
  canAddBackToRoute,
  saving,
  onSave,
  onSkip,
}: {
  type: "IN_PERSON" | "CALL";
  contacts: SessionContact[];
  /** In-person and mixed sessions can put a "later today" lead back on the route */
  canAddBackToRoute: boolean;
  saving: boolean;
  onSave: (log: VisitLog) => void;
  onSkip?: () => void;
}) => {
  const [outcome, setOutcome] = useState("");
  const [providerType, setProviderType] = useState("UNKNOWN");
  const [comeBackWhen, setComeBackWhen] = useState<ComeBackWhen>("unknown");
  const [comeBackTime, setComeBackTime] = useState("15:00");
  const [comeBackDate, setComeBackDate] = useState("");
  const [addBackToRoute, setAddBackToRoute] = useState(true);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    title: "",
    isDecisionMaker: false,
  });
  const [summary, setSummary] = useState("");
  const [leftMaterials, setLeftMaterials] = useState(false);

  const talkedToSomeone = outcome !== "" && !NO_CONVERSATION_OUTCOMES.includes(outcome);

  // "Come back later": when, as an ISO date-time (or nothing if unknown)
  let comeBackAt: string | undefined;
  if (outcome === "COME_BACK_LATER") {
    if (comeBackWhen === "today" && comeBackTime) {
      comeBackAt = new Date(`${localDateKey()}T${comeBackTime}:00`).toISOString();
    } else if (comeBackWhen === "day" && comeBackDate) {
      comeBackAt = new Date(`${comeBackDate}T${comeBackTime || "09:00"}:00`).toISOString();
    }
  }

  const newContactValid = !addingContact || newContact.firstName.trim() !== "";
  const canSave = outcome !== "" && newContactValid && !saving;

  const toggleContact = (id: string) =>
    setContactIds((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );

  const handleSave = () =>
    onSave({
      type,
      outcome,
      ...(outcome === "HAS_PROVIDER" && { providerType }),
      ...(comeBackAt && { comeBackAt }),
      ...(comeBackAt && comeBackWhen === "today" && canAddBackToRoute && { addBackToRoute }),
      contactIds: talkedToSomeone ? contactIds : [],
      ...(talkedToSomeone &&
        addingContact && {
          newContact: {
            ...newContact,
            firstName: newContact.firstName.trim(),
            lastName: newContact.lastName.trim(),
            title: newContact.title.trim(),
          },
        }),
      summary: summary.trim(),
      leftMaterials,
    });

  return (
    <div className="space-y-5">
      {/* What happened */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">What happened?</p>
        <div className="grid grid-cols-2 gap-2">
          {outcomesFor(type).map((o) => (
            <button key={o.value} type="button" onClick={() => setOutcome(o.value)} className={chip(outcome === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {outcome === "HAS_PROVIDER" && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">What kind?</p>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDER_OPTIONS.map((p) => (
              <button key={p.value} type="button" onClick={() => setProviderType(p.value)} className={smallChip(providerType === p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {outcome === "COME_BACK_LATER" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">When?</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setComeBackWhen("today")} className={smallChip(comeBackWhen === "today")}>
              Later today
            </button>
            <button type="button" onClick={() => setComeBackWhen("day")} className={smallChip(comeBackWhen === "day")}>
              Another day
            </button>
            <button type="button" onClick={() => setComeBackWhen("unknown")} className={smallChip(comeBackWhen === "unknown")}>
              Not specified
            </button>
          </div>
          {comeBackWhen === "day" && (
            <input type="date" min={localDateKey()} value={comeBackDate} onChange={(e) => setComeBackDate(e.target.value)} className={inputClass} />
          )}
          {comeBackWhen !== "unknown" && (
            <input type="time" value={comeBackTime} onChange={(e) => setComeBackTime(e.target.value)} className={inputClass} />
          )}
          {comeBackWhen === "today" && canAddBackToRoute && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={addBackToRoute} onChange={(e) => setAddBackToRoute(e.target.checked)} />
              Add back to today's route at that time
            </label>
          )}
        </div>
      )}

      {/* Who we talked to */}
      {talkedToSomeone && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Who did you talk to?</p>
          <div className="flex flex-wrap gap-1.5">
            {contacts.map((c) => (
              <button key={c.id} type="button" onClick={() => toggleContact(c.id)} className={smallChip(contactIds.includes(c.id))}>
                {c.firstName} {c.lastName ?? ""}
                {c.isDecisionMaker ? " ★" : c.title ? ` · ${c.title}` : ""}
              </button>
            ))}
            <button type="button" onClick={() => setAddingContact((v) => !v)} className={smallChip(addingContact)}>
              + New contact
            </button>
          </div>
          {contacts.some((c) => c.isDecisionMaker) && (
            <p className="text-xs text-gray-400 mt-1">★ decision-maker</p>
          )}
          {addingContact && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input placeholder="First name" value={newContact.firstName} onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })} className={inputClass} />
              <input placeholder="Last name" value={newContact.lastName} onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })} className={inputClass} />
              <input placeholder="Title (e.g. Owner)" value={newContact.title} onChange={(e) => setNewContact({ ...newContact, title: e.target.value })} className={`${inputClass} col-span-2`} />
              <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={newContact.isDecisionMaker} onChange={(e) => setNewContact({ ...newContact, isDecisionMaker: e.target.checked })} />
                Decision-maker
              </label>
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="space-y-2">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Note (optional): what they said, who to ask for next time"
          rows={3}
          className={`${inputClass} resize-none`}
        />
        {type === "IN_PERSON" && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={leftMaterials} onChange={(e) => setLeftMaterials(e.target.checked)} />
            Left materials (flier, card)
          </label>
        )}
      </div>

      <div className="flex gap-2">
        {onSkip && (
          <button type="button" onClick={onSkip} disabled={saving} className="px-4 py-3 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-green-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save & next →"}
        </button>
      </div>
    </div>
  );
};
