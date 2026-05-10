import { SectionCard } from "../ui/SectionCard";
import { SectionHeader } from "../ui/SectionHeader";

export const OutreachStats = ({
  stats,
}: {
  stats: {
    dm: { sent: number; responded: number; rate: number };
    email: { sent: number; responded: number; rate: number };
  };
}) => (
  <SectionCard className="rounded-2xl p-4 md:p-5 mb-6">
    <SectionHeader title="Outreach Response Rates" />
    <div className="grid grid-cols-2 gap-4">
      {/* Instagram DMs */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Instagram DMs</span>
          <span className="text-sm font-bold text-gray-800">
            {stats.dm.rate}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-pink-400 h-1.5 rounded-full transition-all"
            style={{ width: `${stats.dm.rate}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {stats.dm.responded} of {stats.dm.sent} responded
        </p>
      </div>
      {/* Emails */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Emails</span>
          <span className="text-sm font-bold text-gray-800">
            {stats.email.rate}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-400 h-1.5 rounded-full transition-all"
            style={{ width: `${stats.email.rate}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {stats.email.responded} of {stats.email.sent} responded
        </p>
      </div>
    </div>
  </SectionCard>
);
