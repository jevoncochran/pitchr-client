import { TP_LABELS } from "./dashboardConstants";
import { SectionCard } from "../ui/SectionCard";
import { SectionHeader } from "../ui/SectionHeader";

export const RecentActivity = ({
  touchpoints,
  visibleCount,
  onShowMore,
}: {
  touchpoints: any[];
  visibleCount: number;
  onShowMore: () => void;
}) => (
  <SectionCard className="rounded-xl p-5 self-start">
    <SectionHeader title="Recent Activity" className="mb-4" />
    {touchpoints.length === 0 ? (
      <p className="text-sm text-gray-400">No activity logged yet.</p>
    ) : (
      <>
        <div>
          {touchpoints.slice(0, visibleCount).map((tp, index, arr) => (
            <div key={tp.id} className="flex gap-3">
              {/* Timeline spine */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-primary mt-1 flex-shrink-0" />
                {index < arr.length - 1 && (
                  <div className="w-px bg-green-primary flex-1 mt-1" />
                )}
              </div>
              {/* Content */}
              <div
                className={`flex items-start justify-between text-sm w-full ${index < arr.length - 1 ? "pb-3" : ""}`}
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {tp.lead?.business ??
                      (tp.contact
                        ? `${tp.contact.firstName}${tp.contact.lastName ? ` ${tp.contact.lastName}` : ""}`
                        : "Unknown")}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {TP_LABELS[tp.type] ?? tp.type} ·{" "}
                    {tp.contactedBy?.firstName} {tp.contactedBy?.lastName}
                    {tp.summary && ` · "${tp.summary}"`}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {new Date(tp.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        {visibleCount < touchpoints.length && (
          <div className="pt-4 mt-2 border-t text-center">
            <button
              onClick={onShowMore}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition"
            >
              Show more ({touchpoints.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </>
    )}
  </SectionCard>
);
