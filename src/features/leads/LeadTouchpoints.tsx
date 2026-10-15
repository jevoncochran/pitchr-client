import DatePicker from "react-datepicker";
import { SEQUENCE_POSITION_LABEL, SEQUENCE_POSITION_COLOR } from "./constants";
import { TOUCHPOINT_TYPES, IN_PERSON_TYPES } from "./touchpoints";
import { getSequencePositions } from "./sequencePositions";
import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { TouchpointResultBadges, TouchpointResultDetails } from "./TouchpointResult";
import { canRecordReply } from "./results";
import type { LeadDetail } from "./useLeadDetail";

/** Touchpoints: log, edit, delete, record replies. */
export const LeadTouchpoints = ({ detail }: { detail: LeadDetail }) => {
  const {
    lead,
    setCompletingTaskId,
    showTouchpointForm,
    setShowTouchpointForm,
    tpType,
    setTpType,
    tpDate,
    setTpDate,
    tpReceivedResponse,
    setTpReceivedResponse,
    tpSummary,
    setTpSummary,
    tpSequencePosition,
    setTpSequencePosition,
    submittingTp,
    tpContactIds,
    setTpContactIds,
    showNewContactForm,
    setShowNewContactForm,
    newContactForm,
    setNewContactForm,
    editingTpId,
    setEditingTpId,
    editTpForm,
    setEditTpForm,
    savingTp,
    deletingTpId,
    setDeletingTpId,
    handleTouchpointSubmit,
    startEditTp,
    handleTouchpointEditSave,
    handleTouchpointDelete,
    setReplyTouchpointId,
  } = detail;
  return (
    <SectionCard
      id="touchpoints-section"
      className="rounded-xl p-4 mb-6"
    >
      <SectionHeader
        title={`Touchpoints (${lead.touchPoint?.filter((tp: any) => tp.type !== "VISIT_ATTEMPT").length ?? 0})`}
        action={
          <button
            onClick={() => {
              if (showTouchpointForm) setCompletingTaskId(null);
              setShowTouchpointForm((v) => !v);
            }}
            className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
          >
            {showTouchpointForm ? "Cancel" : "+ Log Touchpoint"}
          </button>
        }
      />

      {showTouchpointForm && (
        <form
          onSubmit={handleTouchpointSubmit}
          className="bg-gray-50 rounded-lg p-4 mb-4 text-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-1">Type</label>
              <select
                value={tpType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setTpType(newType);
                  // Reset position if it's incompatible with the new type
                  setTpSequencePosition((prev) => {
                    const isVisitPos = [
                      "VISIT_A",
                      "VISIT_B",
                      "VISIT_C",
                    ].includes(prev);
                    const isOutreachPos = prev && !isVisitPos;
                    if (
                      IN_PERSON_TYPES.includes(newType) &&
                      isOutreachPos
                    )
                      return "";
                    if (
                      !IN_PERSON_TYPES.includes(newType) &&
                      isVisitPos
                    )
                      return "";
                    return prev;
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
              >
                {TOUCHPOINT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Date</label>
              <DatePicker
                selected={tpDate}
                onChange={(date: Date | null) =>
                  date && setTpDate(date)
                }
                dateFormat="MM/dd/yyyy"
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none text-sm"
                wrapperClassName="w-full"
              />
            </div>
          </div>
          {tpType !== "VISIT_ATTEMPT" && (
            <div className="mb-4">
              <label className="block font-semibold mb-1">
                Follow-up Stage{" "}
                <span className="text-gray-400 font-normal">
                  (optional)
                </span>
              </label>
              <select
                value={tpSequencePosition}
                onChange={(e) => setTpSequencePosition(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none text-sm"
              >
                {getSequencePositions(tpType).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Summary</label>
            <textarea
              value={tpSummary}
              onChange={(e) => setTpSummary(e.target.value)}
              placeholder="What happened?"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none resize-none"
            />
          </div>

          {/* Contact section — hidden for visit attempts */}
          {tpType !== "VISIT_ATTEMPT" && (
            <div className="mb-4">
              <label className="block font-semibold mb-2">
                Who did you interact with?
              </label>
              {/* Existing contacts */}
              {lead.contacts?.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  {lead.contacts.map((c: any) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={tpContactIds.includes(c.id)}
                        onChange={(e) =>
                          setTpContactIds(
                            e.target.checked
                              ? [...tpContactIds, c.id]
                              : tpContactIds.filter((x) => x !== c.id),
                          )
                        }
                      />
                      <span className="text-gray-700">
                        {c.firstName} {c.lastName}
                        {c.title && (
                          <span className="text-gray-400 ml-1">
                            · {c.title}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {/* Inline new contact form */}
              {showNewContactForm ? (
                <div className="bg-gray-50 border rounded-lg p-3 mt-2">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    New contact
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="First name"
                      value={newContactForm.firstName}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          firstName: e.target.value,
                        })
                      }
                      className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      value={newContactForm.lastName}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          lastName: e.target.value,
                        })
                      }
                      className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Title (optional)"
                      value={newContactForm.title}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          title: e.target.value,
                        })
                      }
                      className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newContactForm.email}
                      onChange={(e) =>
                        setNewContactForm({
                          ...newContactForm,
                          email: e.target.value,
                        })
                      }
                      className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewContactForm(false);
                      setNewContactForm({
                        firstName: "",
                        lastName: "",
                        title: "",
                        email: "",
                      });
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewContactForm(true)}
                  className="text-xs text-green-700 hover:text-green-800 font-medium mt-1"
                >
                  + Add contact
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tpReceivedResponse}
                onChange={(e) =>
                  setTpReceivedResponse(e.target.checked)
                }
              />
              <span>Received a response</span>
            </label>
            <button
              type="submit"
              disabled={submittingTp}
              className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
            >
              {submittingTp ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {lead.touchPoint?.length === 0 ? (
        <p className="text-sm text-gray-400">
          No touchpoints logged yet.
        </p>
      ) : (
        <div className="space-y-3">
          {lead.touchPoint?.map((tp: any) =>
            editingTpId === tp.id ? (
              <div
                key={tp.id}
                className="bg-gray-50 rounded-lg p-4 text-sm border"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block font-semibold mb-1">
                      Type
                    </label>
                    <select
                      value={editTpForm.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setEditTpForm((f: any) => {
                          const isVisitPos = [
                            "VISIT_A",
                            "VISIT_B",
                            "VISIT_C",
                          ].includes(f.sequencePosition);
                          const isOutreachPos =
                            f.sequencePosition && !isVisitPos;
                          const shouldReset =
                            (IN_PERSON_TYPES.includes(newType) &&
                              isOutreachPos) ||
                            (!IN_PERSON_TYPES.includes(newType) &&
                              isVisitPos);
                          return {
                            ...f,
                            type: newType,
                            sequencePosition: shouldReset
                              ? ""
                              : f.sequencePosition,
                          };
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
                    >
                      {TOUCHPOINT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Date
                    </label>
                    <DatePicker
                      selected={editTpForm.date}
                      onChange={(date: Date | null) =>
                        date &&
                        setEditTpForm((f: any) => ({ ...f, date }))
                      }
                      dateFormat="MM/dd/yyyy"
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
                {editTpForm.type !== "VISIT_ATTEMPT" && (
                  <div className="mb-3">
                    <label className="block font-semibold mb-1">
                      Follow-up Stage
                    </label>
                    <select
                      value={editTpForm.sequencePosition ?? ""}
                      onChange={(e) =>
                        setEditTpForm((f: any) => ({
                          ...f,
                          sequencePosition: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none text-sm"
                    >
                      {getSequencePositions(editTpForm.type ?? "").map(
                        (p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}
                <div className="mb-3">
                  <label className="block font-semibold mb-1">
                    Summary
                  </label>
                  <textarea
                    value={editTpForm.summary}
                    onChange={(e) =>
                      setEditTpForm((f: any) => ({
                        ...f,
                        summary: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none resize-none"
                  />
                </div>

                {/* Contact section — edit form */}
                {editTpForm.type !== "VISIT_ATTEMPT" && (
                  <div className="mb-3">
                    <label className="block font-semibold mb-2">
                      Who did you interact with?
                    </label>
                    {lead.contacts?.length > 0 && (
                      <div className="flex flex-col gap-1 mb-2">
                        {lead.contacts.map((c: any) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={(
                                editTpForm.contactIds ?? []
                              ).includes(c.id)}
                              onChange={(e) =>
                                setEditTpForm((f: any) => ({
                                  ...f,
                                  contactIds: e.target.checked
                                    ? [...(f.contactIds ?? []), c.id]
                                    : (f.contactIds ?? []).filter(
                                        (x: string) => x !== c.id,
                                      ),
                                }))
                              }
                            />
                            <span className="text-gray-700">
                              {c.firstName} {c.lastName}
                              {c.title && (
                                <span className="text-gray-400 ml-1">
                                  · {c.title}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {editTpForm.showNewContact ? (
                      <div className="bg-gray-50 border rounded-lg p-3 mt-2">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          New contact
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="First name"
                            value={
                              editTpForm.newContact?.firstName ?? ""
                            }
                            onChange={(e) =>
                              setEditTpForm((f: any) => ({
                                ...f,
                                newContact: {
                                  ...f.newContact,
                                  firstName: e.target.value,
                                },
                              }))
                            }
                            className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Last name"
                            value={
                              editTpForm.newContact?.lastName ?? ""
                            }
                            onChange={(e) =>
                              setEditTpForm((f: any) => ({
                                ...f,
                                newContact: {
                                  ...f.newContact,
                                  lastName: e.target.value,
                                },
                              }))
                            }
                            className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Title (optional)"
                            value={editTpForm.newContact?.title ?? ""}
                            onChange={(e) =>
                              setEditTpForm((f: any) => ({
                                ...f,
                                newContact: {
                                  ...f.newContact,
                                  title: e.target.value,
                                },
                              }))
                            }
                            className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                          />
                          <input
                            type="email"
                            placeholder="Email (optional)"
                            value={editTpForm.newContact?.email ?? ""}
                            onChange={(e) =>
                              setEditTpForm((f: any) => ({
                                ...f,
                                newContact: {
                                  ...f.newContact,
                                  email: e.target.value,
                                },
                              }))
                            }
                            className="px-2 py-1.5 border rounded text-sm focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEditTpForm((f: any) => ({
                              ...f,
                              showNewContact: false,
                              newContact: {
                                firstName: "",
                                lastName: "",
                                title: "",
                                email: "",
                              },
                            }))
                          }
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setEditTpForm((f: any) => ({
                            ...f,
                            showNewContact: true,
                          }))
                        }
                        className="text-xs text-green-700 hover:text-green-800 font-medium mt-1"
                      >
                        + Add contact
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {/* Tracked results (outcome, or a message's response) set this themselves */}
                  {tp.outcome || tp.response ? (
                    <span />
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTpForm.receivedResponse}
                        onChange={(e) =>
                          setEditTpForm((f: any) => ({
                            ...f,
                            receivedResponse: e.target.checked,
                          }))
                        }
                      />
                      <span>Received a response</span>
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTpId(null)}
                      className="text-sm text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTouchpointEditSave}
                      disabled={savingTp}
                      className="text-sm bg-green-primary text-white rounded-lg px-3 py-1"
                    >
                      {savingTp ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            ) : tp.type === "VISIT_ATTEMPT" ? (
              // Attempt entry — muted, dashed border, no sequence badge
              <div
                key={tp.id}
                className="border-l-2 border-dashed border-gray-300 pl-3 text-sm opacity-70"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-500">
                        🚪 Visit attempt — no contact
                      </span>
                      <span className="text-gray-400">
                        {new Date(tp.date).toLocaleDateString()}
                      </span>
                    </div>
                    {tp.summary && (
                      <p className="text-gray-500 mt-0.5">
                        {tp.summary}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-0.5">
                      By {tp.contactedBy?.firstName}{" "}
                      {tp.contactedBy?.lastName}
                      {tp.contacts?.length > 0 && (
                        <span className="ml-1">
                          · with{" "}
                          {tp.contacts
                            .map(
                              (c: any) =>
                                `${c.firstName} ${c.lastName}`,
                            )
                            .join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {deletingTpId === tp.id ? (
                      <>
                        <span className="text-xs text-gray-500">
                          Delete?
                        </span>
                        <button
                          onClick={() => handleTouchpointDelete(tp.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingTpId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditTp(tp)}
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingTpId(tp.id)}
                          className="text-xs text-gray-300 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={tp.id}
                className="border-l-2 border-green-primary pl-3 text-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {TOUCHPOINT_TYPES.find(
                          (t) => t.value === tp.type,
                        )?.label ?? tp.type}
                      </span>
                      {tp.sequencePosition && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEQUENCE_POSITION_COLOR[tp.sequencePosition] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {SEQUENCE_POSITION_LABEL[
                            tp.sequencePosition
                          ] ?? tp.sequencePosition}
                        </span>
                      )}
                      <TouchpointResultBadges tp={tp} />
                      <span className="text-gray-400">
                        {new Date(tp.date).toLocaleDateString()}
                      </span>
                    </div>
                    {tp.summary && (
                      <p className="text-gray-600 mt-0.5">
                        {tp.summary}
                      </p>
                    )}
                    <TouchpointResultDetails tp={tp} />
                    <p className="text-gray-400 text-xs mt-0.5">
                      By {tp.contactedBy?.firstName}{" "}
                      {tp.contactedBy?.lastName}
                      {tp.contacts?.length > 0 && (
                        <span className="ml-1">
                          · with{" "}
                          {tp.contacts
                            .map(
                              (c: any) =>
                                `${c.firstName} ${c.lastName}`,
                            )
                            .join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {deletingTpId === tp.id ? (
                      <>
                        <span className="text-xs text-gray-500">
                          Delete?
                        </span>
                        <button
                          onClick={() => handleTouchpointDelete(tp.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingTpId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {canRecordReply(tp) && (
                          <button
                            onClick={() => setReplyTouchpointId(tp.id)}
                            className="text-xs font-medium px-2 py-0.5 rounded-full border bg-white text-gray-500 border-gray-200 hover:text-gray-700 transition"
                          >
                            Record a reply
                          </button>
                        )}
                        <button
                          onClick={() => startEditTp(tp)}
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingTpId(tp.id)}
                          className="text-xs text-gray-300 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </SectionCard>
  );
};
