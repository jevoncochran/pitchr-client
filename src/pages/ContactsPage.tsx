import { useEffect, useState } from "react";
import { formatPhone, toTelHref } from "../utils/phone";
import { useNavigate } from "react-router-dom";
import api from "../api";
import InternalLayout from "../components/InternalLayout";

type ContactFilter = "standalone" | "all";

export const HOW_WE_MET_OPTIONS = [
  { value: "OUTREACH", label: "Outreach" },
  { value: "REFERRAL", label: "Referral" },
  { value: "NETWORKING", label: "Networking Group / Event" },
  { value: "IN_PERSON", label: "In Person / Walk-Up" },
  { value: "FORM", label: "Form / Inquiry" },
  { value: "OTHER", label: "Other..." },
] as const;

export const HOW_WE_MET_LABELS: Record<string, string> = Object.fromEntries(
  HOW_WE_MET_OPTIONS.map((o) => [o.value, o.label])
);

const ContactsPage = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<any[]>([]);
  const [filter, setFilter] = useState<ContactFilter>("standalone");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New contact form state
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newHowWeMetSelect, setNewHowWeMetSelect] = useState("");
  const [newHowWeMetOther, setNewHowWeMetOther] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/api/contacts?filter=${filter}`).then((res) => setContacts(res.data));
  }, [filter]);

  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q)
    );
  });

  const isOverdue = (c: any) => {
    if (!c.lastContactedAt) return true;
    const daysSince =
      (Date.now() - new Date(c.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 14;
  };

  const resetAddForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewTitle("");
    setNewEmail("");
    setNewPhone("");
    setNewHowWeMetSelect("");
    setNewHowWeMetOther("");
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/contacts", {
        firstName: newFirstName,
        ...(newLastName && { lastName: newLastName }),
        ...(newTitle && { title: newTitle }),
        ...(newEmail && { email: newEmail }),
        ...(newPhone && { phone: newPhone }),
        ...(newHowWeMetSelect && { howWeMet: newHowWeMetSelect }),
        ...(newHowWeMetSelect === "OTHER" && newHowWeMetOther.trim() && {
          howWeMetNote: newHowWeMetOther.trim(),
        }),
      });
      resetAddForm();
      setShowAddModal(false);
      navigate(`/contacts/${res.data.id}`);
    } catch {
      alert("Failed to create contact");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-primary/30 bg-white";
  const labelCls =
    "text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1 block";

  return (
    <InternalLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Contacts</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-charcoal text-white rounded-lg px-3 md:px-4 h-[36px] md:h-[40px] text-sm"
          >
            + New Contact
          </button>
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white h-[38px]">
            <button
              onClick={() => setFilter("standalone")}
              className={`px-4 text-sm font-medium transition ${
                filter === "standalone"
                  ? "bg-charcoal text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Standalone
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 text-sm font-medium border-l border-gray-200 transition ${
                filter === "all"
                  ? "bg-charcoal text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              All
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by name, email, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border rounded-lg px-3 h-[38px] w-56 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-gray-400 hover:text-gray-600 underline h-[38px]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">
                    Name
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">
                    Title
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">
                    Email
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">
                    Phone
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">
                    Last Contacted
                  </th>
                  {filter === "all" && (
                    <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">
                      Lead
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => {
                  const overdue = isOverdue(contact);
                  return (
                    <tr
                      key={contact.id}
                      className="border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <td className="p-4 text-sm font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          {overdue && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
                              title="Follow-up overdue (14+ days)"
                            />
                          )}
                          <span>
                            {contact.firstName} {contact.lastName}
                          </span>
                          {contact.isDecisionMaker && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                              DM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {contact.title ?? (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {contact.email ?? (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {contact.phone ? (
                          <a
                            href={toTelHref(contact.phone)}
                            className="hover:text-green-primary transition-colors"
                          >
                            {formatPhone(contact.phone)}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {contact.lastContactedAt ? (
                          <span
                            className={
                              overdue
                                ? "text-amber-600 font-medium"
                                : "text-gray-600"
                            }
                          >
                            {new Date(
                              contact.lastContactedAt
                            ).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      {filter === "all" && (
                        <td className="p-4 text-sm text-gray-600">
                          {contact.lead ? (
                            <span
                              className="text-blue-600 hover:underline text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/leads/${contact.lead.id}`);
                              }}
                            >
                              {contact.lead.business}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredContacts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              {contacts.length === 0
                ? "No contacts yet."
                : "No contacts match your search."}
            </p>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-gray-800 mb-5">
              New Contact
            </h2>
            <form onSubmit={handleAddContact} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Title / Role</label>
                <input
                  placeholder="e.g. Owner, Director of Marketing"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>How We Met</label>
                <select
                  value={newHowWeMetSelect}
                  onChange={(e) => {
                    setNewHowWeMetSelect(e.target.value);
                    if (e.target.value !== "OTHER") setNewHowWeMetOther("");
                  }}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  {HOW_WE_MET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {newHowWeMetSelect === "OTHER" && (
                  <input
                    placeholder="Tell us more..."
                    value={newHowWeMetOther}
                    onChange={(e) => setNewHowWeMetOther(e.target.value)}
                    className={`${inputCls} mt-2`}
                    autoFocus
                  />
                )}
              </div>

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetAddForm();
                    setShowAddModal(false);
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl py-2.5 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-primary text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </InternalLayout>
  );
};

export default ContactsPage;
