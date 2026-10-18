import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogVisitForm } from "../LogVisitForm";

const renderForm = (onSave = vi.fn()) => {
  render(
    <LogVisitForm type="IN_PERSON" contacts={[]} canAddBackToRoute saving={false} onSave={onSave} />,
  );
  return onSave;
};

describe("LogVisitForm: going back", () => {
  it.each([
    ["Interested", "Going back? When?"],
    ["Decision-maker not available", "Going back? When?"],
    ["Come back later", "When?"],
  ])("offers a time to go back with %s", async (outcome, prompt) => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: outcome }));

    expect(screen.getByText(prompt)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Later today" })).toBeInTheDocument();
  });

  it("doesn't ask when they said no", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Not interested" }));

    expect(screen.queryByRole("button", { name: "Later today" })).not.toBeInTheDocument();
  });

  it('saves "interested, come back another day" with the time to go back', async () => {
    const onSave = renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Interested" }));
    await userEvent.click(screen.getByRole("button", { name: "Another day" }));
    const [date] = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    await userEvent.type(date, "2099-10-17");
    await userEvent.click(screen.getByRole("button", { name: /Save & next/ }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "INTERESTED", comeBackAt: expect.stringMatching(/^2099-10-1[67]T/) }),
    );
  });
});
