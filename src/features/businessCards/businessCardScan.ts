// Business card scan (pitchr-server docs/business-card-scan.md): photos uploaded to a lead are read,
// and a business card becomes a contact or fills one in. These pieces show where
// each photo's scan stands and let the owner act on it.

import { useEffect, useRef } from "react";

export type BusinessCardScanStatus =
  | "PENDING"
  | "BUSINESS_CARD"
  | "NOT_BUSINESS_CARD"
  | "NEEDS_MATCH"
  | "OTHER_BUSINESS"
  | "FAILED";

/** Up to 3 people's business cards, front and back, per upload */
export const MAX_BUSINESS_CARD_PHOTOS = 6;

/** The business, as read from the photos (BusinessInfo in pitchr-server). */
export interface BusinessInfo {
  name: string | null;
  email: string | null;
  website: string | null;
  instagramHandle: string | null;
  address: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  otherPhones: string[];
  socialHandles: string[];
  suggestedIndustryId: string | null;
  suggestedBusinessTypeId: string | null;
}

/** One person's business card; `photos` are positions in the upload. */
export interface PersonCard {
  photos: number[];
  firstName: string;
  lastName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  isDecisionMaker: boolean;
  businessName: string | null;
  sameBusiness: "yes" | "no" | "unclear";
  match: "existing" | "new" | "ambiguous";
  matchedContactId: string | null;
  candidateContactIds: string[];
}

/** What was read for one upload of up to 6 photos. */
export interface BusinessCardReading {
  business: BusinessInfo;
  people: PersonCard[];
  businessOnlyPhotos: number[];
  notBusinessCardPhotos: number[];
}

export interface ScannedAttachment {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  createdAt: string;
  contactId: string | null;
  businessCardScan: BusinessCardScanStatus | null;
  /** What was read for this photo: its role, the person on it, the business */
  businessCardData: {
    role: "person" | "business" | "not_business_card";
    person: PersonCard | null;
    personIndex: number | null;
    business: BusinessInfo;
  } | null;
}

export interface BusinessCardContact {
  id: string;
  firstName: string;
  lastName: string | null;
  title?: string | null;
}

/** A contact's field a business card disagreed with: Replace takes the business card's value, Keep leaves it. */
export interface ChangeSuggestion {
  id: string;
  field: "firstName" | "lastName" | "title" | "email" | "phone";
  currentValue: string | null;
  suggestedValue: string;
}

/** POST /api/business-cards/read: business cards read for a new lead (every photo so far). */
export interface NewLeadBusinessCard {
  attachments: { id: string; url: string }[];
  reading: BusinessCardReading;
  /** Leads it might already be */
  duplicates: { id: string; business: string }[];
}

const POLL_MS = 2500;

export const fullName = (c: { firstName?: string | null; lastName?: string | null }) =>
  [c.firstName, c.lastName].filter(Boolean).join(" ");

/**
 * While any photo is still being read, call `refresh` every few seconds. When a
 * scan finishes, call `onScanned` (to reload contacts, which it may have changed).
 */
export const useBusinessCardScanPolling = (
  attachments: ScannedAttachment[],
  refresh: () => void,
  onScanned: () => void,
) => {
  const pending = attachments.some((a) => a.businessCardScan === "PENDING");
  const wasPending = useRef(new Set<string>());
  const latest = useRef({ refresh, onScanned });
  latest.current = { refresh, onScanned };

  useEffect(() => {
    const before = wasPending.current;
    const now = new Set(attachments.filter((a) => a.businessCardScan === "PENDING").map((a) => a.id));
    const finished = [...before].some((id) => !now.has(id));
    wasPending.current = now;
    if (finished) latest.current.onScanned();
  }, [attachments]);

  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => latest.current.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [pending]);
};
