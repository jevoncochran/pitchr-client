import { ReactNode } from "react";

/**
 * Consistent field label used in both display and edit states.
 * Renders as a <p> by default; pass `as="label"` with `htmlFor` when
 * the label needs to be semantically linked to an input.
 */
export const FieldLabel = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p
    className={`text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1 ${className}`}
  >
    {children}
  </p>
);
