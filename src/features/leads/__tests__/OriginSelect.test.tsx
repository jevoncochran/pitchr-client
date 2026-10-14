import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OriginSelect } from "../OriginSelect";
import { originLabel } from "../origins";

describe("OriginSelect", () => {
  it("groups the origins into we reached out / they came to us", () => {
    render(<OriginSelect origin="" originOther="" onChange={() => {}} />);

    const groups = screen.getAllByRole("group");
    expect(groups.map((g) => g.getAttribute("label"))).toEqual(["We reached out", "They came to us"]);
    expect(screen.getByRole("option", { name: "In-person visit" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Approached us" })).toBeInTheDocument();
  });

  it("asks for a description only with Other, and drops it when switching away", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<OriginSelect origin="OTHER" originOther="Podcast" onChange={onChange} />);
    expect(screen.getByPlaceholderText("How did it start?")).toHaveValue("Podcast");

    await userEvent.selectOptions(screen.getByRole("combobox"), "DM");
    expect(onChange).toHaveBeenCalledWith({ origin: "DM", originOther: "" });

    rerender(<OriginSelect origin="DM" originOther="" onChange={onChange} />);
    expect(screen.queryByPlaceholderText("How did it start?")).not.toBeInTheDocument();
  });
});

describe("originLabel", () => {
  it("shows the label, Other's description, or nothing when unknown", () => {
    expect(originLabel({ origin: "NETWORKING_EVENT" })).toBe("Networking event");
    expect(originLabel({ origin: "OTHER", originOther: "Podcast" })).toBe("Podcast");
    expect(originLabel({ origin: null })).toBeNull();
  });
});
