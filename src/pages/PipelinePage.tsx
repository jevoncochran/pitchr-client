import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import InternalLayout from "../components/InternalLayout";

const STAGES = [
  { value: "NEW",              label: "New",              color: "bg-gray-100 text-gray-600",    header: "bg-gray-200"   },
  { value: "CONTACTED",        label: "Contacted",        color: "bg-blue-100 text-blue-700",    header: "bg-blue-200"   },
  { value: "ENGAGED",          label: "Engaged",          color: "bg-yellow-100 text-yellow-700",header: "bg-yellow-200" },
  { value: "MEETING_SCHEDULED",label: "Meeting Scheduled",color: "bg-purple-100 text-purple-700",header: "bg-purple-200" },
  { value: "PROPOSAL_SENT",    label: "Proposal Sent",    color: "bg-orange-100 text-orange-700",header: "bg-orange-200" },
  { value: "CONVERTED",        label: "Converted",        color: "bg-green-100 text-green-700",  header: "bg-green-200"  },
  { value: "DORMANT",          label: "Dormant",          color: "bg-gray-200 text-gray-500",    header: "bg-gray-300"   },
  { value: "NOT_A_FIT",        label: "Not a Fit",        color: "bg-red-100 text-red-600",      header: "bg-red-200"    },
  { value: "LOST",             label: "Lost",             color: "bg-rose-100 text-rose-700",    header: "bg-rose-200"   },
];

const DEFAULT_HIDDEN = new Set(["DORMANT", "NOT_A_FIT", "LOST"]);

const PipelinePage = () => {
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("token") ?? "");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [leadsByStage, setLeadsByStage] = useState<Record<string, any[]>>(
    Object.fromEntries(STAGES.map((s) => [s.value, []]))
  );
  const [loading, setLoading] = useState(true);
  const [visibleStages, setVisibleStages] = useState<Set<string>>(
    new Set(STAGES.map((s) => s.value).filter((v) => !DEFAULT_HIDDEN.has(v)))
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/leads", { headers: authHeaders })
      .then((res) => {
        const grouped: Record<string, any[]> = Object.fromEntries(
          STAGES.map((s) => [s.value, []])
        );
        for (const lead of res.data) {
          const stage = lead.pipelineStage ?? "NEW";
          if (grouped[stage]) grouped[stage].push(lead);
        }
        setLeadsByStage(grouped);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleStage = (value: string) => {
    setVisibleStages((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;
    const sourceCopy = [...leadsByStage[sourceStage]];
    const destCopy = sourceStage === destStage ? sourceCopy : [...leadsByStage[destStage]];

    const [moved] = sourceCopy.splice(source.index, 1);
    destCopy.splice(destination.index, 0, { ...moved, pipelineStage: destStage });

    const updated: Record<string, any[]> = { ...leadsByStage };
    updated[sourceStage] = sourceCopy;
    updated[destStage] = destCopy;
    setLeadsByStage(updated);

    const patch: any = { pipelineStage: destStage };
    if (destStage === "CONVERTED" && !moved.convertedAt) {
      patch.convertedAt = new Date().toISOString();
    }

    axios
      .patch(`http://localhost:3000/api/leads/${draggableId}`, patch, { headers: authHeaders })
      .catch(() => {
        const revert: Record<string, any[]> = { ...updated };
        const [item] = destCopy.splice(destination.index, 1);
        sourceCopy.splice(source.index, 0, item);
        revert[sourceStage] = sourceCopy;
        revert[destStage] = destCopy;
        setLeadsByStage(revert);
        alert("Failed to update stage");
      });
  };

  const hiddenCount = STAGES.length - visibleStages.size;

  if (loading) {
    return (
      <InternalLayout>
        <div className="p-8 text-gray-400">Loading...</div>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pipeline</h1>

          {/* Stage visibility dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 text-sm border rounded-lg px-3 h-[38px] bg-white text-gray-600 hover:bg-gray-50 focus:outline-none"
            >
              <span>Stages</span>
              {hiddenCount > 0 && (
                <span className="bg-charcoal text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {hiddenCount} hidden
                </span>
              )}
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-[42px] z-20 bg-white border rounded-xl shadow-lg p-3 w-52">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Show / Hide Columns</p>
                {STAGES.map((stage) => (
                  <label
                    key={stage.value}
                    className="flex items-center gap-2.5 px-1 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleStages.has(stage.value)}
                      onChange={() => toggleStage(stage.value)}
                      className="rounded"
                    />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.color}`}>
                      {stage.label}
                    </span>
                  </label>
                ))}
                <div className="border-t mt-2 pt-2 flex gap-2">
                  <button
                    onClick={() => setVisibleStages(new Set(STAGES.map((s) => s.value)))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Show all
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={() => setVisibleStages(new Set(STAGES.map((s) => s.value).filter((v) => !DEFAULT_HIDDEN.has(v))))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kanban */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
            {STAGES.filter((s) => visibleStages.has(s.value)).map((stage) => {
              const leads = leadsByStage[stage.value] ?? [];
              return (
                <div
                  key={stage.value}
                  className="flex-shrink-0 w-64 flex flex-col rounded-xl bg-gray-50 border"
                >
                  <div className={`px-4 py-3 rounded-t-xl ${stage.header} flex items-center justify-between`}>
                    <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
                    <span className="text-xs font-medium bg-white/60 px-2 py-0.5 rounded-full text-gray-600">
                      {leads.length}
                    </span>
                  </div>

                  <Droppable droppableId={stage.value}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-2 p-3 min-h-[120px] transition-colors rounded-b-xl ${
                          snapshot.isDraggingOver ? "bg-blue-50" : ""
                        }`}
                      >
                        {leads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => navigate(`/leads/${lead.id}`)}
                                className={`bg-white border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow text-sm ${
                                  snapshot.isDragging ? "shadow-lg rotate-1" : ""
                                }`}
                              >
                                <p className="font-semibold text-gray-800 mb-1 leading-tight flex items-center gap-1">
                                  {lead.isHot && <span title="Hot lead">🔥</span>}
                                  {lead.business}
                                </p>
                                {lead.industry?.name && (
                                  <p className="text-xs text-gray-400 mb-2">{lead.industry.name}</p>
                                )}
                                <div className="flex items-center justify-between">
                                  {lead.source && (
                                    <span className="text-xs text-gray-400 capitalize">
                                      {lead.source.toLowerCase()}
                                    </span>
                                  )}
                                  {lead.touchPoint?.length > 0 && (
                                    <span className="text-xs text-gray-400">
                                      {new Date(lead.touchPoint[0].date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {leads.length === 0 && !snapshot.isDraggingOver && (
                          <p className="text-xs text-gray-300 text-center pt-4">No leads</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </InternalLayout>
  );
};

export default PipelinePage;
