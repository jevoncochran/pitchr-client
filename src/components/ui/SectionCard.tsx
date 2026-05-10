import { ReactNode, HTMLAttributes } from "react";

/**
 * Standard card wrapper used on the Dashboard and Lead Detail pages.
 * Provides the fixed visual layer (bg, border, shadow).
 * Pass rounded size, padding, margin, and any extras via `className`.
 * Any additional HTML div attributes (e.g. `id`) are forwarded to the element.
 *
 * Example:
 *   <SectionCard className="rounded-xl p-4 mb-6">...</SectionCard>
 *   <SectionCard id="touchpoints-section" className="rounded-xl p-4 mb-6">...</SectionCard>
 */
export const SectionCard = ({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-white border border-gray-100 shadow-[0_4px_16px_rgba(15,23,42,0.10)] ${className}`}
    {...rest}
  >
    {children}
  </div>
);
