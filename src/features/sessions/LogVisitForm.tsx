import { useState } from "react";
import {
  COME_BACK_OUTCOMES,
  NO_CONVERSATION_OUTCOMES,
  outcomesFor,
  PROVIDER_OPTIONS,
} from "../leads/results";
import { localDateKey } from "../../lib/dates";
import type { SessionContact } from "./types";
import {
  type ContactChoice,
  type ContactUpdate,
  type DebriefResult,
  emptyPerson,
  formFromProposal,
  type NewPerson,
  newPersonFrom,
  personName,
} from "./debrief";

/** What the form sends to POST /api/sessions/:id/log (plus the lead/item, added by the page). */
export interface VisitLog {
  type: string;
  outcome: string;
  providerType?: string;
  comeBackAt?: string;
  addBackToRoute?: boolean;
  contactIds: string[];
  newContacts: { firstName: string; lastName: string; title: string; isDecisionMaker: boolean; spokeWith: boolean }[];
  /** From a visit debrief: what the note says about contacts on file */
  contactUpdates: ContactUpdate[];
  /** The visit debrief the form was filled in from */
  debriefId?: string;
  summary: string;
  leftMaterials: boolean;
}

type ComeBackWhen = "today" | "day" | "unknown";

/** Parts of the form a debrief can fill in; edited by hand, they're left alone by the next Fill in */
type Field = "outcome" | "provider" | "comeBack" | "people" | "summary" | "leftMaterials";

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
 * With `onFillIn` (in-person visits), a note dictated into "What happened?"
 * fills the form in for review (pitchr-server docs/visit-debrief.md).
 * Remounted for each lead (via key), so it always starts empty.
 */
export const LogVisitForm = ({
  type,
  contacts,
  canAddBackToRoute,
  saving,
  onSave,
  onSkip,
  onFillIn,
}: {
  type: "IN_PERSON" | "CALL";
  contacts: SessionContact[];
  /** In-person and mixed sessions can put a "later today" lead back on the route */
  canAddBackToRoute: boolean;
  saving: boolean;
  onSave: (log: VisitLog) => void;
  onSkip?: () => void;
  /** Turns a dictated note into a proposal (POST /api/sessions/:id/debrief) */
  onFillIn?: (note: string) => Promise<DebriefResult>;
}) => {
  const [outcome, setOutcome] = useState("");
  const [providerType, setProviderType] = useState("UNKNOWN");
  const [comeBackWhen, setComeBackWhen] = useState<ComeBackWhen>("unknown");
  const [comeBackTime, setComeBackTime] = useState("15:00");
  const [comeBackDate, setComeBackDate] = useState("");
  const [addBackToRoute, setAddBackToRoute] = useState(true);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [newPeople, setNewPeople] = useState<NewPerson[]>([]);
  const [contactUpdates, setContactUpdates] = useState<ContactUpdate[]>([]);
  const [summary, setSummary] = useState("");
  const [leftMaterials, setLeftMaterials] = useState(false);

  // The debrief
  const [note, setNote] = useState("");
  const [filling, setFilling] = useState(false);
  const [fillError, setFillError] = useState("");
  const [debriefId, setDebriefId] = useState<string | undefined>();
  const [choices, setChoices] = useState<ContactChoice[]>([]);
  const [unnamed, setUnnamed] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [filled, setFilled] = useState<Set<Field>>(new Set());
  // The words a come-back date or time was estimated from ("next week")
  const [comeBackEstimate, setComeBackEstimate] = useState<string | null>(null);
  const [edited, setEdited] = useState<Set<Field>>(new Set());

  /** A change by hand: the field keeps it, and loses its "From your note" tag */
  const byHand = (field: Field) => setEdited((current) => (current.has(field) ? current : new Set([...current, field])));

  const outcomes = outcomesFor(type);
  const talkedToSomeone = outcome !== "" && !NO_CONVERSATION_OUTCOMES.includes(outcome);

  // Going back: when, as an ISO date-time (or nothing if unknown)
  let comeBackAt: string | undefined;
  if (COME_BACK_OUTCOMES.includes(outcome)) {
    if (comeBackWhen === "today" && comeBackTime) {
      comeBackAt = new Date(`${localDateKey()}T${comeBackTime}:00`).toISOString();
    } else if (comeBackWhen === "day" && comeBackDate) {
      comeBackAt = new Date(`${comeBackDate}T${comeBackTime || "09:00"}:00`).toISOString();
    }
  }

  const peopleValid = newPeople.every((p) => p.firstName.trim() !== "");
  const canSave = outcome !== "" && peopleValid && !saving;

  const toggleContact = (id: string) => {
    byHand("people");
    setContactIds((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]));
  };
  const updatePerson = (key: string, change: Partial<NewPerson>) => {
    byHand("people");
    setNewPeople((current) => current.map((p) => (p.key === key ? { ...p, ...change } : p)));
  };

  /** Fill in the form from the note; anything changed by hand stays as it is. */
  const fillIn = async () => {
    if (!onFillIn || !note.trim()) return;
    setFilling(true);
    setFillError("");
    try {
      const { debriefId: id, proposal } = await onFillIn(note.trim());
      const form = formFromProposal(
        proposal,
        outcomes.map((o) => o.value),
        localDateKey(),
      );
      const now = new Set<Field>();
      const fill = (field: Field, apply: () => void) => {
        if (edited.has(field)) return;
        apply();
        now.add(field);
      };
      if (form.outcome) fill("outcome", () => setOutcome(form.outcome!));
      if (form.providerType) fill("provider", () => setProviderType(form.providerType!));
      if (form.comeBack) {
        const comeBack = form.comeBack;
        fill("comeBack", () => {
          setComeBackEstimate(comeBack.estimate);
          setComeBackWhen(comeBack.when);
          if (comeBack.when === "day") setComeBackDate(comeBack.date);
          if (comeBack.time) setComeBackTime(comeBack.time);
          else if (comeBack.when === "day") setComeBackTime("");
        });
      }
      fill("summary", () => setSummary(form.summary));
      fill("leftMaterials", () => setLeftMaterials(form.leftMaterials));
      fill("people", () => {
        setContactIds(form.contactIds);
        setNewPeople(form.newPeople);
        setContactUpdates(form.contactUpdates);
        setChoices(form.choices);
        setUnnamed(form.unnamed);
      });
      setQuestions(form.questions);
      setDebriefId(id);
      setFilled(now);
    } catch {
      setFillError("Couldn't fill in the form. Try again or fill it in yourself.");
    } finally {
      setFilling(false);
    }
  };

  /** Which contact a person is, when the note could mean more than one. */
  const choose = (choice: ContactChoice, contactId: string | "new") => {
    byHand("people");
    if (contactId === "new") {
      setNewPeople((current) => [...current, newPersonFrom(choice.person)]);
    } else {
      if (choice.person.spokeWith) setContactIds((current) => [...new Set([...current, contactId])]);
      if (choice.person.title || choice.person.isDecisionMaker) {
        setContactUpdates((current) => [
          ...current,
          { contactId, title: choice.person.title, isDecisionMaker: choice.person.isDecisionMaker === true },
        ]);
      }
    }
    setChoices((current) => current.filter((c) => c.key !== choice.key));
  };

  const handleSave = () =>
    onSave({
      type,
      outcome,
      ...(outcome === "HAS_PROVIDER" && { providerType }),
      ...(comeBackAt && { comeBackAt }),
      ...(comeBackAt && comeBackWhen === "today" && canAddBackToRoute && { addBackToRoute }),
      contactIds: talkedToSomeone ? contactIds : [],
      newContacts: newPeople.map((p) => ({
        firstName: p.firstName.trim(),
        lastName: p.lastName.trim(),
        title: p.title.trim(),
        isDecisionMaker: p.isDecisionMaker,
        spokeWith: talkedToSomeone && p.spokeWith,
      })),
      contactUpdates,
      ...(debriefId && { debriefId }),
      summary: summary.trim(),
      leftMaterials,
    });

  const contactName = (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    return contact ? personName(contact) : "A contact";
  };
  /** "From your note" on what the last Fill in set and nobody has changed since */
  const fromNote = (field: Field) =>
    filled.has(field) && !edited.has(field) ? (
      <span className="ml-2 normal-case tracking-normal text-[11px] font-medium bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
        From your note
      </span>
    ) : null;

  const showPeople = talkedToSomeone || newPeople.length > 0 || contactUpdates.length > 0;

  return (
    <div className="space-y-5">
      {/* The debrief: say what happened, the form fills itself in */}
      {onFillIn && (
        <div className="space-y-2">
          <label htmlFor="debrief-note" className="text-xs font-semibold uppercase tracking-wide text-gray-400 block">
            What happened?
          </label>
          <textarea
            id="debrief-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tap the mic on your keyboard and say what happened: who you talked to, what they said, when to come back."
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <button
            type="button"
            onClick={fillIn}
            disabled={filling || !note.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-green-primary text-green-700 bg-white disabled:opacity-50"
          >
            {filling ? "Filling in…" : filled.size > 0 ? "Fill in again" : "Fill in"}
          </button>
          {fillError && <p className="text-sm text-red-600">{fillError}</p>}
        </div>
      )}

      {/* What the person has to decide */}
      {(questions.length > 0 || choices.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 text-sm text-amber-900">
          {questions.map((q) => (
            <p key={q}>{q}</p>
          ))}
          {choices.map((choice) => (
            <div key={choice.key}>
              <p className="font-medium">Which contact is {choice.name}?</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {choice.candidateContactIds.map((id) => (
                  <button key={id} type="button" onClick={() => choose(choice, id)} className={smallChip(false)}>
                    {contactName(id)}
                  </button>
                ))}
                <button type="button" onClick={() => choose(choice, "new")} className={smallChip(false)}>
                  Someone new
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outcome */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Outcome
          {fromNote("outcome")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {outcomes.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                byHand("outcome");
                setOutcome(o.value);
              }}
              className={chip(outcome === o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {outcome === "HAS_PROVIDER" && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            What kind?
            {fromNote("provider")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDER_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  byHand("provider");
                  setProviderType(p.value);
                }}
                className={smallChip(providerType === p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {COME_BACK_OUTCOMES.includes(outcome) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">
            {outcome === "COME_BACK_LATER" ? "When?" : "Going back? When?"}
            {comeBackEstimate && filled.has("comeBack") && !edited.has("comeBack") ? (
              <span className="ml-2 text-[11px] font-medium bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
                Estimated from “{comeBackEstimate}”
              </span>
            ) : (
              fromNote("comeBack")
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["today", "Later today"],
                ["day", "Another day"],
                ["unknown", "Not specified"],
              ] as const
            ).map(([when, label]) => (
              <button
                key={when}
                type="button"
                onClick={() => {
                  byHand("comeBack");
                  setComeBackWhen(when);
                }}
                className={smallChip(comeBackWhen === when)}
              >
                {label}
              </button>
            ))}
          </div>
          {comeBackWhen === "day" && (
            <input
              type="date"
              aria-label="Come back on"
              min={localDateKey()}
              value={comeBackDate}
              onChange={(e) => {
                byHand("comeBack");
                setComeBackDate(e.target.value);
              }}
              className={inputClass}
            />
          )}
          {comeBackWhen !== "unknown" && (
            <input
              type="time"
              aria-label="Come back at"
              value={comeBackTime}
              onChange={(e) => {
                byHand("comeBack");
                setComeBackTime(e.target.value);
              }}
              className={inputClass}
            />
          )}
          {comeBackWhen === "today" && canAddBackToRoute && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={addBackToRoute} onChange={(e) => setAddBackToRoute(e.target.checked)} />
              Add back to today's route at that time
            </label>
          )}
        </div>
      )}

      {/* Who we talked to, and anyone else the note mentions */}
      {showPeople && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Who did you talk to?
            {fromNote("people")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {contacts.map((c) => (
              <button key={c.id} type="button" onClick={() => toggleContact(c.id)} className={smallChip(contactIds.includes(c.id))}>
                {c.firstName} {c.lastName ?? ""}
                {c.isDecisionMaker ? " ★" : c.title ? ` · ${c.title}` : ""}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                byHand("people");
                setNewPeople((current) => [...current, emptyPerson()]);
              }}
              className={smallChip(false)}
            >
              + New contact
            </button>
          </div>
          {contacts.some((c) => c.isDecisionMaker) && <p className="text-xs text-gray-400 mt-1">★ decision-maker</p>}

          {newPeople.map((person) => (
            <div key={person.key} className="mt-2 rounded-lg border border-gray-200 p-2 grid grid-cols-2 gap-2">
              <input
                placeholder="First name"
                aria-label="First name"
                value={person.firstName}
                onChange={(e) => updatePerson(person.key, { firstName: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Last name"
                aria-label="Last name"
                value={person.lastName}
                onChange={(e) => updatePerson(person.key, { lastName: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Title (e.g. Owner)"
                aria-label="Title"
                value={person.title}
                onChange={(e) => updatePerson(person.key, { title: e.target.value })}
                className={`${inputClass} col-span-2`}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={person.isDecisionMaker}
                  onChange={(e) => updatePerson(person.key, { isDecisionMaker: e.target.checked })}
                />
                Decision-maker
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={person.spokeWith}
                  onChange={(e) => updatePerson(person.key, { spokeWith: e.target.checked })}
                />
                Spoke with
              </label>
              <button
                type="button"
                onClick={() => {
                  byHand("people");
                  setNewPeople((current) => current.filter((p) => p.key !== person.key));
                }}
                className="col-span-2 text-left text-xs text-gray-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}

          {contactUpdates.map((update) => (
            <p key={update.contactId} className="mt-2 text-xs text-gray-600">
              Update {contactName(update.contactId)}:{" "}
              {[update.title && `title "${update.title}"`, update.isDecisionMaker && "decision-maker"].filter(Boolean).join(", ")}{" "}
              <button
                type="button"
                onClick={() => {
                  byHand("people");
                  setContactUpdates((current) => current.filter((u) => u.contactId !== update.contactId));
                }}
                className="text-gray-400 underline"
              >
                Don't
              </button>
            </p>
          ))}

          {unnamed.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              No name given for: {unnamed.join(", ")}. Add them with + New contact if you have one.
            </p>
          )}
        </div>
      )}

      {/* Note */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Summary
          {fromNote("summary")}
        </p>
        <textarea
          aria-label="Summary"
          value={summary}
          onChange={(e) => {
            byHand("summary");
            setSummary(e.target.value);
          }}
          placeholder="Note (optional): what they said, who to ask for next time"
          rows={3}
          className={`${inputClass} resize-none`}
        />
        {type === "IN_PERSON" && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={leftMaterials}
              onChange={(e) => {
                byHand("leftMaterials");
                setLeftMaterials(e.target.checked);
              }}
            />
            Left materials (flier, card)
            {fromNote("leftMaterials")}
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
