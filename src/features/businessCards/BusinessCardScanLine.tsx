import { useState } from "react";
import api from "../../lib/api";
import { BusinessCardContact, ChangeSuggestion, fullName, ScannedAttachment } from "./businessCardScan";

/** One line under a photo: where its business card scan stands, with what can be done next. */
export const BusinessCardScanLine = ({
  attachment,
  contacts,
  onChanged,
}: {
  attachment: ScannedAttachment;
  contacts: BusinessCardContact[];
  onChanged: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (request: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await request();
      onChanged();
    } catch {
      setError("That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const status = attachment.businessCardScan;
  if (!status || status === "NOT_BUSINESS_CARD") return null;

  if (status === "PENDING") {
    return <p className="text-xs text-gray-400 animate-pulse">Reading business card…</p>;
  }

  if (status === "FAILED") {
    return (
      <p className="text-xs text-gray-500">
        Couldn't read this business card.{" "}
        <button
          disabled={busy}
          onClick={() => act(() => api.post(`/api/attachments/${attachment.id}/business-card-scan/retry`))}
          className="text-green-primary font-medium disabled:opacity-50"
        >
          Try again
        </button>
        {error && <span className="block text-red-500">{error}</span>}
      </p>
    );
  }

  const person = attachment.businessCardData?.person ?? null;

  if (status === "OTHER_BUSINESS") {
    return (
      <div className="text-xs text-amber-800">
        <p>
          Business card for <strong>{person?.businessName ?? "another business"}</strong>, not this lead.
        </p>
        <div className="flex gap-3 mt-1">
          <button
            disabled={busy}
            onClick={() => act(() => api.post(`/api/attachments/${attachment.id}/business-card-scan/add-anyway`))}
            className="font-medium underline disabled:opacity-50"
          >
            Add anyway
          </button>
          <button
            disabled={busy}
            onClick={() => act(() => api.delete(`/api/attachments/${attachment.id}/business-card`))}
            className="font-medium underline disabled:opacity-50"
          >
            Remove
          </button>
        </div>
        {error && <p className="text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  if (status === "NEEDS_MATCH") {
    const candidateIds = person?.candidateContactIds ?? [];
    const candidates = contacts.filter((c) => candidateIds.includes(c.id));
    const choose = (contactId: string) =>
      act(() => api.post(`/api/attachments/${attachment.id}/business-card-scan/match`, { contactId }));
    const businessCardName = person ? fullName(person) : "";
    return (
      <div className="text-xs text-gray-600">
        <p className="font-medium">
          Whose business card is this?{businessCardName && ` (${businessCardName})`}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {(candidates.length ? candidates : contacts).map((c) => (
            <button
              key={c.id}
              disabled={busy}
              onClick={() => choose(c.id)}
              className="px-2 py-0.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {fullName(c)}
            </button>
          ))}
          <button
            disabled={busy}
            onClick={() => choose("new")}
            className="px-2 py-0.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            New contact
          </button>
        </div>
        {error && <p className="text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  // BUSINESS_CARD: linked to the contact it created or filled in; a side with
  // only the business on it (often a shared back) is on the lead only
  const contact = contacts.find((c) => c.id === attachment.contactId);
  const detail = contact
    ? fullName(contact)
    : attachment.businessCardData?.role === "business"
      ? "business details"
      : "";
  return (
    <p className="text-xs text-green-700 truncate">
      Business card{detail ? ` · ${detail}` : ""}
    </p>
  );
};

const FIELD_LABEL: Record<ChangeSuggestion["field"], string> = {
  firstName: "first name",
  lastName: "last name",
  title: "title",
  email: "email",
  phone: "phone",
};

/** "Business card says …" for each value a business card disagreed with, with Replace / Keep. */
export const BusinessCardSuggestions = ({
  suggestions,
  onChanged,
}: {
  suggestions: ChangeSuggestion[] | undefined;
  onChanged: () => void;
}) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  if (!suggestions?.length) return null;

  const resolve = async (id: string, replace: boolean) => {
    setBusyId(id);
    try {
      if (replace) await api.post(`/api/contacts/suggestions/${id}/replace`);
      else await api.delete(`/api/contacts/suggestions/${id}`);
      onChanged();
    } catch {
      alert("Failed to update the contact");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-2 space-y-1">
      {suggestions.map((s) => (
        <div key={s.id} className="text-xs bg-amber-50 text-amber-800 rounded px-2 py-1 flex flex-wrap items-center gap-x-2">
          <span>
            Business card says {FIELD_LABEL[s.field]} <strong>{s.suggestedValue}</strong>
          </span>
          <button
            disabled={busyId === s.id}
            onClick={() => resolve(s.id, true)}
            className="font-medium underline disabled:opacity-50"
          >
            Replace
          </button>
          <button
            disabled={busyId === s.id}
            onClick={() => resolve(s.id, false)}
            className="font-medium underline disabled:opacity-50"
          >
            Keep
          </button>
        </div>
      ))}
    </div>
  );
};
