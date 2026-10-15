import { formatPhone, toTelHref } from "../../lib/phone";
import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import type { LeadDetail } from "./useLeadDetail";

/** The lead's contacts: add, edit, delete. */
export const LeadContacts = ({ detail }: { detail: LeadDetail }) => {
  const {
    contacts,
    showContactForm,
    setShowContactForm,
    editingContactId,
    setEditingContactId,
    deletingContactId,
    setDeletingContactId,
    contactForm,
    setContactForm,
    savingContact,
    resetContactForm,
    handleContactSave,
    handleContactDelete,
  } = detail;
  return (
    <SectionCard className="rounded-xl p-4 mb-6">
      <SectionHeader
        title={`Contacts (${contacts.length})`}
        action={
          <button
            onClick={() => {
              resetContactForm();
              setEditingContactId(null);
              setShowContactForm((v) => !v);
            }}
            className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
          >
            {showContactForm ? "Cancel" : "+ Add Contact"}
          </button>
        }
      />

      {/* Add contact form */}
      {showContactForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                First Name *
              </label>
              <input
                type="text"
                value={contactForm.firstName}
                onChange={(e) =>
                  setContactForm((f) => ({
                    ...f,
                    firstName: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Last Name
              </label>
              <input
                type="text"
                value={contactForm.lastName}
                onChange={(e) =>
                  setContactForm((f) => ({
                    ...f,
                    lastName: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Title / Role
              </label>
              <input
                type="text"
                placeholder="e.g. Owner, Marketing Director"
                value={contactForm.title}
                onChange={(e) =>
                  setContactForm((f) => ({
                    ...f,
                    title: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Phone
              </label>
              <input
                type="text"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm((f) => ({
                    ...f,
                    phone: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm((f) => ({
                    ...f,
                    email: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={contactForm.bio}
                onChange={(e) =>
                  setContactForm((f) => ({
                    ...f,
                    bio: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={contactForm.isDecisionMaker}
                onChange={(e) =>
                  setContactForm((f) => ({
                    ...f,
                    isDecisionMaker: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <span className="font-medium text-gray-700">
                Decision Maker
              </span>
            </label>
            <button
              onClick={handleContactSave}
              disabled={savingContact}
              className="bg-charcoal text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {savingContact ? "Saving..." : "Save Contact"}
            </button>
          </div>
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 && !showContactForm && (
        <p className="text-sm text-gray-400 py-2">
          No contacts added yet.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {contacts.map((c) =>
          editingContactId === c.id ? (
            <div
              key={c.id}
              className="bg-gray-50 rounded-lg p-4 text-sm border"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={contactForm.firstName}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={contactForm.lastName}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        lastName: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Title / Role
                  </label>
                  <input
                    type="text"
                    value={contactForm.title}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        title: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        email: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={contactForm.bio}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        bio: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={contactForm.isDecisionMaker}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        isDecisionMaker: e.target.checked,
                      }))
                    }
                  />
                  <span className="font-medium text-gray-700">
                    Decision Maker
                  </span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingContactId(null);
                      resetContactForm();
                    }}
                    className="text-sm text-gray-500 border px-3 py-1.5 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContactSave}
                    disabled={savingContact}
                    className="text-sm bg-charcoal text-white px-4 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {savingContact ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={c.id}
              className="flex items-start justify-between border rounded-lg px-4 py-3 bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0 mt-0.5">
                  {c.firstName[0]}
                  {c.lastName?.[0] ?? ""}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">
                      {c.firstName} {c.lastName}
                    </span>
                    {c.isDecisionMaker && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Decision Maker
                      </span>
                    )}
                    {c.title && (
                      <span className="text-xs text-gray-400">
                        {c.title}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {c.phone && (
                      <a
                        href={toTelHref(c.phone)}
                        className="text-xs text-gray-500 hover:text-green-primary transition-colors"
                      >
                        {formatPhone(c.phone)}
                      </a>
                    )}
                    {c.email && (
                      <span className="text-xs text-gray-500">
                        {c.email}
                      </span>
                    )}
                    {c.notes && (
                      <span className="text-xs text-gray-400 italic">
                        {c.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {deletingContactId === c.id ? (
                  <>
                    <span className="text-xs text-gray-500">
                      Delete?
                    </span>
                    <button
                      onClick={() => handleContactDelete(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeletingContactId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingContactId(c.id);
                        setShowContactForm(false);
                        setContactForm({
                          firstName: c.firstName,
                          lastName: c.lastName ?? "",
                          title: c.title ?? "",
                          email: c.email ?? "",
                          phone: c.phone ?? "",
                          isDecisionMaker: c.isDecisionMaker,
                          bio: c.bio ?? "",
                        });
                      }}
                      className="text-xs text-gray-400 hover:text-gray-700 border rounded px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingContactId(c.id)}
                      className="text-xs text-gray-400 hover:text-red-500 border rounded px-2 py-1"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </SectionCard>
  );
};
