// Visit debrief (pitchr-server docs/visit-debrief.md): a note dictated after a
// visit comes back from POST /api/sessions/:id/debrief as a proposal, which
// fills in the visit form for review. Nothing is saved until Save.

/** One person the note mentions (DebriefPerson in pitchr-server). */
export interface DebriefPerson {
  contactId: string | null;
  candidateContactIds: string[];
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  isDecisionMaker: boolean | null;
  spokeWith: boolean;
}

export interface DebriefProposal {
  model: string | null;
  outcome: string | null;
  providerType: string | null;
  comeBackDate: string | null;
  comeBackTime: string | null;
  /** The words the date or time was estimated from ("next week"); null when said exactly */
  comeBackEstimate: string | null;
  leftMaterials: boolean;
  summary: string;
  people: DebriefPerson[];
  questions: string[];
}

export interface DebriefResult {
  debriefId: string;
  proposal: DebriefProposal;
}

/** Someone to add as a contact with the visit. */
export interface NewPerson {
  key: string;
  firstName: string;
  lastName: string;
  title: string;
  isDecisionMaker: boolean;
  /** Counted as spoken to (the owner who wasn't in isn't) */
  spokeWith: boolean;
}

/** What the note says about a contact on file (only empty fields are filled in by the server). */
export interface ContactUpdate {
  contactId: string;
  title: string | null;
  isDecisionMaker: boolean;
}

/** A person who could be more than one contact on file: the owner picks. */
export interface ContactChoice {
  key: string;
  name: string;
  candidateContactIds: string[];
  person: DebriefPerson;
}

/** The form's values as the proposal would set them. */
export interface ProposedForm {
  outcome: string | null;
  providerType: string | null;
  comeBack: { when: "today" | "day"; date: string; time: string | null; estimate: string | null } | null;
  leftMaterials: boolean;
  summary: string;
  contactIds: string[];
  newPeople: NewPerson[];
  contactUpdates: ContactUpdate[];
  choices: ContactChoice[];
  /** People mentioned with no name ("the woman at the front desk"): shown, not saved */
  unnamed: string[];
  questions: string[];
}

let nextKey = 0;
const key = () => `debrief-${nextKey++}`;

export const personName = (p: { firstName: string | null; lastName: string | null }) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ");

export const emptyPerson = (): NewPerson => ({
  key: key(),
  firstName: "",
  lastName: "",
  title: "",
  isDecisionMaker: false,
  spokeWith: true,
});

// A contact needs a first name: someone known only as "Dr. Kim" goes in as "Kim"
export const newPersonFrom = (person: DebriefPerson): NewPerson => ({
  key: key(),
  firstName: person.firstName ?? person.lastName ?? "",
  lastName: person.firstName ? (person.lastName ?? "") : "",
  title: person.title ?? "",
  isDecisionMaker: person.isDecisionMaker === true,
  spokeWith: person.spokeWith,
});

/**
 * The visit form as a proposal fills it in. `outcomes` are the ones the form
 * offers; `today` is today's date key (YYYY-MM-DD), to tell "later today" from
 * "another day".
 */
export const formFromProposal = (
  proposal: DebriefProposal,
  outcomes: string[],
  today: string,
): ProposedForm => {
  const form: ProposedForm = {
    outcome: proposal.outcome && outcomes.includes(proposal.outcome) ? proposal.outcome : null,
    providerType: proposal.providerType,
    comeBack: proposal.comeBackDate
      ? {
          when: proposal.comeBackDate === today ? "today" : "day",
          date: proposal.comeBackDate,
          time: proposal.comeBackTime,
          estimate: proposal.comeBackEstimate,
        }
      : null,
    leftMaterials: proposal.leftMaterials,
    summary: proposal.summary,
    contactIds: [],
    newPeople: [],
    contactUpdates: [],
    choices: [],
    unnamed: [],
    questions: proposal.questions,
  };

  for (const person of proposal.people) {
    if (person.contactId) {
      if (person.spokeWith) form.contactIds.push(person.contactId);
      if (person.title || person.isDecisionMaker) {
        form.contactUpdates.push({
          contactId: person.contactId,
          title: person.title,
          isDecisionMaker: person.isDecisionMaker === true,
        });
      }
    } else if (person.candidateContactIds.length > 0) {
      form.choices.push({
        key: key(),
        name: personName(person) || person.title || "Someone",
        candidateContactIds: person.candidateContactIds,
        person,
      });
    } else if (person.firstName || person.lastName) {
      form.newPeople.push(newPersonFrom(person));
    } else if (person.title) {
      form.unnamed.push(person.title);
    }
  }
  return form;
};
