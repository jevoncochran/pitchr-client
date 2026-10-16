import { useRef, useState } from "react";
import type { ReactNode } from "react";

export type SheetSnap = "peek" | "half" | "full";

const ORDER: SheetSnap[] = ["peek", "half", "full"];

// The phone's bottom tab bar covers the bottom of the screen; the sheet sits above it
const TAB_BAR_PX = 72;

/** Sheet height in pixels for each snap point, for this window */
const heightFor = (snap: SheetSnap) => {
  const usable = window.innerHeight - TAB_BAR_PX;
  if (snap === "peek") return 132;
  if (snap === "half") return Math.round(usable * 0.5);
  return usable - 56; // leave a strip of map showing at the top
};

/**
 * A sheet over the map on phones: drag its handle up or down (or tap it) to
 * move between peek, half and full. It changes height rather than sliding,
 * so drag-to-reorder inside it keeps working.
 */
export const BottomSheet = ({
  header,
  children,
  snap,
  onSnapChange,
}: {
  /** Always visible: the summary and main button */
  header: ReactNode;
  children: ReactNode;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
}) => {
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    // Buttons and links in the header (e.g. Optimize route) stay tappable
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select") && !target.closest("[data-sheet-handle]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startHeight: heightFor(snap), moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dy) > 6) drag.current.moved = true;
    if (!drag.current.moved) return;
    const min = heightFor("peek");
    const max = heightFor("full");
    setDragHeight(Math.min(max, Math.max(min, drag.current.startHeight - dy)));
  };

  const onPointerUp = () => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    if (!current.moved) {
      // A tap moves up one step, and from full back down to peek
      onSnapChange(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length]);
      return;
    }
    const height = dragHeight ?? current.startHeight;
    const nearest = ORDER.reduce((best, s) =>
      Math.abs(heightFor(s) - height) < Math.abs(heightFor(best) - height) ? s : best,
    );
    setDragHeight(null);
    onSnapChange(nearest);
  };

  return (
    <div
      role="region"
      aria-label="Stops"
      data-snap={snap}
      className={`fixed left-0 right-0 z-40 flex flex-col rounded-t-2xl bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.15)] md:hidden ${
        dragHeight === null ? "transition-[height] duration-200" : ""
      }`}
      style={{ bottom: TAB_BAR_PX, height: dragHeight ?? heightFor(snap) }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex-shrink-0 touch-none cursor-grab px-4 pt-2 pb-3"
      >
        <button
          type="button"
          data-sheet-handle
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            onSnapChange(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length]);
          }}
          aria-label={snap === "full" ? "Collapse the list" : "Expand the list"}
          className="mx-auto mb-2 block h-1.5 w-10 rounded-full bg-gray-300"
        />
        {header}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  );
};
