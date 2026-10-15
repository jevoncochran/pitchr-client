import DatePicker from "react-datepicker";
import { TASK_TYPES, NEXT_ACTION_LABELS } from "./constants";
import { TOUCHPOINT_TYPES } from "./touchpoints";
import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import type { LeadDetail } from "./useLeadDetail";

/** Tasks: add, complete, answer check-ins; completed ones collapsed. */
export const LeadTasks = ({ detail }: { detail: LeadDetail }) => {
  const {
    lead,
    setCompletingTaskId,
    setShowTouchpointForm,
    setTpType,
    showTaskForm,
    setShowTaskForm,
    taskForm,
    setTaskForm,
    submittingTaskForm,
    handleTaskSubmit,
    handleTaskComplete,
    handleCheckInRespond,
  } = detail;
  return (
    <SectionCard className="rounded-xl p-4 mb-6">
      <SectionHeader
        title={`Tasks (${lead.tasks?.filter((r: any) => !r.completed).length ?? 0})`}
        action={
          <button
            onClick={() => setShowTaskForm((v) => !v)}
            className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
          >
            {showTaskForm ? "Cancel" : "+ Schedule"}
          </button>
        }
      />

      {showTaskForm && (
        <form
          onSubmit={handleTaskSubmit}
          className="bg-gray-50 rounded-lg p-4 mb-4 text-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block font-semibold mb-1">Type</label>
              <select
                value={taskForm.type}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, type: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Due Date{" "}
                <span className="text-gray-400 font-normal">
                  (optional)
                </span>
              </label>
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={taskForm.dueDate}
                  onChange={(date: Date | null) =>
                    setTaskForm((f) => ({ ...f, dueDate: date }))
                  }
                  isClearable
                  placeholderText="No due date"
                  dateFormat="MM/dd/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">
              Note{" "}
              <span className="text-gray-400 font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={taskForm.note}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="e.g. Send reel link, follow up on proposal..."
              className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingTaskForm}
              className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
            >
              {submittingTaskForm ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {lead.tasks?.filter((r: any) => !r.completed).length === 0 ? (
        <p className="text-sm text-gray-400">No tasks scheduled.</p>
      ) : (
        <div className="space-y-2">
          {lead.tasks
            ?.filter((r: any) => !r.completed)
            .map((r: any) => {
              const due = r.dueDate ? new Date(r.dueDate) : null;
              const now = new Date();
              const isOverdue = due
                ? due < now && due.toDateString() !== now.toDateString()
                : false;
              const isToday = due
                ? due.toDateString() === now.toDateString()
                : false;

              // ── Email-sent check (compact urgent alert) ──────────
              if (r.isEmailSentCheck) {
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm bg-red-50 border border-red-300"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-red-500 flex-shrink-0">
                        ⚠️
                      </span>
                      <span className="text-red-700 font-medium text-xs">
                        Did you send the follow-up email?
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setTpType("EMAIL");
                          setShowTouchpointForm(true);
                          document
                            .getElementById("touchpoints-section")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
                      >
                        Yes? Log follow up →
                      </button>
                      <button
                        onClick={() => handleTaskComplete(r.id)}
                        className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                );
              }

              if (r.isCheckIn) {
                // Check-in task — shows Yes/No buttons
                return (
                  <div
                    key={r.id}
                    className={`rounded-lg px-3 py-3 text-sm border ${
                      isOverdue
                        ? "bg-red-50 border-red-200"
                        : isToday
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800">
                          {r.note ?? "Did they respond?"}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isOverdue
                              ? "text-red-500"
                              : isToday
                                ? "text-yellow-600"
                                : "text-blue-500"
                          }`}
                        >
                          {isOverdue
                            ? `Overdue · ${due?.toLocaleDateString()}`
                            : isToday
                              ? "Today"
                              : due?.toLocaleDateString()}
                          {r.isResponseCheck &&
                            " · Follow-up on their reply"}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded">
                        Check-in
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleCheckInRespond(r.id, true)}
                        className="flex-1 text-xs bg-green-primary text-white rounded py-1.5 font-medium"
                      >
                        Yes, they responded
                      </button>
                      <button
                        onClick={() =>
                          handleCheckInRespond(r.id, false)
                        }
                        className="flex-1 text-xs bg-white border border-gray-300 text-gray-600 rounded py-1.5 font-medium hover:bg-gray-50"
                      >
                        No response
                      </button>
                    </div>
                    {/* Show what "No response" will trigger */}
                    {lead.sequenceStep != null &&
                      NEXT_ACTION_LABELS[lead.sequenceStep] && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          If no response →{" "}
                          <span className="font-medium text-gray-600">
                            {NEXT_ACTION_LABELS[lead.sequenceStep]}
                          </span>
                        </p>
                      )}
                  </div>
                );
              }

              // Regular action task
              return (
                <div
                  key={r.id}
                  className={`flex items-start justify-between rounded-lg px-3 py-2 text-sm border ${
                    isOverdue
                      ? "bg-red-50 border-red-100"
                      : isToday
                        ? "bg-yellow-50 border-yellow-100"
                        : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {TASK_TYPES.find((t) => t.value === r.type)
                          ?.label ?? r.type}
                      </span>
                      {due && (
                        <span
                          className={`text-xs font-medium ${
                            isOverdue
                              ? "text-red-600"
                              : isToday
                                ? "text-yellow-600"
                                : "text-gray-400"
                          }`}
                        >
                          {isOverdue
                            ? `Overdue · ${due?.toLocaleDateString()}`
                            : isToday
                              ? "Today"
                              : due?.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {r.note && (
                      <p className="text-gray-500 mt-0.5">{r.note}</p>
                    )}
                  </div>
                  <div className="ml-3 flex-shrink-0 flex gap-1.5">
                    <button
                      onClick={() => {
                        setCompletingTaskId(r.id);
                        setTpType(r.type);
                        setShowTouchpointForm(true);
                        document
                          .getElementById("touchpoints-section")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
                    >
                      Log Completion
                    </button>
                    <button
                      onClick={() => handleTaskComplete(r.id)}
                      className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Completed tasks (collapsed) */}
      {lead.tasks?.filter((r: any) => r.completed).length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            {lead.tasks.filter((r: any) => r.completed).length}{" "}
            completed
          </summary>
          <div className="space-y-1 mt-2">
            {lead.tasks
              .filter((r: any) => r.completed)
              .map((r: any) => (
                <div
                  key={r.id}
                  className="text-xs text-gray-400 flex items-center gap-2 pl-1"
                >
                  <span className="line-through">
                    {r.isCheckIn
                      ? "Check-in"
                      : (TOUCHPOINT_TYPES.find(
                          (t) => t.value === r.type,
                        )?.label ?? r.type)}{" "}
                    · {new Date(r.dueDate).toLocaleDateString()}
                  </span>
                  {r.note && <span>— {r.note}</span>}
                </div>
              ))}
          </div>
        </details>
      )}
    </SectionCard>
  );
};
