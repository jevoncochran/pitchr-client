import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../../lib/api";
import { BusinessCardScanLine, BusinessCardSuggestions } from "../BusinessCardScanLine";
import { type PersonCard, ScannedAttachment, useBusinessCardScanPolling } from "../businessCardScan";
import { StopPhotos } from "../../sessions/StopPhotos";

vi.mock("../../../lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const photo = (over: Partial<ScannedAttachment> = {}): ScannedAttachment => ({
  id: "a-1",
  url: "https://files.example/a-1.jpg",
  filename: "card.jpg",
  mimeType: "image/jpeg",
  createdAt: new Date().toISOString(),
  contactId: null,
  businessCardScan: "PENDING",
  businessCardData: null,
  ...over,
});

const MARIA = { id: "c-maria", firstName: "Maria", lastName: "López" };

const BUSINESS = {
  name: "Lopez Med Spa",
  email: null,
  website: null,
  instagramHandle: null,
  address: null,
  addressLine1: null,
  city: null,
  state: null,
  zip: null,
  otherPhones: [],
  socialHandles: [],
  suggestedIndustryId: null,
  suggestedBusinessTypeId: null,
};

/** What's stored on a photo of one person's business card */
const storedPerson = (over: Partial<PersonCard> = {}): ScannedAttachment["businessCardData"] => ({
  role: "person",
  personIndex: 0,
  business: BUSINESS,
  person: {
    photos: [0],
    firstName: "Maria",
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
  },
});
const MARIA_B = { id: "c-maria-b", firstName: "Maria", lastName: "Brown" };

describe("BusinessCardScanLine", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows each scan state", () => {
    const { rerender } = render(<BusinessCardScanLine attachment={photo()} contacts={[]} onChanged={vi.fn()} />);
    expect(screen.getByText("Reading business card…")).toBeInTheDocument();

    rerender(
      <BusinessCardScanLine attachment={photo({ businessCardScan: "BUSINESS_CARD", contactId: "c-maria" })} contacts={[MARIA]} onChanged={vi.fn()} />,
    );
    expect(screen.getByText("Business card · Maria López")).toBeInTheDocument();

    rerender(<BusinessCardScanLine attachment={photo({ businessCardScan: "NOT_BUSINESS_CARD" })} contacts={[]} onChanged={vi.fn()} />);
    expect(screen.queryByText(/card/i)).not.toBeInTheDocument();
  });

  it("retries a failed scan", async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    const onChanged = vi.fn();
    render(<BusinessCardScanLine attachment={photo({ businessCardScan: "FAILED" })} contacts={[]} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(mockApi.post).toHaveBeenCalledWith("/api/attachments/a-1/business-card-scan/retry");
    expect(onChanged).toHaveBeenCalled();
  });

  it("asks who an ambiguous business card belongs to, offering the candidates and New", async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    render(
      <BusinessCardScanLine
        attachment={photo({
          businessCardScan: "NEEDS_MATCH",
          businessCardData: storedPerson({
            firstName: "Maria",
            lastName: "L.",
            match: "ambiguous",
            candidateContactIds: ["c-maria", "c-maria-b"],
          }),
        })}
        contacts={[MARIA, MARIA_B, { id: "c-jen", firstName: "Jen", lastName: null }]}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.getByText("Whose business card is this? (Maria L.)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Jen" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Maria Brown" }));
    expect(mockApi.post).toHaveBeenCalledWith("/api/attachments/a-1/business-card-scan/match", { contactId: "c-maria-b" });

    await userEvent.click(screen.getByRole("button", { name: "New contact" }));
    expect(mockApi.post).toHaveBeenLastCalledWith("/api/attachments/a-1/business-card-scan/match", { contactId: "new" });
  });
});

describe("BusinessCardScanLine: several business cards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("holds a business card for another business, with Add anyway and Remove", async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    mockApi.delete.mockResolvedValue({ data: {} });
    const onChanged = vi.fn();
    render(
      <BusinessCardScanLine
        attachment={photo({
          businessCardScan: "OTHER_BUSINESS",
          businessCardData: storedPerson({ sameBusiness: "no", businessName: "Bright Smile Dental" }),
        })}
        contacts={[]}
        onChanged={onChanged}
      />,
    );

    expect(screen.getByText("Bright Smile Dental")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add anyway" }));
    expect(mockApi.post).toHaveBeenCalledWith("/api/attachments/a-1/business-card-scan/add-anyway");
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(mockApi.delete).toHaveBeenCalledWith("/api/attachments/a-1/business-card");
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it("labels a side with only the business on it", () => {
    render(
      <BusinessCardScanLine
        attachment={photo({
          businessCardScan: "BUSINESS_CARD",
          businessCardData: { role: "business", person: null, personIndex: null, business: BUSINESS },
        })}
        contacts={[]}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.getByText("Business card · business details")).toBeInTheDocument();
  });
});

describe("BusinessCardSuggestions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("replaces or keeps a value the business card disagreed with", async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    mockApi.delete.mockResolvedValue({ data: {} });
    const onChanged = vi.fn();
    render(
      <BusinessCardSuggestions
        suggestions={[
          { id: "s-1", field: "email", currentValue: "maria@gmail.com", suggestedValue: "maria@lopezmedspa.com" },
          { id: "s-2", field: "title", currentValue: "Manager", suggestedValue: "Owner" },
        ]}
        onChanged={onChanged}
      />,
    );

    expect(screen.getByText("maria@lopezmedspa.com")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Replace" })[0]);
    expect(mockApi.post).toHaveBeenCalledWith("/api/contacts/suggestions/s-1/replace");
    await userEvent.click(screen.getAllByRole("button", { name: "Keep" })[1]);
    expect(mockApi.delete).toHaveBeenCalledWith("/api/contacts/suggestions/s-2");
    expect(onChanged).toHaveBeenCalledTimes(2);
  });
});

describe("useBusinessCardScanPolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("polls while a photo is being read and reports when it's done", () => {
    const refresh = vi.fn();
    const onScanned = vi.fn();
    const { rerender } = renderHook(({ list }) => useBusinessCardScanPolling(list, refresh, onScanned), {
      initialProps: { list: [photo()] },
    });

    act(() => vi.advanceTimersByTime(2600));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onScanned).not.toHaveBeenCalled();

    rerender({ list: [photo({ businessCardScan: "BUSINESS_CARD" })] });
    expect(onScanned).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(10_000));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe("StopPhotos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows today's photos only and uploads several business cards together", async () => {
    const old = photo({ id: "a-old", createdAt: "2026-01-02T15:00:00.000Z", businessCardScan: "BUSINESS_CARD" });
    const today = photo({ id: "a-today", businessCardScan: "NOT_BUSINESS_CARD", filename: "storefront.jpg" });
    mockApi.get.mockResolvedValue({ data: [today, old] });
    mockApi.post.mockResolvedValue({
      data: [photo({ id: "a-maria", filename: "maria.jpg" }), photo({ id: "a-back", filename: "back.jpg" })],
    });

    render(<StopPhotos leadId="lead-1" contacts={[]} onContactsChanged={vi.fn()} />);

    await waitFor(() => expect(screen.getByAltText("storefront.jpg")).toBeInTheDocument());
    expect(mockApi.get).toHaveBeenCalledWith("/api/attachments/lead/lead-1");
    expect(screen.queryByAltText("card.jpg")).not.toBeInTheDocument();

    await userEvent.upload(screen.getByLabelText("Business card photos"), [
      new File(["x"], "maria.jpg", { type: "image/jpeg" }),
      new File(["y"], "back.jpg", { type: "image/jpeg" }),
    ]);

    await waitFor(() => expect(screen.getByAltText("back.jpg")).toBeInTheDocument());
    const [url, form] = mockApi.post.mock.calls[0] as [string, FormData];
    expect(url).toBe("/api/attachments/business-cards");
    expect(form.getAll("files")).toHaveLength(2);
    expect(form.get("leadId")).toBe("lead-1");
    expect(screen.getAllByText("Reading business card…")).toHaveLength(2);
  });

  it("refuses more than 6 photos at a time", async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    render(<StopPhotos leadId="lead-1" contacts={[]} onContactsChanged={vi.fn()} />);

    await userEvent.upload(
      screen.getByLabelText("Business card photos"),
      Array.from({ length: 7 }, (_, i) => new File(["x"], `${i}.jpg`, { type: "image/jpeg" })),
    );

    expect(screen.getByText(/Up to 6 photos at a time/)).toBeInTheDocument();
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});
