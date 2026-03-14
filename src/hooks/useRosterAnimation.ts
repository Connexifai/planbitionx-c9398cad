import { useState, useCallback, useRef } from "react";
import type { AlternativeChange } from "@/lib/buildAlternativesPayload";

/**
 * Pairs removed/added changes into animation moves.
 * A "move" is a shift being taken from one employee and given to another.
 */
export interface AnimationMove {
  source: {
    employeeId: string;
    employeeName: string;
    dayDate: string;
    shiftName: string;
  };
  target: {
    employeeId: string;
    employeeName: string;
    dayDate: string;
    shiftName: string;
  };
  moveIndex: number;
  totalMoves: number;
}

export interface FlyingCell {
  /** Clone of the source cell's inner HTML */
  html: string;
  /** Source rect (viewport coords) */
  fromRect: DOMRect;
  /** Target rect (viewport coords) */
  toRect: DOMRect;
  /** Width/height of the source cell */
  width: number;
  height: number;
  move: AnimationMove;
}

export interface RosterAnimationState {
  active: boolean;
  /** Current move being animated */
  currentMove: AnimationMove | null;
  /** Phase within a move */
  phase: "scrolling-source" | "pickup" | "flying" | "landing" | "done" | null;
  /** The flying cell data for the overlay */
  flyingCell: FlyingCell | null;
  /** All moves */
  moves: AnimationMove[];
  /** Completed count */
  completedCount: number;
  /** Fully done */
  done: boolean;
}

const INITIAL_STATE: RosterAnimationState = {
  active: false,
  currentMove: null,
  phase: null,
  flyingCell: null,
  moves: [],
  completedCount: 0,
  done: false,
};

/**
 * Pair changes: match removed+added by ShiftId or by sequence.
 * For direct replacements (only added), we create a move with source = target.
 */
function pairChanges(changes: AlternativeChange[]): Array<{ removed?: AlternativeChange; added?: AlternativeChange }> {
  const removed = changes.filter((c) => c.Action === "removed");
  const added = changes.filter((c) => c.Action === "added");

  const pairs: Array<{ removed?: AlternativeChange; added?: AlternativeChange }> = [];
  const usedAdded = new Set<number>();

  for (const rem of removed) {
    // Find matching added with same ShiftId
    const matchIdx = added.findIndex(
      (a, idx) => !usedAdded.has(idx) && a.ShiftId === rem.ShiftId
    );
    if (matchIdx >= 0) {
      usedAdded.add(matchIdx);
      pairs.push({ removed: rem, added: added[matchIdx] });
    } else {
      pairs.push({ removed: rem });
    }
  }

  // Remaining added without a matching removed
  added.forEach((a, idx) => {
    if (!usedAdded.has(idx)) {
      pairs.push({ added: a });
    }
  });

  return pairs;
}

export function useRosterAnimation() {
  const [state, setState] = useState<RosterAnimationState>(INITIAL_STATE);
  const abortRef = useRef(false);
  const scrollFnRef = useRef<((empId: string) => Promise<void>) | null>(null);
  const getCellRectFnRef = useRef<((empId: string, dayDate: string) => DOMRect | null) | null>(null);
  const getCellHtmlFnRef = useRef<((empId: string, dayDate: string) => string) | null>(null);

  /** Register functions from RosterGrid to locate/scroll cells */
  const registerGridFns = useCallback(
    (fns: {
      scrollToEmployee: (empId: string) => Promise<void>;
      getCellRect: (empId: string, dayDate: string) => DOMRect | null;
      getCellHtml: (empId: string, dayDate: string) => string;
    }) => {
      scrollFnRef.current = fns.scrollToEmployee;
      getCellRectFnRef.current = fns.getCellRect;
      getCellHtmlFnRef.current = fns.getCellHtml;
    },
    []
  );

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const startAnimation = useCallback(
    async (changes: AlternativeChange[], onBeforeApply: () => void, onComplete: () => void) => {
      abortRef.current = false;

      const pairs = pairChanges(changes);
      // Build moves: only pairs with both removed and added are "fly" animations
      const moves: AnimationMove[] = [];
      let idx = 0;

      for (const pair of pairs) {
        if (pair.removed && pair.added) {
          moves.push({
            source: {
              employeeId: String(pair.removed.EmployeeId),
              employeeName: pair.removed.EmployeeName,
              dayDate: pair.removed.Start?.split("T")[0] || "",
              shiftName: pair.removed.ShiftName,
            },
            target: {
              employeeId: String(pair.added.EmployeeId),
              employeeName: pair.added.EmployeeName,
              dayDate: pair.added.Start?.split("T")[0] || "",
              shiftName: pair.added.ShiftName,
            },
            moveIndex: idx++,
            totalMoves: 0, // filled below
          });
        } else if (pair.added) {
          // Direct addition — animate as landing at target
          moves.push({
            source: {
              employeeId: String(pair.added.EmployeeId),
              employeeName: pair.added.EmployeeName,
              dayDate: pair.added.Start?.split("T")[0] || "",
              shiftName: pair.added.ShiftName,
            },
            target: {
              employeeId: String(pair.added.EmployeeId),
              employeeName: pair.added.EmployeeName,
              dayDate: pair.added.Start?.split("T")[0] || "",
              shiftName: pair.added.ShiftName,
            },
            moveIndex: idx++,
            totalMoves: 0,
          });
        }
      }

      moves.forEach((m) => (m.totalMoves = moves.length));

      if (moves.length === 0) {
        onBeforeApply();
        onComplete();
        return;
      }

      setState({
        active: true,
        currentMove: null,
        phase: null,
        flyingCell: null,
        moves,
        completedCount: 0,
        done: false,
      });

      for (let i = 0; i < moves.length; i++) {
        if (abortRef.current) break;
        const move = moves[i];

        // Phase 1: Scroll to source
        setState((s) => ({ ...s, currentMove: move, phase: "scrolling-source", flyingCell: null }));
        if (scrollFnRef.current) {
          await scrollFnRef.current(move.source.employeeId);
        }
        await wait(400); // Let scroll settle

        if (abortRef.current) break;

        // Phase 2: Pickup — get source rect and HTML
        setState((s) => ({ ...s, phase: "pickup" }));
        const sourceRect = getCellRectFnRef.current?.(move.source.employeeId, move.source.dayDate);
        const sourceHtml = getCellHtmlFnRef.current?.(move.source.employeeId, move.source.dayDate) || "";
        await wait(600); // Show pickup effect

        if (abortRef.current) break;

        // Phase 3: Scroll to target
        if (move.source.employeeId !== move.target.employeeId && scrollFnRef.current) {
          await scrollFnRef.current(move.target.employeeId);
          await wait(400);
        }

        if (abortRef.current) break;

        // Get target rect
        const targetRect = getCellRectFnRef.current?.(move.target.employeeId, move.target.dayDate);

        if (sourceRect && targetRect) {
          // Phase 4: Flying
          setState((s) => ({
            ...s,
            phase: "flying",
            flyingCell: {
              html: sourceHtml,
              fromRect: sourceRect,
              toRect: targetRect,
              width: sourceRect.width,
              height: sourceRect.height,
              move,
            },
          }));
          await wait(900); // Flight duration

          if (abortRef.current) break;

          // Phase 5: Landing
          setState((s) => ({ ...s, phase: "landing" }));
          await wait(400);
        } else {
          // Fallback: just flash
          await wait(500);
        }

        // If this is the last move, apply the roster data before showing "done"
        if (i === moves.length - 1) {
          onBeforeApply();
          await wait(100);
        }

        setState((s) => ({
          ...s,
          completedCount: i + 1,
          flyingCell: null,
        }));
      }

      // Apply roster data if not already applied (e.g., single move)
      if (moves.length === 1) {
        // Already applied above
      }

      // Done state
      setState((s) => ({ ...s, currentMove: null, phase: "done", done: true }));
      onComplete();

      await wait(3000);
      setState(INITIAL_STATE);
    },
    []
  );

  const cancelAnimation = useCallback(() => {
    abortRef.current = true;
    setState(INITIAL_STATE);
  }, []);

  return { animationState: state, startAnimation, cancelAnimation, registerGridFns, scrollToEmployee: scrollFnRef };
}
