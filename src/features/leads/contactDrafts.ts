import type { NewLeadBusinessCard } from "../businessCards/businessCardScan";

/** One contact on the Add Lead form: typed in, or read from a business card. */
export interface ContactDraft {
  key: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  isDecisionMaker: boolean;
  /** The photos of this person's business card (none when typed in) */
  attachmentIds: string[];
  /** Changed by hand since it was read: kept as is when business cards are read again */
  edited: boolean;
  /** A business card for another business: not saved unless "Add anyway" */
  otherBusiness: string | null;
}

let nextKey = 0;
export const emptyContact = (): ContactDraft => ({
  key: `contact-${nextKey++}`,
  firstName: "",
  lastName: "",
  title: "",
  email: "",
  phone: "",
  isDecisionMaker: false,
  attachmentIds: [],
  edited: false,
  otherBusiness: null,
});

export const hasAnyValue = (c: ContactDraft) =>
  [c.firstName, c.lastName, c.title, c.email, c.phone].some((v) => v.trim());

/**
 * The contacts after business cards are read (again): what was typed in or
 * edited stays; people from business cards replace the ones read before.
 */
export const contactsFromBusinessCards = (
  { attachments, reading }: NewLeadBusinessCard,
  current: ContactDraft[],
): ContactDraft[] => {
  const kept = current.filter((c) => (c.attachmentIds.length === 0 && hasAnyValue(c)) || c.edited);
  const keptPhotos = new Set(kept.flatMap((c) => c.attachmentIds));
  const read = reading.people
    .map((person): ContactDraft => ({
      ...emptyContact(),
      firstName: person.firstName,
      lastName: person.lastName ?? "",
      title: person.title ?? "",
      email: person.email ?? "",
      phone: person.phone ?? "",
      isDecisionMaker: person.isDecisionMaker,
      attachmentIds: person.photos.map((i) => attachments[i]?.id).filter(Boolean),
      otherBusiness: person.sameBusiness === "no" ? (person.businessName ?? "another business") : null,
    }))
    .filter((c) => !c.attachmentIds.some((id) => keptPhotos.has(id)));
  const contacts = [...kept, ...read];
  return contacts.length ? contacts : [emptyContact()];
};
