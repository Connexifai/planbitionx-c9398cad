import { format, getDay, parseISO } from "date-fns";

/**
 * Builds a /solve/alternatives request payload.
 *
 * Key rules (from API docs):
 * 1. AssignedShifts = list of original shift IDs (frozen assignments)
 * 2. Remove conflicting shift from target employee's AssignedShifts
 * 3. Add Constraint to target employee
 * 4. Shifts use original IDs (no instance suffixes)
 * 5. SearchScope: "narrow" | "full" | "auto"
 */

export interface AlternativeConstraint {
  employeeId: string;
  employeeName: string;
  type: "avoid_day" | "avoid_date" | "avoid_shift_kind";
  dayOfWeek?: number; // 0=ma..6=zo
  date?: string; // YYYY-MM-DD
  shiftKind?: string; // "early","day","late","night"
  strength: "hard" | "soft";
}

interface SolverAssignment {
  Start: string;
  End: string;
  PersonId: string;
  ShiftId: string;
}

export interface AlternativeChange {
  EmployeeId: string;
  EmployeeName: string;
  ShiftId: string;
  ShiftName: string;
  Action: "added" | "removed";
  Reason?: string;
  Start?: string;
  End?: string;
}

export interface Alternative {
  Rank: number;
  ChangesFromBaseline: number;
  Summary?: string;
  Score: {
    FillRatePercentage: number;
    HardViolations: number;
  };
  Changes: AlternativeChange[];
  Assignments: SolverAssignment[];
}

export interface AlternativesResponse {
  Alternatives: Alternative[];
  Baseline: {
    TotalAssignments: number;
    FillRatePercentage: number;
  };
}

export type SearchScope = "narrow" | "full" | "auto";

// ─── Helpers ───────────────────────────────────────────────────

function classifyShiftKind(shiftName: string, shiftStart: string): "early" | "day" | "late" | "night" {
  const lower = (shiftName || "").toLowerCase();
  const hour = parseISO(shiftStart).getHours();

  if (lower.includes("nacht") || lower.includes("night") || hour >= 22 || hour < 6) return "night";
  if (lower.includes("laat") || lower.includes("late") || hour >= 14) return "late";
  if (lower.includes("vroeg") || lower.includes("early") || hour < 9) return "early";
  return "day";
}

/**
 * Determines if an assignment matches the constraint (i.e. should be removed).
 */
function assignmentMatchesConstraint(
  assignment: SolverAssignment,
  shiftName: string,
  constraint: AlternativeConstraint
): boolean {
  if (constraint.type === "avoid_date") {
    return format(parseISO(assignment.Start), "yyyy-MM-dd") === constraint.date;
  }

  if (constraint.type === "avoid_day") {
    const jsDay = getDay(parseISO(assignment.Start));
    const mondayBased = jsDay === 0 ? 6 : jsDay - 1; // 0=ma..6=zo
    return mondayBased === constraint.dayOfWeek;
  }

  if (constraint.type === "avoid_shift_kind") {
    const kind = classifyShiftKind(shiftName, assignment.Start);
    return kind === constraint.shiftKind;
  }

  return false;
}

// ─── Payload builder ───────────────────────────────────────────

export function buildAlternativesPayload(
  originalRequest: any,
  solverAssignments: SolverAssignment[],
  constraint: AlternativeConstraint,
  maxAlternatives: number = 5,
  searchScope: SearchScope = "narrow"
): any {
  const sourceShifts = Array.isArray(originalRequest?.Shifts) ? originalRequest.Shifts : [];
  const sourceEmployees = Array.isArray(originalRequest?.Employees) ? originalRequest.Employees : [];

  // Build a shift lookup by ID+Start for name resolution
  const shiftLookup = new Map<string, string>();
  for (const s of sourceShifts) {
    shiftLookup.set(`${s.Id}|${s.Start}`, s.Name || "");
  }

  // Group solver assignments by employee
  const assignmentsByEmployee = new Map<string, SolverAssignment[]>();
  for (const a of (solverAssignments || [])) {
    const empId = String(a.PersonId);
    if (!assignmentsByEmployee.has(empId)) assignmentsByEmployee.set(empId, []);
    assignmentsByEmployee.get(empId)!.push(a);
  }

  const employees = sourceEmployees.map((emp: any) => {
    const empId = String(emp.PersonId ?? emp.Id);
    const empAssignments = assignmentsByEmployee.get(empId) || [];
    const isTarget = empId === String(constraint.employeeId);

    // For the target employee, filter out conflicting assignments
    const keptAssignments = isTarget
      ? empAssignments.filter((a) => {
          const name = shiftLookup.get(`${a.ShiftId}|${a.Start}`) || "";
          return !assignmentMatchesConstraint(a, name, constraint);
        })
      : empAssignments;

    // AssignedShifts = list of original shift IDs (just the ID strings)
    const assignedShifts = keptAssignments.map((a) => String(a.ShiftId));

    // Constraints
    const existingConstraints = Array.isArray(emp.Constraints) ? [...emp.Constraints] : [];
    const constraints = [...existingConstraints];

    if (isTarget) {
      const newConstraint: any = {
        type: constraint.type,
        strength: constraint.strength,
      };
      if (constraint.type === "avoid_day" && constraint.dayOfWeek !== undefined) {
        newConstraint.dayOfWeek = constraint.dayOfWeek;
      }
      if (constraint.type === "avoid_date" && constraint.date) {
        newConstraint.date = constraint.date;
      }
      if (constraint.type === "avoid_shift_kind" && constraint.shiftKind) {
        newConstraint.shiftKind = constraint.shiftKind;
      }
      constraints.push(newConstraint);
    }

    return {
      ...emp,
      AssignedShifts: assignedShifts,
      Constraints: constraints,
    };
  });

  return {
    ...originalRequest,
    Shifts: sourceShifts, // Original shifts, no instance IDs
    Employees: employees,
    SchedulingOptions: {
      ...(originalRequest?.SchedulingOptions || {}),
      MaxAlternatives: Math.max(1, Math.min(10, maxAlternatives)),
      SearchScope: searchScope,
    },
  };
}

/**
 * Legacy normalizer — now a no-op since we no longer use instance IDs.
 */
export function normalizeAlternativeShiftIds(alternative: Alternative): Alternative {
  return alternative;
}
