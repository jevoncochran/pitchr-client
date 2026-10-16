import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import InternalLayout from "../InternalLayout";
import { AuthContext } from "../../features/auth/AuthContext";

const renderAt = (path: string) =>
  render(
    <AuthContext.Provider
      value={{ user: { firstName: "Jevon", lastName: "Cochran" }, token: "t", login: vi.fn(), logout: vi.fn() }}
    >
      <MemoryRouter initialEntries={[path]}>
        <InternalLayout>
          <p>page</p>
        </InternalLayout>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("InternalLayout", () => {
  it("shows four tabs plus More on phones, and every page in the sidebar", () => {
    renderAt("/dashboard");

    const tabs = within(screen.getByRole("navigation", { name: "Tabs" }));
    expect(tabs.getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Dashboard",
      "Leads",
      "Sessions",
      "Tasks",
    ]);
    expect(tabs.getByRole("button", { name: "More" })).toBeInTheDocument();

    const sidebar = within(screen.getByRole("navigation", { name: "Main" }));
    expect(sidebar.getByRole("link", { name: "Analytics" })).toHaveAttribute("href", "/analytics");
  });

  it("opens the More sheet with the other pages and who's signed in", async () => {
    renderAt("/dashboard");
    const more = screen.getByRole("button", { name: "More" });
    expect(more).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(more);

    const sheet = within(screen.getByRole("dialog", { name: "More" }));
    expect(sheet.getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Contacts",
      "Pipeline",
      "Analytics",
      "Settings",
    ]);
    expect(sheet.getByText("Jevon Cochran")).toBeInTheDocument();
    expect(more).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "More" })).not.toBeInTheDocument();
  });

  it("closes the sheet after picking a page", async () => {
    renderAt("/dashboard");
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    await userEvent.click(within(screen.getByRole("dialog", { name: "More" })).getByRole("link", { name: "Pipeline" }));

    expect(screen.queryByRole("dialog", { name: "More" })).not.toBeInTheDocument();
  });

  it("marks More as current on a page that lives under it", () => {
    renderAt("/contacts/c-1");

    expect(screen.getByRole("button", { name: "More" }).className).toContain("bg-white");
  });
});
