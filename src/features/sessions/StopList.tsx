import { useEffect, useRef } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { FaTimes, FaGripVertical } from "react-icons/fa";
import { PIPELINE_STAGES } from "../leads/constants";
import { directionsUrl, formatDriveTime, formatMiles } from "./constants";
import type { SessionItem } from "./types";

const ITEM_STATUS = {
  PLANNED: null,
  COMPLETED: { label: "Done", className: "text-green-700 bg-green-50" },
  SKIPPED: { label: "Skipped", className: "text-gray-500 bg-gray-100" },
};

const stageLabel = (value: string) =>
  PIPELINE_STAGES.find((s) => s.value === value)?.label ?? value;

/** A session's list: numbered, drag to reorder, drive times between stops. */
export const StopList = ({
  items,
  canChangeList,
  showDirections,
  highlightedId = null,
  onReorder,
  onRemove,
  onOpenLead,
}: {
  items: SessionItem[];
  canChangeList: boolean;
  /** Visits: Navigate links, map notes and drive times */
  showDirections: boolean;
  /** Scrolled to and outlined, e.g. after tapping its pin */
  highlightedId?: string | null;
  onReorder: (from: number, to: number) => void;
  onRemove: (item: SessionItem) => void;
  onOpenLead: (leadId: string) => void;
}) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    if (highlightedId) {
      rowRefs.current.get(highlightedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedId]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="items" isDropDisabled={!canChangeList}>
        {(provided) => (
          <ol ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {items.map((item, index) => {
              const itemStatus = ITEM_STATUS[item.status];
              const address = item.lead.primaryLocation;
              const onMap = address?.latitude != null && address.longitude != null;
              return (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!canChangeList}>
                  {(drag) => (
                    <li
                      ref={(el) => {
                        drag.innerRef(el);
                        if (el) rowRefs.current.set(item.id, el);
                        else rowRefs.current.delete(item.id);
                      }}
                      {...drag.draggableProps}
                    >
                      {showDirections && item.legSeconds != null && item.legMeters != null && (
                        <p className="text-[11px] text-gray-400 pl-9 pb-1">
                          ↓ {formatDriveTime(item.legSeconds)} · {formatMiles(item.legMeters)}
                        </p>
                      )}
                      <div
                        className={`flex items-start gap-2 bg-white border rounded-lg p-3 transition ${
                          highlightedId === item.id ? "border-green-primary ring-2 ring-green-primary/20" : "border-gray-100"
                        }`}
                      >
                        {canChangeList && (
                          <span
                            {...drag.dragHandleProps}
                            aria-label="Drag to reorder"
                            className="pt-1 text-gray-300 hover:text-gray-500 cursor-grab"
                          >
                            <FaGripVertical size={12} />
                          </span>
                        )}
                        <span className="w-5 pt-0.5 text-xs font-semibold text-gray-400">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => onOpenLead(item.lead.id)}
                            className="text-sm font-medium text-gray-800 hover:underline text-left"
                          >
                            {item.lead.business}
                          </button>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[item.lead.industry?.name, stageLabel(item.lead.pipelineStage)].filter(Boolean).join(" · ")}
                          </p>
                          {showDirections &&
                            (address ? (
                              <>
                                <a
                                  href={directionsUrl(address)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                  Navigate · {address.addressLine1}, {address.city}
                                </a>
                                {!onMap && <p className="text-xs text-gray-300">Not on the map yet</p>}
                              </>
                            ) : (
                              <p className="text-xs text-gray-300 mt-1">Not on the map: add an address</p>
                            ))}
                        </div>
                        {itemStatus && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${itemStatus.className}`}>
                            {itemStatus.label}
                          </span>
                        )}
                        {canChangeList && item.status !== "COMPLETED" && (
                          <button
                            onClick={() => onRemove(item)}
                            aria-label={`Remove ${item.lead.business}`}
                            className="p-1 text-gray-300 hover:text-red-500"
                          >
                            <FaTimes size={12} />
                          </button>
                        )}
                      </div>
                    </li>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  );
};
