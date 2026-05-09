export const StatCard = ({
  label,
  value,
  helper,
  icon,
  onClick,
}: {
  label: string;
  value: number | string;
  helper?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`group bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)] flex flex-col gap-4 transition ${
      onClick
        ? "cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.18)] hover:border-gray-200"
        : ""
    }`}
  >
    <div className="flex items-start gap-4">
      {icon && (
        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100 group-hover:scale-105 transition">
          {icon}
        </div>
      )}

      <div>
        <p className="text-[10px] uppercase tracking-[0.02em] font-semibold text-gray-400">
          {label}
        </p>

        <p className="text-3xl md:text-[34px] leading-none font-bold text-gray-900 mt-2">
          {value}
        </p>
      </div>
    </div>

    {helper && (
      <p
        className={`text-xs font-medium ${helper.startsWith("↑") ? "text-green-600" : "text-gray-400"}`}
      >
        {helper}
      </p>
    )}
  </div>
);
