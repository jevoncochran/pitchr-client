import { ORIGIN_GROUPS } from "../../constants/origins";

/**
 * "How this lead started": the origins grouped into We reached out / They came to us,
 * plus a description box for Other. Empty means not known yet.
 */
export const OriginSelect = ({
  id,
  origin,
  originOther,
  onChange,
  emptyLabel = "Not known yet",
  className = "",
}: {
  id?: string;
  origin: string;
  originOther: string;
  onChange: (value: { origin: string; originOther: string }) => void;
  /** What the empty option says, e.g. "Fill in from what I log" */
  emptyLabel?: string;
  className?: string;
}) => (
  <>
    <select
      id={id}
      value={origin}
      onChange={(e) =>
        onChange({ origin: e.target.value, originOther: e.target.value === "OTHER" ? originOther : "" })
      }
      className={className}
    >
      <option value="">{emptyLabel}</option>
      {ORIGIN_GROUPS.map((group) => (
        <optgroup key={group.value} label={group.label}>
          {group.origins.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
    {origin === "OTHER" && (
      <input
        type="text"
        value={originOther}
        onChange={(e) => onChange({ origin, originOther: e.target.value })}
        placeholder="How did it start?"
        className={`mt-2 ${className}`}
      />
    )}
  </>
);
