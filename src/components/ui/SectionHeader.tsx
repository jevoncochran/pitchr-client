import { ReactNode } from "react";

/**
 * Standard section header: title on the left, optional action (button, badge,
 * toggle, etc.) on the right. Used inside SectionCard.
 *
 * The `className` prop overrides the bottom margin (default "mb-3").
 *
 * Example:
 *   <SectionHeader
 *     title="Tasks (3)"
 *     action={<button ...>+ Schedule</button>}
 *   />
 */
export const SectionHeader = ({
  title,
  action,
  className = "mb-3",
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div className={`flex items-center justify-between ${className}`}>
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    {action}
  </div>
);
