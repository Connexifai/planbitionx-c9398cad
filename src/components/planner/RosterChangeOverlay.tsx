import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import type { RosterAnimationState } from "@/hooks/useRosterAnimation";

interface Props {
  state: RosterAnimationState;
}

/**
 * Full-screen overlay that renders:
 * 1. A floating shift-badge clone that flies from source → target cell
 * 2. A progress banner at the top
 */
export function RosterChangeOverlay({ state }: Props) {
  if (!state.active) return null;

  return createPortal(
    <>
      {/* Semi-transparent scrim during animation */}
      <div className="fixed inset-0 z-[90] pointer-events-none bg-background/20 transition-opacity duration-300" />

      {/* Progress banner */}
      <div className="fixed top-0 left-0 right-0 z-[95] flex items-center justify-center">
        <div className="mt-3 flex items-center gap-3 px-5 py-2.5 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl animate-fade-in">
          {state.done ? (
            <>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-primary">
                Alle {state.moves.length} wijzigingen doorgevoerd ✓
              </span>
            </>
          ) : state.currentMove ? (
            <>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-xs border border-primary/30">
                {state.currentMove.moveIndex + 1}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {state.currentMove.source.employeeName}
                  {state.currentMove.source.employeeId !== state.currentMove.target.employeeId && (
                    <span className="text-muted-foreground font-normal"> → </span>
                  )}
                  {state.currentMove.source.employeeId !== state.currentMove.target.employeeId &&
                    state.currentMove.target.employeeName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {state.currentMove.source.shiftName}
                </span>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {state.currentMove.moveIndex + 1} / {state.currentMove.totalMoves}
                </span>
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{
                      width: `${((state.completedCount + 1) / state.moves.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Flying cell */}
      {state.flyingCell && state.phase === "flying" && (
        <FlyingCellElement
          html={state.flyingCell.html}
          fromRect={state.flyingCell.fromRect}
          toRect={state.flyingCell.toRect}
          width={state.flyingCell.width}
          height={state.flyingCell.height}
        />
      )}

      {/* Pickup glow effect */}
      {state.flyingCell && state.phase === "pickup" && (
        <div
          className="fixed z-[92] pointer-events-none"
          style={{
            left: state.flyingCell.fromRect.left - 4,
            top: state.flyingCell.fromRect.top - 4,
            width: state.flyingCell.fromRect.width + 8,
            height: state.flyingCell.fromRect.height + 8,
          }}
        >
          <div className="w-full h-full rounded-lg border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)] animate-pulse" />
        </div>
      )}
    </>,
    document.body
  );
}

function FlyingCellElement({
  html,
  fromRect,
  toRect,
  width,
  height,
}: {
  html: string;
  fromRect: DOMRect;
  toRect: DOMRect;
  width: number;
  height: number;
}) {
  return (
    <div
      className="fixed z-[100] pointer-events-none roster-flying-cell"
      style={
        {
          "--from-x": `${fromRect.left}px`,
          "--from-y": `${fromRect.top}px`,
          "--to-x": `${toRect.left}px`,
          "--to-y": `${toRect.top}px`,
          "--cell-w": `${width}px`,
          "--cell-h": `${height}px`,
          width,
          height,
        } as React.CSSProperties
      }
    >
      <div
        className="w-full h-full rounded-lg shadow-2xl border-2 border-primary bg-card overflow-hidden"
        style={{ transform: "scale(1.08)" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
