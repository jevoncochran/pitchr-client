import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../../../lib/api";
import AddLeadPage from "../../leads/AddLeadPage";
import type { BusinessInfo, NewLeadBusinessCard, PersonCard } from "../businessCardScan";

vi.mock("../../../lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
// No real Google script in tests
vi.mock("../../../lib/googleMaps", () => ({ loadGoogleMaps: () => new Promise(() => {}) }));
vi.mock("../../../app/InternalLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const business = (over: Partial<BusinessInfo> = {}): BusinessInfo => ({
  name: "Lopez Med Spa",
  email: "info@lopezmedspa.com",
  website: "lopezmedspa.com",
  instagramHandle: "lopezmedspa",
  address: null,
  addressLine1: "100 Main St",
  city: "Orlando",
  state: "FL",
  zip: "32801",
  otherPhones: [],
  socialHandles: [],
  suggestedIndustryId: "i-aesthetics",
  suggestedBusinessTypeId: "t-medspa",
  ...over,
});

const person = (photos: number[], firstName: string, over: Partial<PersonCard> = {}): PersonCard => ({
  photos,
  firstName,
  lastName: null,
  title: null,
  email: null,
  phone: null,
  isDecisionMaker: false,
  businessName: "Lopez Med Spa",
  sameBusiness: "yes",
  match: "new",
  matchedContactId: null,
  candidateContactIds: [],
  ...over,
});

const result = (ids: string[], over: Partial<NewLeadBusinessCard["reading"]> = {}, duplicates = []) => ({
  attachments: ids.map((id) => ({ id, url: `https://files/${id}.jpg` })),
  reading: { business: business(), people: [], businessOnlyPhotos: [], notBusinessCardPhotos: [], ...over },
  duplicates,
});

// Maria (owner), Sam (marketing), Ana: three fronts and the back they share
const THREE_AND_A_BACK = result(["a-maria", "a-sam", "a-ana", "a-back"], {
  people: [
    person([0], "María", { lastName: "López", title: "Owner", isDecisionMaker: true, email: "maria@lopezmedspa.com" }),
    person([1], "Sam", { title: "Marketing coordinator" }),
    person([2], "Ana", { title: "Aesthetician" }),
  ],
  businessOnlyPhotos: [3],
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/add-lead"]}>
      <Routes>
        <Route path="/add-lead" element={<AddLeadPage />} />
        <Route path="/leads/:id" element={<p>Lead page</p>} />
      </Routes>
    </MemoryRouter>,
  );

const upload = (...names: string[]) =>
  userEvent.upload(
    screen.getByLabelText("Business card photos"),
    names.map((name) => new File(["x"], name, { type: "image/jpeg" })),
  );

const respondWith = (...reads: unknown[]) => {
  const queue = [...reads];
  mockApi.post.mockImplementation((url: string) =>
    url === "/api/business-cards/read"
      ? Promise.resolve({ data: queue.shift() })
      : Promise.resolve({ data: { id: "lead-new" } }),
  );
};

const leadPayload = () => mockApi.post.mock.calls.find(([url]) => url === "/api/leads")![1];
const firstNames = () => screen.getAllByLabelText("First name").map((input) => (input as HTMLInputElement).value);

describe("Add Lead: Fill in from business card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve({
        data:
          url === "/api/industries"
            ? [{ id: "i-aesthetics", name: "Aesthetics" }]
            : url === "/api/business-types"
              ? [{ id: "t-medspa", name: "Med spa" }]
              : [],
      }),
    );
  });

  it("fills in the business and one contact per business card, and saves them together", async () => {
    respondWith(THREE_AND_A_BACK);
    renderPage();
    await waitFor(() => expect(screen.getByRole("option", { name: "Aesthetics" })).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText("Enter the website"), "lopez.com");
    await upload("maria.jpg", "sam.jpg", "ana.jpg", "back.jpg");

    await waitFor(() => expect(screen.getByPlaceholderText("Enter the business name")).toHaveValue("Lopez Med Spa"));
    // Typed in before reading: kept
    expect(screen.getByPlaceholderText("Enter the website")).toHaveValue("lopez.com");
    expect(firstNames()).toEqual(["María", "Sam", "Ana"]);
    expect(screen.getAllByAltText(/Business card photo/)).toHaveLength(4);

    await userEvent.type(screen.getByLabelText("How we met"), "Front desk at their spa");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("Lead page")).toBeInTheDocument());
    expect(leadPayload()).toMatchObject({
      business: "Lopez Med Spa",
      website: "lopez.com",
      email: "info@lopezmedspa.com",
      industry: { connect: { id: "i-aesthetics" } },
      location: { addressLine1: "100 Main St", city: "Orlando", state: "FL", zip: "32801" },
      contacts: [
        { firstName: "María", title: "Owner", isDecisionMaker: true, businessCardAttachmentIds: ["a-maria"] },
        { firstName: "Sam", businessCardAttachmentIds: ["a-sam"] },
        { firstName: "Ana", businessCardAttachmentIds: ["a-ana"] },
      ],
      howWeMet: "Front desk at their spa",
      businessCardAttachmentIds: ["a-back", "a-maria", "a-sam", "a-ana"],
    });
  });

  it("reads the back together with the front, and improves what it filled in", async () => {
    respondWith(
      // The front alone: a person, no business name
      result(["a-front"], {
        business: business({ name: null, website: "lopez.com", email: null }),
        people: [person([0], "María")],
      }),
      // Front and back together
      result(["a-front", "a-back"], { people: [person([0], "María")], businessOnlyPhotos: [1] }),
    );
    renderPage();

    await upload("front.jpg");
    await waitFor(() => expect(screen.getByText("No business name found. Is it on the back?")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Enter the website")).toHaveValue("lopez.com");
    await userEvent.clear(screen.getByLabelText("Title (e.g. Owner)"));
    await userEvent.type(screen.getByLabelText("Title (e.g. Owner)"), "Owner");

    await upload("back.jpg");

    await waitFor(() => expect(screen.getByPlaceholderText("Enter the business name")).toHaveValue("Lopez Med Spa"));
    const [, form] = mockApi.post.mock.calls[1] as [string, FormData];
    expect(form.getAll("attachmentIds")).toEqual(["a-front"]);
    // Filled from the front and not edited: improved by the back
    expect(screen.getByPlaceholderText("Enter the website")).toHaveValue("lopezmedspa.com");
    // María was edited after the first read: kept, not read again as a second María
    expect(firstNames()).toEqual(["María"]);
    expect(screen.getByLabelText("Title (e.g. Owner)")).toHaveValue("Owner");
  });

  it("leaves out a business card for another business unless Add anyway", async () => {
    respondWith(
      result(["a-maria", "a-tom"], {
        people: [
          person([0], "María"),
          person([1], "Tom", { sameBusiness: "no", businessName: "Bright Smile Dental" }),
        ],
      }),
    );
    renderPage();
    await upload("maria.jpg", "tom.jpg");

    await waitFor(() => expect(screen.getByText("Bright Smile Dental")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Lead page")).toBeInTheDocument());
    expect(leadPayload().contacts).toEqual([expect.objectContaining({ firstName: "María" })]);
    expect(leadPayload().businessCardAttachmentIds).toEqual(["a-maria"]);
  });

  it("adds a business card for another business after Add anyway", async () => {
    respondWith(
      result(["a-tom"], { people: [person([0], "Tom", { sameBusiness: "no", businessName: "Bright Smile Dental" })] }),
    );
    renderPage();
    await upload("tom.jpg");

    const held = await screen.findByText("Bright Smile Dental");
    await userEvent.click(within(held.closest("p")!).getByRole("button", { name: "Add anyway" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("Lead page")).toBeInTheDocument());
    expect(leadPayload().contacts).toEqual([expect.objectContaining({ firstName: "Tom", businessCardAttachmentIds: ["a-tom"] })]);
  });

  it("offers to add the business cards to a lead they already are", async () => {
    respondWith(result(["a-1", "a-2"], { people: [person([0], "María")], businessOnlyPhotos: [1] }, [
      { id: "lead-lopez", business: "Lopez Med Spa" },
    ] as never));
    renderPage();
    await upload("front.jpg", "back.jpg");

    await waitFor(() => expect(screen.getByText("Lopez Med Spa")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Add this business card there" }));

    expect(mockApi.post).toHaveBeenCalledWith("/api/business-cards/add-to-lead", {
      attachmentIds: ["a-1", "a-2"],
      leadId: "lead-lopez",
    });
    await waitFor(() => expect(screen.getByText("Lead page")).toBeInTheDocument());
  });

  it("saves a lead without an industry or business type when the business card doesn't suggest one", async () => {
    respondWith(
      result(["a-1"], {
        business: business({ name: "La Unión Residence & Social Hall", suggestedIndustryId: null, suggestedBusinessTypeId: null }),
        people: [person([0], "Rosa")],
      }),
    );
    renderPage();
    await upload("card.jpg");

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Enter the business name")).toHaveValue("La Unión Residence & Social Hall"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("Lead page")).toBeInTheDocument());
    expect(leadPayload()).not.toHaveProperty("industry");
    expect(leadPayload()).not.toHaveProperty("businessType");
  });

  it("refuses more than 6 photos in all", async () => {
    renderPage();
    await upload(...Array.from({ length: 7 }, (_, i) => `${i}.jpg`));

    expect(screen.getByText(/Up to 6 photos in all/)).toBeInTheDocument();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it("says so when the photos can't be read, and keeps the form", async () => {
    mockApi.post.mockRejectedValue(new Error("502"));
    renderPage();
    await userEvent.type(screen.getByPlaceholderText("Enter the business name"), "Typed Name");
    await upload("card.jpg");

    await waitFor(() => expect(screen.getByText(/Couldn't read these photos/)).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Enter the business name")).toHaveValue("Typed Name");
  });

  it("won't save half an address or a contact without a first name", async () => {
    window.alert = vi.fn();
    renderPage();
    await userEvent.type(screen.getByPlaceholderText("Street address"), "100 Main St");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(window.alert).toHaveBeenCalledWith("An address needs a street, city and state");

    await userEvent.clear(screen.getByPlaceholderText("Street address"));
    await userEvent.type(screen.getByLabelText("Last name"), "López");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(window.alert).toHaveBeenCalledWith("A contact needs a first name");
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});
