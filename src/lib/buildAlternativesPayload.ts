import { format, getDay, parseISO } from "date-fns";

/**
 * Builds a /solve/alternatives request payload.
 *
 * Key rules (from API docs):
 * 1. AssignedShifts must include the employee's current assignments (including conflicts)
 * 2. Add constraint to target employee (solver detects conflicts itself)
 * 3. Shifts use original IDs (no instance suffixes)
 * 4. AssignedShifts use unique ShiftId|Start IDs
 * 5. SearchScope: "narrow" | "full" | "auto"
 */

export interface AlternativeConstraint {
  employeeId: string;
  employeeName: string;
  type: "avoid_day" | "avoid_date" | "avoid_shift_kind";
  dayOfWeek?: number; // 0=ma, 1=di, 2=wo, 3=do, 4=vr, 5=za, 6=zo (ISO convention)
  date?: string; // YYYY-MM-DD
  shiftKind?: string; // "early","day","late","night"
  strength: "hard" | "soft";
  // Swap fields
  swapDayOfWeek?: number; // Day offered to work instead (0=ma,...,6=zo)
  swapDate?: string; // Date offered to work instead (YYYY-MM-DD)
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

function getEmployeeIdCandidates(employee: any): string[] {
  return [employee?.PersonId, employee?.Id, employee?.ContractId]
    .filter((value) => value !== undefined && value !== null && String(value).trim().length > 0)
    .map((value) => String(value));
}

function getAssignmentEmployeeIdCandidates(assignment: SolverAssignment | Record<string, unknown>): string[] {
  const anyAssignment = assignment as Record<string, unknown>;
  return [
    anyAssignment.PersonId,
    anyAssignment.EmployeeId,
    anyAssignment.ContractId,
    anyAssignment.Id,
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim().length > 0)
    .map((value) => String(value));
}

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
    // Convert JS getDay (0=Sun,1=Mon,...,6=Sat) to solver/ISO convention (0=Mon,...,6=Sun)
    const jsDay = getDay(parseISO(assignment.Start));
    const solverDay = jsDay === 0 ? 6 : jsDay - 1;
    return solverDay === constraint.dayOfWeek;
  }

  if (constraint.type === "avoid_shift_kind") {
    const kind = classifyShiftKind(shiftName, assignment.Start);
    return kind === constraint.shiftKind;
  }

  return false;
}

// ─── Payload builder ───────────────────────────────────────────

/**
 * Creates a composite shift ID: "ShiftId|Start" (e.g. "22264|2026-03-30T22:00:00").
 * This is the format expected by the solver alternatives endpoint (v6.89+).
 */
function makeUniqueShiftId(baseId: string, start: string): string {
  return start ? `${baseId}|${start}` : baseId;
}

/**
 * Strips the pipe+timestamp suffix to recover the original shift ID.
 */
function toOriginalShiftId(uniqueId: string): string {
  const pipeIdx = uniqueId.indexOf("|");
  return pipeIdx > 0 ? uniqueId.substring(0, pipeIdx) : uniqueId;
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

  // Shifts keep their ORIGINAL IDs — the API handles uniqueness internally.
  // Only AssignedShifts use the composite "ShiftId|Start" format.

  // Group solver assignments by every known employee-id variant
  // so we never drop a conflict shift by id mismatch.
  const assignmentsByEmployee = new Map<string, Array<SolverAssignment & { compositeId: string }>>();
  for (const assignment of (solverAssignments || [])) {
    const anyAssignment = assignment as SolverAssignment & Record<string, unknown>;
    const start = String(anyAssignment.Start ?? anyAssignment.StartTime ?? "");
    const compositeId = makeUniqueShiftId(String(anyAssignment.ShiftId), start);

    for (const employeeId of getAssignmentEmployeeIdCandidates(anyAssignment)) {
      if (!assignmentsByEmployee.has(employeeId)) {
        assignmentsByEmployee.set(employeeId, []);
      }
      assignmentsByEmployee.get(employeeId)!.push({ ...assignment, compositeId });
    }
  }

  const targetEmployeeId = String(constraint.employeeId);

  const employees = sourceEmployees.map((emp: any) => {
    const employeeIds = getEmployeeIdCandidates(emp);
    const isTarget = employeeIds.includes(targetEmployeeId);

    const solverAssigned = employeeIds
      .flatMap((id) => assignmentsByEmployee.get(id) || [])
      .map((a) => a.compositeId)
      .filter(Boolean);

    // Preserve any pre-existing AssignedShifts from the request and merge with
    // current solver assignments, without removing the conflict shift.
    const existingAssigned = Array.isArray(emp.AssignedShifts)
      ? emp.AssignedShifts.map((id: unknown) => String(id)).filter(Boolean)
      : [];

    const assignedShifts = Array.from(new Set([...existingAssigned, ...solverAssigned]));

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

  // Top-level constraint fields for v6.89w+ API
  const topLevelConstraint: Record<string, unknown> = {
    TargetEmployeeId: targetEmployeeId,
    ConstraintType: constraint.type,
  };
  if (constraint.type === "avoid_day" && constraint.dayOfWeek !== undefined) {
    topLevelConstraint.DayOfWeek = constraint.dayOfWeek;
  }
  if (constraint.type === "avoid_date" && constraint.date) {
    topLevelConstraint.Date = constraint.date;
  }
  if (constraint.type === "avoid_shift_kind" && constraint.shiftKind) {
    topLevelConstraint.ShiftKind = constraint.shiftKind;
  }
  // Swap fields for Phase 3 (dienstwissel)
  if (constraint.swapDate) {
    topLevelConstraint.SwapDate = constraint.swapDate;
  }
  if (constraint.swapDayOfWeek !== undefined) {
    topLevelConstraint.SwapDayOfWeek = constraint.swapDayOfWeek;
  }

  return {
    ...originalRequest,
    ...topLevelConstraint,
    Shifts: sourceShifts,  // Original shift IDs — NOT composite
    Employees: employees,
    SchedulingOptions: {
      ...(originalRequest?.SchedulingOptions || {}),
      // Ensure solver has time to search — default to 30s if not set
      TimeLimitSeconds: (originalRequest?.SchedulingOptions as any)?.TimeLimitSeconds ?? 30,
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
  const empAssignments = (solverAssignments || []).filter((assignment) => {
    return getAssignmentEmployeeIdCandidates(assignment as SolverAssignment & Record<string, unknown>).includes(empId);
  });

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
