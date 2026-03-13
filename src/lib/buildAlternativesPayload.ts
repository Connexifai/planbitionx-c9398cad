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
  ConflictShiftFilled?: boolean;
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

/**
 * Creates a unique shift ID by combining the base ID with the start date.
 * Format: "421_2026-04-06" — clean enough for the solver to handle.
 */
function makeUniqueShiftId(baseId: string, start: string): string {
  const dateStr = start?.split("T")[0] || "";
  return dateStr ? `${baseId}_${dateStr}` : baseId;
}

/**
 * Strips the date suffix to recover the original shift ID.
 */
function toOriginalShiftId(uniqueId: string): string {
  // Match pattern: "digits_YYYY-MM-DD"
  const match = uniqueId.match(/^(.+)_\d{4}-\d{2}-\d{2}$/);
  return match ? match[1] : uniqueId;
}

export function buildAlternativesPayload(
  originalRequest: any,
  solverAssignments: SolverAssignment[],
  constraint: AlternativeConstraint,
  maxAlternatives: number = 5,
  searchScope: SearchScope = "narrow"
): any {
  const sourceShifts = Array.isArray(originalRequest?.Shifts) ? originalRequest.Shifts : [];
  const sourceEmployees = Array.isArray(originalRequest?.Employees) ? originalRequest.Employees : [];

  // Create shifts with unique IDs (baseId_date)
  const uniqueShifts = sourceShifts.map((s: any) => ({
    ...s,
    Id: makeUniqueShiftId(String(s.Id), String(s.Start || "")),
  }));

  // Build lookup: "baseShiftId|start" → uniqueShiftId
  const shiftIdMap = new Map<string, string>();
  const shiftNameMap = new Map<string, string>();
  for (const s of uniqueShifts) {
    const origId = toOriginalShiftId(s.Id);
    shiftIdMap.set(`${origId}|${s.Start}`, s.Id);
    shiftNameMap.set(s.Id, s.Name || "");
  }

  // Group solver assignments by employee, mapping to unique shift IDs
  const assignmentsByEmployee = new Map<string, Array<SolverAssignment & { uniqueShiftId: string }>>();
  for (const a of (solverAssignments || [])) {
    const empId = String(a.PersonId);
    const uniqueId = shiftIdMap.get(`${a.ShiftId}|${a.Start}`) || makeUniqueShiftId(String(a.ShiftId), String(a.Start));
    if (!assignmentsByEmployee.has(empId)) assignmentsByEmployee.set(empId, []);
    assignmentsByEmployee.get(empId)!.push({ ...a, uniqueShiftId: uniqueId });
  }

  const employees = sourceEmployees.map((emp: any) => {
    const empId = String(emp.PersonId ?? emp.Id);
    const empAssignments = assignmentsByEmployee.get(empId) || [];
    const isTarget = empId === String(constraint.employeeId);

    // For the target employee, filter out conflicting assignments
    const keptAssignments = isTarget
      ? empAssignments.filter((a) => {
          const name = shiftNameMap.get(a.uniqueShiftId) || "";
          return !assignmentMatchesConstraint(a, name, constraint);
        })
      : empAssignments;

    // AssignedShifts = list of unique shift IDs
    const assignedShifts = keptAssignments.map((a) => a.uniqueShiftId);

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
    Shifts: uniqueShifts,
    Employees: employees,
    SchedulingOptions: {
      ...(originalRequest?.SchedulingOptions || {}),
      MaxAlternatives: Math.max(1, Math.min(10, maxAlternatives)),
      SearchScope: searchScope,
    },
  };
}


/**
 * Finds the assignments that were removed from the target employee
 * (i.e. the conflicting shifts). Returns synthetic "removed" changes
 * so the UI can show "Kevin verwijderd van Dagdienst woensdag".
 */
export function getRemovedAssignments(
  solverAssignments: SolverAssignment[],
  constraint: AlternativeConstraint,
  shifts: any[]
): AlternativeChange[] {
  const empId = String(constraint.employeeId);
  const empAssignments = (solverAssignments || []).filter(
    (a) => String(a.PersonId) === empId
  );

  // Build shift name lookup
  const shiftNameByIdStart = new Map<string, string>();
  for (const s of (shifts || [])) {
    shiftNameByIdStart.set(`${s.Id}|${s.Start}`, s.Name || "");
  }

  return empAssignments
    .filter((a) => {
      const name = shiftNameByIdStart.get(`${a.ShiftId}|${a.Start}`) || "";
      return assignmentMatchesConstraint(a, name, constraint);
    })
    .map((a) => ({
      EmployeeId: empId,
      EmployeeName: constraint.employeeName,
      ShiftId: String(a.ShiftId),
      ShiftName: shiftNameByIdStart.get(`${a.ShiftId}|${a.Start}`) || "",
      Action: "removed" as const,
      Reason: `${constraint.employeeName} is vrijgespeeld van deze dienst`,
      Start: a.Start,
      End: a.End,
    }));
}

/**
 * Enriches an alternative with the synthetic "removed" changes for the
 * target employee's conflicting shifts, and strips date-suffixed IDs.
 */
export function enrichAlternative(
  alternative: Alternative,
  removedChanges: AlternativeChange[]
): Alternative {
  // Normalize IDs
  const normalized: Alternative = {
    ...alternative,
    Assignments: (alternative.Assignments || []).map((a) => ({
      ...a,
      ShiftId: toOriginalShiftId(String(a.ShiftId)),
    })),
    Changes: (alternative.Changes || []).map((c) => ({
      ...c,
      ShiftId: toOriginalShiftId(String(c.ShiftId)),
    })),
  };

  // Prepend the synthetic removals so the target employee's change is shown first
  normalized.Changes = [...removedChanges, ...normalized.Changes];
  normalized.ChangesFromBaseline = normalized.Changes.length;

  return normalized;
}

/**
 * @deprecated Use enrichAlternative instead
 */
export function normalizeAlternativeShiftIds(alternative: Alternative): Alternative {
  return enrichAlternative(alternative, []);
}
