import { useEffect, useState } from "react";
import api from "../api";
import InternalLayout from "../components/InternalLayout";

type Period = "week" | "month" | "allTime";

const PERIOD_LABELS: Record<Period, string> = {
  week: "This Week",
  month: "This Month",
  allTime: "All Time",
};

const startOf = (period: Period): Date => {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(0);
};

const pct = (num: number, denom: number) =>
  denom === 0 ? "—" : `${Math.round((num / denom) * 100)}%`;

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <div className="bg-white border rounded-xl p-5">
    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
    {title}
  </h2>
);

const AnalyticsPage = () => {

  const [leads, setLeads] = useState<any[]>([]);
  const [touchpoints, setTouchpoints] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/leads"),
      api.get("/api/touchpoints", {
      }),
    ])
      .then(([leadsRes, tpRes]) => {
        setLeads(leadsRes.data);
        setTouchpoints(tpRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <InternalLayout>
        <div className="p-8 text-gray-400">Loading...</div>
      </InternalLayout>
    );
  }

  const since = startOf(period);

  // --- Funnel ---
  const totalLeads = leads.length;
  const contactedLeads = leads.filter(
    (l) => l.touchPoint && l.touchPoint.length > 0
  );
  const leadsWithMeeting = leads.filter((l) =>
    l.touchPoint?.some((tp: any) => tp.type === "MEETING")
  );
  const convertedLeads = leads.filter((l) => l.pipelineStage === "CONVERTED");

  const visitToMeetingRate = pct(leadsWithMeeting.length, contactedLeads.length);
  const meetingToConversionRate = pct(convertedLeads.length, leadsWithMeeting.length);

  // --- Volume in period ---
  const leadsInPeriod = leads.filter(
    (l) => new Date(l.createdAt) >= since
  ).length;
  const meetingsInPeriod = touchpoints.filter(
    (tp) => tp.type === "MEETING" && new Date(tp.date) >= since
  ).length;
  const conversionsInPeriod = leads.filter(
    (l) =>
      l.pipelineStage === "CONVERTED" &&
      l.convertedAt &&
      new Date(l.convertedAt) >= since
  ).length;

  // --- Avg touchpoints to convert ---
  const convertedWithTouchpoints = convertedLeads.filter(
    (l) => l.touchPoint && l.touchPoint.length > 0
  );
  const avgTouchpointsToConvert =
    convertedWithTouchpoints.length === 0
      ? "—"
      : (
          convertedWithTouchpoints.reduce(
            (sum: number, l: any) => sum + l.touchPoint.length,
            0
          ) / convertedWithTouchpoints.length
        ).toFixed(1);

  // --- Inbound vs Outbound ---
  const outbound = leads.filter((l) => l.source === "OUTREACH");
  const inbound = leads.filter(
    (l) => l.source === "REFERRAL" || l.source === "FORM"
  );
  const outboundConverted = outbound.filter(
    (l) => l.pipelineStage === "CONVERTED"
  ).length;
  const inboundConverted = inbound.filter(
    (l) => l.pipelineStage === "CONVERTED"
  ).length;

  // --- Source breakdown ---
  const bySource = ["OUTREACH", "REFERRAL", "FORM"].map((source) => {
    const group = leads.filter((l) => l.source === source);
    const converted = group.filter(
      (l) => l.pipelineStage === "CONVERTED"
    ).length;
    return { source, total: group.length, converted };
  });

  return (
    <InternalLayout>
      <div className="p-8 max-w-5xl w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <div className="flex gap-2">
            {(["week", "month", "allTime"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  period === p
                    ? "bg-charcoal text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="mb-8">
          <SectionHeader title={`Volume — ${PERIOD_LABELS[period]}`} />
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Leads Added" value={leadsInPeriod} />
            <StatCard label="Meetings Booked" value={meetingsInPeriod} />
            <StatCard label="Conversions" value={conversionsInPeriod} />
          </div>
        </div>

        {/* Funnel */}
        <div className="mb-8">
          <SectionHeader title="Outreach Funnel — All Time" />
          <div className="grid grid-cols-4 gap-4 mb-4">
            <StatCard label="Total Leads" value={totalLeads} />
            <StatCard
              label="Contacted"
              value={contactedLeads.length}
              sub={pct(contactedLeads.length, totalLeads) + " of total"}
            />
            <StatCard
              label="Meetings Booked"
              value={leadsWithMeeting.length}
              sub={visitToMeetingRate + " of contacted"}
            />
            <StatCard
              label="Converted"
              value={convertedLeads.length}
              sub={meetingToConversionRate + " of meetings"}
            />
          </div>

          {/* Funnel bar */}
          <div className="bg-white border rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">
              Conversion Rates
            </p>
            <div className="space-y-3">
              {[
                {
                  label: "Visit → Meeting",
                  rate: pct(leadsWithMeeting.length, contactedLeads.length),
                  num: leadsWithMeeting.length,
                  denom: contactedLeads.length,
                },
                {
                  label: "Meeting → Conversion",
                  rate: pct(convertedLeads.length, leadsWithMeeting.length),
                  num: convertedLeads.length,
                  denom: leadsWithMeeting.length,
                },
                {
                  label: "Overall (Lead → Conversion)",
                  rate: pct(convertedLeads.length, totalLeads),
                  num: convertedLeads.length,
                  denom: totalLeads,
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-semibold text-gray-800">
                      {row.rate}{" "}
                      <span className="text-gray-400 font-normal text-xs">
                        ({row.num}/{row.denom})
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-primary h-2 rounded-full"
                      style={{
                        width:
                          row.denom === 0
                            ? "0%"
                            : `${Math.round((row.num / row.denom) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avg touchpoints to convert + Source breakdown */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white border rounded-xl p-5">
            <SectionHeader title="Touchpoints to Convert" />
            <p className="text-4xl font-bold text-gray-800 mb-1">
              {avgTouchpointsToConvert}
            </p>
            <p className="text-xs text-gray-400">
              average across {convertedWithTouchpoints.length} converted lead
              {convertedWithTouchpoints.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <SectionHeader title="Inbound vs Outbound" />
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Outbound (Cold Outreach)</span>
                <span className="font-semibold text-gray-800">
                  {outbound.length} leads ·{" "}
                  <span className="text-green-600">
                    {outboundConverted} converted
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Inbound (Referral / Form)
                </span>
                <span className="font-semibold text-gray-800">
                  {inbound.length} leads ·{" "}
                  <span className="text-green-600">
                    {inboundConverted} converted
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Source breakdown table */}
        <div className="bg-white border rounded-xl p-5">
          <SectionHeader title="Conversion by Source" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs uppercase tracking-wide text-gray-400 font-medium pb-3">
                  Source
                </th>
                <th className="text-right text-xs uppercase tracking-wide text-gray-400 font-medium pb-3">
                  Total Leads
                </th>
                <th className="text-right text-xs uppercase tracking-wide text-gray-400 font-medium pb-3">
                  Converted
                </th>
                <th className="text-right text-xs uppercase tracking-wide text-gray-400 font-medium pb-3">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {bySource.map((row) => (
                <tr key={row.source} className="border-t border-gray-50">
                  <td className="py-3 text-gray-700 capitalize">
                    {row.source.toLowerCase()}
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {row.total}
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {row.converted}
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-800">
                    {pct(row.converted, row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InternalLayout>
  );
};

export default AnalyticsPage;
