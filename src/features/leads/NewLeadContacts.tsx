import { FromBusinessCardTag } from "../businessCards/FillFromBusinessCard";
import { type ContactDraft, emptyContact, hasAnyValue } from "./contactDrafts";

const TEXT_FIELDS = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["title", "Title (e.g. Owner)"],
  ["phone", "Phone"],
  ["email", "Email"],
] as const;

const INPUT =
  "w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary";

/** Add Lead's Contacts section: one entry per person. */
export const NewLeadContacts = ({
  contacts,
  onChange,
  businessName,
}: {
  contacts: ContactDraft[];
  onChange: (contacts: ContactDraft[]) => void;
  businessName: string;
}) => {
  const update = (key: string, change: Partial<ContactDraft>) =>
    onChange(contacts.map((c) => (c.key === key ? { ...c, ...change, edited: true } : c)));
  const remove = (key: string) => {
    const rest = contacts.filter((c) => c.key !== key);
    onChange(rest.length ? rest : [emptyContact()]);
  };

  return (
    <div className="space-y-3">
      {contacts.map((contact) => {
        const fromCard = contact.attachmentIds.length > 0;
        const held = contact.otherBusiness !== null;
        return (
          <div key={contact.key} className={`rounded-lg border bg-white/60 p-3 ${held ? "opacity-70" : ""}`}>
            <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
              <span>
                {fromCard ? "From a business card" : "Contact"}
                <FromBusinessCardTag show={fromCard && !contact.edited && !held} />
              </span>
              {(contacts.length > 1 || hasAnyValue(contact)) && (
                <button
                  type="button"
                  onClick={() => remove(contact.key)}
                  aria-label={`Remove ${contact.firstName || "contact"}`}
                  className="text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>

            {held && (
              <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1 mb-2">
                Business card for <strong>{contact.otherBusiness}</strong>
                {businessName.trim() ? `, not ${businessName.trim()}` : ""}. Not added.{" "}
                <button
                  type="button"
                  onClick={() => update(contact.key, { otherBusiness: null })}
                  className="font-medium underline"
                >
                  Add anyway
                </button>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEXT_FIELDS.map(([field, placeholder]) => (
                <input
                  key={field}
                  type={field === "email" ? "email" : "text"}
                  aria-label={placeholder}
                  placeholder={placeholder}
                  value={contact[field]}
                  onChange={(e) => update(contact.key, { [field]: e.target.value })}
                  className={INPUT}
                />
              ))}
              <label className="flex items-center gap-2 text-sm px-1">
                <input
                  type="checkbox"
                  checked={contact.isDecisionMaker}
                  onChange={(e) => update(contact.key, { isDecisionMaker: e.target.checked })}
                />
                Decision-maker
              </label>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([...contacts, emptyContact()])}
        className="text-sm font-medium text-green-700 underline"
      >
        + Add contact
      </button>
    </div>
  );
};
