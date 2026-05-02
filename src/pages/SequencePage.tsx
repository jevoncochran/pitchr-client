import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import InternalLayout from "../components/InternalLayout";

// ─── Tasks view ───────────────────────────────────────────────────────────────

const TASK_SECTIONS = [
  { type: "IN_PERSON",    label: "In Person Visit", icon: "🚶", accent: "bg-amber-100 text-amber-700 border-amber-200" },
  { type: "EMAIL",        label: "Email",            icon: "✉️",  accent: "bg-blue-100  text-blue-700  border-blue-200"  },
  { type: "INSTAGRAM_DM", label: "Instagram DM",     icon: "📸", accent: "bg-pink-100  text-pink-700  border-pink-200"  },
];

const TaskCard = ({ task, onClick }: { task: any; onClick: () => void }) => {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = due ? due < today : false;
  const isToday   = due ? due.toDateString() === new Date().toDateString() : false;

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all text-sm"
    >
      <p className="font-semibold text-gray-800 leading-tight">{task.lead?.business}</p>

      {task.note && (
        <p className="text-xs text-gray-500 mt-1">{task.note}</p>
      )}

      {due && (
        <p
          className={`text-xs mt-1.5 font-medium ${
            isOverdue ? "text-red-500" : isToday ? "text-amber-500" : "text-gray-400"
          }`}
        >
          {isOverdue ? "Overdue · " : isToday ? "Today · " : ""}
          {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      )}
    </div>
  );
};

const TasksView = () => {
  const navigate = useNavigate();
  const [tasks, setTasks]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/tasks")
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TASK_SECTIONS.map((section) => {
          const sectionTasks = tasks.filter((t) => t.type === section.type);
          return (
            <div key={section.type} className="flex flex-col rounded-xl border bg-gray-50">
              {/* Section header */}
              <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between border-b ${section.accent} border-opacity-60`}>
                <div className="flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span className="text-sm font-semibold">{section.label}</span>
                </div>
                <span className="text-xs font-medium bg-white/60 px-2 py-0.5 rounded-full">
                  {sectionTasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex flex-col gap-2 p-3 min-h-[80px]">
                {sectionTasks.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center pt-4">No tasks</p>
                ) : (
                  sectionTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => navigate(`/leads/${task.lead?.id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Step metadata ──────────────────────────────────────────────────────────

const STEP_LABEL: Record<number, string> = {
  0: "A1 pending",
  1: "A1 sent",
  2: "A2 sent",
  3: "A3 sent",
  4: "B1 sent",
  5: "B2 sent",
  6: "B3 sent",
  7: "C1 sent",
  8: "C2 sent",
};

const NEXT_ACTION: Record<number, string> = {
  0: "Confirm outreach sent",
  1: "Send A2",
  2: "Send A3",
  3: "Schedule Visit B",
  4: "Send B2",
  5: "Send B3",
  6: "Schedule Visit C",
  7: "Send C2",
  8: "Send C3",
};

// Progress dots within each 3-email cycle
// Returns [filled, total] where filled = emails completed in current cycle
const cycleProgress = (step: number): [number, number] => {
  if (step <= 2) return [step, 3];       // Post-Visit 1: emails 1–3
  if (step >= 4 && step <= 5) return [step - 3, 3]; // Post-Visit 2: emails 4–6
  if (step >= 7 && step <= 8) return [step - 6, 3]; // Post-Visit 3: emails 7–9
  return [0, 0];
};

// ─── Column definitions ───────────────────────────────────────────────────────

interface Column {
  id: string;
  label: string;
  subtitle: string;
  headerBg: string;
  accentColor: string;
  filter: (lead: any) => boolean;
  isActionRequired?: boolean;
}

const COLUMNS: Column[] = [
  {
    id: "not-started",
    label: "Not Started",
    subtitle: "No visit yet",
    headerBg: "bg-gray-100",
    accentColor: "bg-gray-400",
    filter: (l) =>
      !l.sequenceActive &&
      !["CONVERTED", "DORMANT", "NOT_A_FIT", "LOST"].includes(l.pipelineStage),
  },
  {
    id: "cycle-a",
    label: "Cycle A",
    subtitle: "Outreach A1–A3",
    headerBg: "bg-blue-100",
    accentColor: "bg-blue-500",
    filter: (l) =>
      l.sequenceActive && l.sequenceStep >= 0 && l.sequenceStep <= 2,
  },
  {
    id: "needs-visit-b",
    label: "Needs Visit B",
    subtitle: "A3 done · visit next",
    headerBg: "bg-amber-100",
    accentColor: "bg-amber-500",
    isActionRequired: true,
    filter: (l) => l.sequenceActive && l.sequenceStep === 3,
  },
  {
    id: "cycle-b",
    label: "Cycle B",
    subtitle: "Outreach B1–B3",
    headerBg: "bg-orange-100",
    accentColor: "bg-orange-500",
    filter: (l) =>
      l.sequenceActive && l.sequenceStep >= 4 && l.sequenceStep <= 5,
  },
  {
    id: "needs-visit-c",
    label: "Needs Visit C",
    subtitle: "B3 done · visit next",
    headerBg: "bg-red-100",
    accentColor: "bg-red-500",
    isActionRequired: true,
    filter: (l) => l.sequenceActive && l.sequenceStep === 6,
  },
  {
    id: "cycle-c",
    label: "Cycle C",
    subtitle: "Outreach C1–C3",
    headerBg: "bg-purple-100",
    accentColor: "bg-purple-500",
    filter: (l) => l.sequenceActive && l.sequenceStep >= 7,
  },
  {
    id: "converted",
    label: "Converted",
    subtitle: "",
    headerBg: "bg-green-100",
    accentColor: "bg-green-500",
    filter: (l) => l.pipelineStage === "CONVERTED",
  },
  {
    id: "dormant",
    label: "Dormant",
    subtitle: "Full cycle done",
    headerBg: "bg-gray-200",
    accentColor: "bg-gray-500",
    filter: (l) => l.pipelineStage === "DORMANT",
  },
  {
    id: "not-a-fit",
    label: "Not a Fit",
    subtitle: "Disqualified",
    headerBg: "bg-red-100",
    accentColor: "bg-red-500",
    filter: (l) => l.pipelineStage === "NOT_A_FIT",
  },
  {
    id: "lost",
    label: "Lost",
    subtitle: "Deal fell through",
    headerBg: "bg-rose-100",
    accentColor: "bg-rose-500",
    filter: (l) => l.pipelineStage === "LOST",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const daysSince = (dateStr: string) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));

// ─── Card ────────────────────────────────────────────────────────────────────

const LeadCard = ({
  lead,
  column,
  onClick,
}: {
  lead: any;
  column: Column;
  onClick: () => void;
}) => {
  const step = lead.sequenceStep ?? 0;
  const stepLabel = lead.sequenceActive ? STEP_LABEL[step] : null;
  const nextAction = lead.sequenceActive ? NEXT_ACTION[step] : null;
  const [filled, total] = cycleProgress(step);
  const lastTp = lead.touchPoint?.[0];
  const since = lastTp ? daysSince(lastTp.date) : null;
  const isStale = since !== null && since >= 7;

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all text-sm"
    >
      {/* Business name */}
      <p className="font-semibold text-gray-800 leading-tight mb-0.5 flex items-center gap-1">
        {lead.isHot && <span title="Hot lead">🔥</span>}
        {lead.business}
      </p>

      {/* Industry */}
      {lead.industry?.name && (
        <p className="text-xs text-gray-400 mb-2">{lead.industry.name}</p>
      )}

      {/* Cycle progress dots */}
      {total > 0 && (
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < filled ? column.accentColor : "bg-gray-200"
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">{stepLabel}</span>
        </div>
      )}

      {/* Next action */}
      {nextAction && column.id !== "converted" && column.id !== "dormant" && (
        <p className="text-xs text-gray-500 mb-2">
          <span className="text-gray-300 mr-1">→</span>
          {nextAction}
        </p>
      )}

      {/* Footer: days since + owner */}
      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-50">
        {since !== null ? (
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isStale
                ? "bg-orange-50 text-orange-500"
                : "bg-gray-50 text-gray-400"
            }`}
          >
            {since === 0 ? "Today" : `${since}d ago`}
          </span>
        ) : (
          <span className="text-xs text-gray-300">No contact</span>
        )}
        {lead.assignedTo && (
          <span className="text-xs text-gray-400">
            {lead.assignedTo.firstName} {lead.assignedTo.lastName}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

type ActiveTab = "tasks" | "sequence";

const SequencePage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>("tasks");
  const [leads, setLeads]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (activeTab !== "sequence") return;
    setLoading(true);
    api
      .get("/api/leads")
      .then((res) => setLeads(res.data))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 h-full flex flex-col">
        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {(["tasks", "sequence"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "tasks" ? "Tasks" : "Sequence"}
            </button>
          ))}
        </div>

        {/* ── Tasks view ─────────────────────────────────────────────────────── */}
        {activeTab === "tasks" && <TasksView />}

        {/* ── Sequence view ──────────────────────────────────────────────────── */}
        {activeTab === "sequence" && (
          <>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <>
                <p className="text-sm text-gray-400 -mt-2 mb-5">
                  Where each lead is in the 3-visit nurture cycle
                </p>

                {/* Kanban board */}
                <div className="flex gap-4 overflow-x-auto pb-6 flex-1 items-start">
                  {COLUMNS.map((col) => {
                    const colLeads = leads.filter(col.filter);
                    return (
                      <div
                        key={col.id}
                        className="flex-shrink-0 w-60 flex flex-col rounded-xl border bg-gray-50"
                      >
                        {/* Column header */}
                        <div
                          className={`px-4 py-3 rounded-t-xl ${col.headerBg} flex items-start justify-between gap-2`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              {col.isActionRequired && (
                                <span className="text-amber-500 text-xs">⚑</span>
                              )}
                              <span className="text-sm font-semibold text-gray-700">
                                {col.label}
                              </span>
                            </div>
                            {col.subtitle && (
                              <p className="text-xs text-gray-500 mt-0.5">{col.subtitle}</p>
                            )}
                          </div>
                          <span className="flex-shrink-0 text-xs font-medium bg-white/70 px-2 py-0.5 rounded-full text-gray-600">
                            {colLeads.length}
                          </span>
                        </div>

                        {/* Cards */}
                        <div className="flex flex-col gap-2 p-3 min-h-[100px]">
                          {colLeads.length === 0 ? (
                            <p className="text-xs text-gray-300 text-center pt-4">
                              No leads
                            </p>
                          ) : (
                            colLeads.map((lead) => (
                              <LeadCard
                                key={lead.id}
                                lead={lead}
                                column={col}
                                onClick={() => navigate(`/leads/${lead.id}`)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </InternalLayout>
  );
};

export default SequencePage;
