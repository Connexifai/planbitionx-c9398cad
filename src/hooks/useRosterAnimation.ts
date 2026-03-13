import { useState, useCallback, useRef } from "react";
import type { AlternativeChange } from "@/lib/buildAlternativesPayload";

export interface AnimationStep {
  employeeId: string;
  employeeName: string;
  shiftName: string;
  action: "added" | "removed";
  dayDate: string; // YYYY-MM-DD extracted from Start
  stepIndex: number;
  totalSteps: number;
}

export interface RosterAnimationState {
  active: boolean;
  currentStep: AnimationStep | null;
  completedSteps: AnimationStep[];
  done: boolean;
}

const STEP_DURATION_MS = 1800;
const DONE_DISPLAY_MS = 2500;

export function useRosterAnimation() {
  const [state, setState] = useState<RosterAnimationState>({
    active: false,
    currentStep: null,
    completedSteps: [],
    done: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startAnimation = useCallback(
    (changes: AlternativeChange[], onComplete: () => void) => {
      if (changes.length === 0) {
        onComplete();
        return;
      }

      const steps: AnimationStep[] = changes.map((c, i) => ({
        employeeId: String(c.EmployeeId),
        employeeName: c.EmployeeName,
        shiftName: c.ShiftName,
        action: c.Action,
        dayDate: c.Start?.split("T")[0] || "",
        stepIndex: i,
        totalSteps: changes.length,
      }));

      setState({
        active: true,
        currentStep: steps[0],
        completedSteps: [],
        done: false,
      });

      let idx = 0;

      const advance = () => {
        idx++;
        if (idx < steps.length) {
          setState((prev) => ({
            ...prev,
            currentStep: steps[idx],
            completedSteps: [...prev.completedSteps, steps[idx - 1]],
          }));
          timeoutRef.current = setTimeout(advance, STEP_DURATION_MS);
        } else {
          // All steps done
          setState((prev) => ({
            ...prev,
            currentStep: null,
            completedSteps: [...prev.completedSteps, steps[idx - 1]],
            done: true,
          }));
          onComplete();
          timeoutRef.current = setTimeout(() => {
            setState({ active: false, currentStep: null, completedSteps: [], done: false });
          }, DONE_DISPLAY_MS);
        }
      };

      timeoutRef.current = setTimeout(advance, STEP_DURATION_MS);
    },
    []
  );

  const cancelAnimation = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState({ active: false, currentStep: null, completedSteps: [], done: false });
  }, []);

  return { animationState: state, startAnimation, cancelAnimation };
}
