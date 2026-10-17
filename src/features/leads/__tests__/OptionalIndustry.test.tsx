import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadInfo } from "../LeadInfo";
import type { LeadDetail } from "../useLeadDetail";

// Only what the read-only view of LeadInfo uses
const detail = (lead: object, startEdit = vi.fn()) =>
  ({
    id: "lead-1",
    navigate: vi.fn(),
    lead: {
      id: "lead-1",
      business: "La Unión Hall",
      industry: null,
      businessType: null,
      origin: null,
      ...lead,
    },
    industries: [],
    businessTypes: [],
    users: [],
    allLeads: [],
    referralSearch: "",
    setReferralSearch: vi.fn(),
    showReferralSuggestions: false,
    setShowReferralSuggestions: vi.fn(),
    editMode: false,
    setEditMode: vi.fn(),
    editForm: {},
    setEditForm: vi.fn(),
    saving: false,
    startEdit,
    handleEditSave: vi.fn(),
    handleAssigneeChange: vi.fn(),
    fetchLead: vi.fn(),
  }) as unknown as LeadDetail;

describe("A lead saved without an industry or business type", () => {
  it("asks for both on the lead page, and Add opens the edit form", async () => {
    const startEdit = vi.fn();
    render(<LeadInfo detail={detail({}, startEdit)} />);

    expect(screen.getByText("No industry or business type yet")).toBeInTheDocument();
    expect(screen.getAllByText("Not set")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(startEdit).toHaveBeenCalled();
  });

  it("asks only for what's missing", () => {
    render(<LeadInfo detail={detail({ industry: { id: "i-1", name: "Event venues" } })} />);

    expect(screen.getByText("No business type yet")).toBeInTheDocument();
  });

  it("asks nothing once both are set", () => {
    render(
      <LeadInfo
        detail={detail({
          industry: { id: "i-1", name: "Event venues" },
          businessType: { id: "t-1", name: "Venue" },
        })}
      />,
    );

    expect(screen.queryByText(/^No (industry|business type)/)).not.toBeInTheDocument();
    expect(screen.queryByText("Not set")).not.toBeInTheDocument();
  });
});
