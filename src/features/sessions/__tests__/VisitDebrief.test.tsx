import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogVisitForm } from "../LogVisitForm";
import { type DebriefPerson, type DebriefProposal, formFromProposal } from "../debrief";
import { localDateKey } from "../../../lib/dates";

const person = (over: Partial<DebriefPerson> = {}): DebriefPerson => ({
  contactId: null,
  candidateContactIds: [],
  firstName: null,
  lastName: null,
  title: null,
  isDecisionMaker: null,
  spokeWith: false,
  ...over,
});

const proposal = (over: Partial<DebriefProposal> = {}): DebriefProposal => ({
  model: "claude-haiku-5-5",
  outcome: "DECISION_MAKER_NOT_AVAILABLE",
  providerType: "MARKETING_AGENCY",
  comeBackDate: "2099-10-22",
  comeBackTime: null,
  comeBackEstimate: null,
  leftMaterials: true,
  summary: "We spoke with Jen at the front desk. The owner, María, is only in on Thursdays.",
  people: [
    person({ firstName: "Jen", title: "front desk", spokeWith: true, isDecisionMaker: false }),
    person({ contactId: "c-maria", firstName: "María", lastName: "López", title: "owner", isDecisionMaker: true }),
  ],
  questions: [],
  ...over,
});

const CONTACTS = [
  { id: "c-maria", firstName: "María", lastName: "López", title: null, isDecisionMaker: false },
  { id: "c-maria-g", firstName: "Maria", lastName: "Gomez", title: "Office manager", isDecisionMaker: false },
];

const IN_PERSON = ["DECISION_MAKER_NOT_AVAILABLE", "INTERESTED", "COME_BACK_LATER", "HAS_PROVIDER"];

describe("formFromProposal", () => {
  it("sorts people into contacts on file, updates, new people, choices and people with no name", () => {
    const form = formFromProposal(
      proposal({
        people: [
          person({ contactId: "c-maria", title: "owner", isDecisionMaker: true, spokeWith: false }),
          person({ contactId: "c-tony", spokeWith: true }),
          person({ firstName: "Jen", title: "front desk", spokeWith: true }),
          person({ lastName: "Kim", title: "owner", isDecisionMaker: true }),
          person({ firstName: "Maria", candidateContactIds: ["c-maria", "c-maria-g"], spokeWith: true }),
          person({ title: "the woman at the register", spokeWith: true }),
        ],
      }),
      IN_PERSON,
      "2099-10-16",
    );

    expect(form.contactIds).toEqual(["c-tony"]);
    expect(form.contactUpdates).toEqual([{ contactId: "c-maria", title: "owner", isDecisionMaker: true }]);
    expect(form.newPeople.map((p) => [p.firstName, p.lastName, p.spokeWith])).toEqual([
      ["Jen", "", true],
      // A contact needs a first name: "Dr. Kim" goes in as Kim
      ["Kim", "", false],
    ]);
    expect(form.choices.map((c) => [c.name, c.candidateContactIds])).toEqual([["Maria", ["c-maria", "c-maria-g"]]]);
    expect(form.unnamed).toEqual(["the woman at the register"]);
  });

  it('tells "later today" from another day, and drops an outcome the form doesn\'t offer', () => {
    expect(formFromProposal(proposal({ comeBackDate: "2099-10-16" }), IN_PERSON, "2099-10-16").comeBack?.when).toBe("today");
    expect(formFromProposal(proposal(), IN_PERSON, "2099-10-16").comeBack).toEqual({
      when: "day",
      date: "2099-10-22",
      time: null,
      estimate: null,
    });
    expect(formFromProposal(proposal({ outcome: "BUSINESS_CLOSED" }), IN_PERSON, "2099-10-16").outcome).toBeNull();
  });
});

const renderForm = (fillIn = vi.fn(), onSave = vi.fn()) => {
  render(
    <LogVisitForm type="IN_PERSON" contacts={CONTACTS} canAddBackToRoute saving={false} onSave={onSave} onFillIn={fillIn} />,
  );
  return { fillIn, onSave };
};

const dictate = async (note = "spoke with jen at the front desk, owner maria is in thursdays") => {
  await userEvent.type(screen.getByLabelText("What happened?"), note);
  await userEvent.click(screen.getByRole("button", { name: "Fill in" }));
};

describe("LogVisitForm: Fill in", () => {
  it("fills the form in from the note and saves it with the debrief", async () => {
    const { fillIn, onSave } = renderForm(vi.fn().mockResolvedValue({ debriefId: "d-1", proposal: proposal() }));

    await dictate();

    expect(fillIn).toHaveBeenCalledWith("spoke with jen at the front desk, owner maria is in thursdays");
    await waitFor(() => expect(screen.getByLabelText("Summary")).toHaveValue(proposal().summary));
    expect(screen.getAllByText("From your note").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("button", { name: "Decision-maker not available" }).className).toContain("bg-green-50");
    expect(screen.getByLabelText("Come back on")).toHaveValue("2099-10-22");
    expect(screen.getByLabelText("First name")).toHaveValue("Jen");
    expect(screen.getByText(/Update María López: title "owner", decision-maker/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Save & next/ }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "DECISION_MAKER_NOT_AVAILABLE",
        comeBackAt: new Date("2099-10-22T09:00:00").toISOString(),
        leftMaterials: true,
        debriefId: "d-1",
        contactIds: [],
        newContacts: [{ firstName: "Jen", lastName: "", title: "front desk", isDecisionMaker: false, spokeWith: true }],
        contactUpdates: [{ contactId: "c-maria", title: "owner", isDecisionMaker: true }],
      }),
    );
  });

  it("keeps what was changed by hand when filling in again", async () => {
    const fillIn = vi
      .fn()
      .mockResolvedValueOnce({ debriefId: "d-1", proposal: proposal() })
      .mockResolvedValueOnce({ debriefId: "d-2", proposal: proposal({ outcome: "INTERESTED", summary: "Second try." }) });
    const { onSave } = renderForm(fillIn);

    await dictate();
    await waitFor(() => expect(screen.getByLabelText("Summary")).toHaveValue(proposal().summary));
    await userEvent.clear(screen.getByLabelText("Summary"));
    await userEvent.type(screen.getByLabelText("Summary"), "My own words.");
    await userEvent.click(screen.getByRole("button", { name: "Fill in again" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Interested" }).className).toContain("bg-green-50"));
    expect(screen.getByLabelText("Summary")).toHaveValue("My own words.");
    await userEvent.click(screen.getByRole("button", { name: /Save & next/ }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ debriefId: "d-2", summary: "My own words." }));
  });

  it("asks which contact someone is, and uses the pick", async () => {
    const { onSave } = renderForm(
      vi.fn().mockResolvedValue({
        debriefId: "d-1",
        proposal: proposal({
          outcome: "INTERESTED",
          people: [person({ firstName: "Maria", candidateContactIds: ["c-maria", "c-maria-g"], spokeWith: true })],
          questions: ["Which Maria did you speak with?"],
        }),
      }),
    );
    await dictate("spoke with maria");

    const box = await screen.findByText("Which contact is Maria?");
    expect(screen.getByText("Which Maria did you speak with?")).toBeInTheDocument();
    await userEvent.click(within(box.parentElement!).getByRole("button", { name: "Maria Gomez" }));
    expect(screen.queryByText("Which contact is Maria?")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Save & next/ }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ contactIds: ["c-maria-g"] }));
  });

  it("says so when it can't fill in, and keeps the note", async () => {
    renderForm(vi.fn().mockRejectedValue(new Error("502")));

    await dictate("spoke with jen");

    expect(await screen.findByText(/Couldn't fill in the form/)).toBeInTheDocument();
    expect(screen.getByLabelText("What happened?")).toHaveValue("spoke with jen");
  });

  it("won't save a new contact without a first name", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Interested" }));
    await userEvent.click(screen.getByRole("button", { name: "+ New contact" }));

    expect(screen.getByRole("button", { name: /Save & next/ })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("First name"), "Sam");
    expect(screen.getByRole("button", { name: /Save & next/ })).toBeEnabled();
  });

  it("has no Fill in for calls or businesses added on the spot", () => {
    render(<LogVisitForm type="CALL" contacts={[]} canAddBackToRoute={false} saving={false} onSave={vi.fn()} />);

    expect(screen.queryByLabelText("What happened?")).not.toBeInTheDocument();
  });

  it("says when the come-back day was estimated", async () => {
    renderForm(
      vi.fn().mockResolvedValue({
        debriefId: "d-1",
        proposal: proposal({ comeBackDate: "2099-10-19", comeBackEstimate: "next week" }),
      }),
    );
    await dictate("owner is back next week");

    expect(await screen.findByText("Estimated from “next week”")).toBeInTheDocument();
    // Changed by hand: no longer the note's estimate
    await userEvent.click(screen.getByRole("button", { name: "Not specified" }));
    expect(screen.queryByText("Estimated from “next week”")).not.toBeInTheDocument();
  });

  it("puts a come-back for today under Later today", async () => {
    renderForm(
      vi.fn().mockResolvedValue({
        debriefId: "d-1",
        proposal: proposal({ comeBackDate: localDateKey(), comeBackTime: "15:00" }),
      }),
    );
    await dictate("back around 3");

    await waitFor(() => expect(screen.getByRole("button", { name: "Later today" }).className).toContain("bg-gray-900"));
    expect(screen.getByLabelText("Come back at")).toHaveValue("15:00");
  });
});
