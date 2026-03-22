import { useEffect, useState } from "react";
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
  { value: "NEW", label: "New", color: "bg-gray-100 text-gray-600", header: "bg-gray-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-blue-100 text-blue-700", header: "bg-blue-200" },
  { value: "ENGAGED", label: "Engaged", color: "bg-yellow-100 text-yellow-700", header: "bg-yellow-200" },
  { value: "MEETING_SCHEDULED", label: "Meeting Scheduled", color: "bg-purple-100 text-purple-700", header: "bg-purple-200" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent", color: "bg-orange-100 text-orange-700", header: "bg-orange-200" },
  { value: "CONVERTED", label: "Converted", color: "bg-green-100 text-green-700", header: "bg-green-200" },
];

const PipelinePage = () => {
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("token") ?? "");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const [leadsByStage, setLeadsByStage] = useState<Record<string, any[]>>(
    Object.fromEntries(STAGES.map((s) => [s.value, []]))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/leads", { headers: authHeaders })
      .then((res) => {
        const grouped: Record<string, any[]> = Object.fromEntries(
          STAGES.map((s) => [s.value, []])
        );
        for (const lead of res.data) {
          const stage = lead.pipelineStage ?? "NEW";
          if (grouped[stage]) {
            grouped[stage].push(lead);
          }
        }
        setLeadsByStage(grouped);
      })
      .finally(() => setLoading(false));
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    const sourceCopy = [...leadsByStage[sourceStage]];
    const destCopy =
      sourceStage === destStage
        ? sourceCopy
        : [...leadsByStage[destStage]];

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
      .patch(
        `http://localhost:3000/api/leads/${draggableId}`,
        patch,
        { headers: authHeaders }
      )
      .catch(() => {
        // Revert on failure
        const revert: Record<string, any[]> = { ...updated };
        const [item] = destCopy.splice(destination.index, 1);
        sourceCopy.splice(source.index, 0, item);
        revert[sourceStage] = sourceCopy;
        revert[destStage] = destCopy;
        setLeadsByStage(revert);
        alert("Failed to update stage");
      });
  };

  if (loading) {
    return (
      <InternalLayout>
        <div className="p-8 text-gray-400">Loading...</div>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout>
      <div className="p-8 h-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pipeline</h1>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
            {STAGES.map((stage) => {
              const leads = leadsByStage[stage.value] ?? [];
              return (
                <div
                  key={stage.value}
                  className="flex-shrink-0 w-64 flex flex-col rounded-xl bg-gray-50 border"
                >
                  {/* Column header */}
                  <div className={`px-4 py-3 rounded-t-xl ${stage.header} flex items-center justify-between`}>
                    <span className="text-sm font-semibold text-gray-700">
                      {stage.label}
                    </span>
                    <span className="text-xs font-medium bg-white/60 px-2 py-0.5 rounded-full text-gray-600">
                      {leads.length}
                    </span>
                  </div>

                  {/* Cards */}
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
                          <Draggable
                            key={lead.id}
                            draggableId={lead.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => navigate(`/leads/${lead.id}`)}
                                className={`bg-white border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow text-sm ${
                                  snapshot.isDragging
                                    ? "shadow-lg rotate-1"
                                    : ""
                                }`}
                              >
                                <p className="font-semibold text-gray-800 mb-1 leading-tight">
                                  {lead.business}
                                </p>
                                {lead.industry?.name && (
                                  <p className="text-xs text-gray-400 mb-2">
                                    {lead.industry.name}
                                  </p>
                                )}
                                <div className="flex items-center justify-between">
                                  {lead.source && (
                                    <span className="text-xs text-gray-400 capitalize">
                                      {lead.source.toLowerCase()}
                                    </span>
                                  )}
                                  {lead.touchPoint?.length > 0 && (
                                    <span className="text-xs text-gray-400">
                                      {new Date(
                                        lead.touchPoint[0].date
                                      ).toLocaleDateString("en-US", {
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
                          <p className="text-xs text-gray-300 text-center pt-4">
                            No leads
                          </p>
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
