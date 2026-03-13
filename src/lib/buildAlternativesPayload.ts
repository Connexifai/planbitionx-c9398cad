import { format, getDay, parseISO } from "date-fns";

/**
 * Builds a /solve/alternatives request payload from:
 * - The original solve request (with Shifts, Employees, etc.)
 * - The solver's Assignments response
 * - The user's constraint (which employee, what they want)
 */

const SHIFT_INSTANCE_SEPARATOR = "__instance__";

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
  Start?: string;
  End?: string;
}

export interface Alternative {
  Rank: number;
  ChangesFromBaseline: number;
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

function toBaseShiftId(shiftId: string): string {
  const idx = shiftId.indexOf(SHIFT_INSTANCE_SEPARATOR);
  return idx === -1 ? shiftId : shiftId.slice(0, idx);
}

function classifyShiftKind(shiftName: string, shiftStart: string): "early" | "day" | "late" | "night" {
  const lower = (shiftName || "").toLowerCase();
  const hour = parseISO(shiftStart).getHours();

  if (lower.includes("nacht") || lower.includes("night") || hour >= 22 || hour < 6) return "night";
  if (lower.includes("laat") || lower.includes("late") || hour >= 14) return "late";
  if (lower.includes("vroeg") || lower.includes("early") || hour < 9) return "early";
  return "day";
}

function buildShiftInstances(shifts: any[]) {
  const instanceShifts = shifts.map((shift: any) => {
    const baseId = String(shift.Id);
    const start = String(shift.Start ?? "");
    return {
      ...shift,
      Id: `${baseId}${SHIFT_INSTANCE_SEPARATOR}${start}`,
    };
  });

  const byBaseAndStart = new Map<string, string>();
  const firstByBase = new Map<string, string>();

  for (const shift of instanceShifts) {
    const instanceId = String(shift.Id);
    const baseId = toBaseShiftId(instanceId);
    const start = String(shift.Start ?? "");
    byBaseAndStart.set(`${baseId}|${start}`, instanceId);
    if (!firstByBase.has(baseId)) {
      firstByBase.set(baseId, instanceId);
    }
  }

  return { instanceShifts, byBaseAndStart, firstByBase };
}

function resolveAssignmentInstanceShiftId(
  assignment: SolverAssignment,
  byBaseAndStart: Map<string, string>,
  firstByBase: Map<string, string>
): string | null {
  const baseShiftId = toBaseShiftId(String(assignment.ShiftId));
  const start = String(assignment.Start ?? "");

  const exact = byBaseAndStart.get(`${baseShiftId}|${start}`);
  if (exact) return exact;

  // Fallback when seconds formatting differs
  const minutePrefix = start.slice(0, 16);
  for (const [key, instanceId] of byBaseAndStart.entries()) {
    const [base, shiftStart] = key.split("|");
    if (base === baseShiftId && shiftStart.slice(0, 16) === minutePrefix) {
      return instanceId;
    }
  }

  return firstByBase.get(baseShiftId) || null;
}

function assignmentMatchesConstraint(
  assignment: SolverAssignment,
  shift: any,
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
    const kind = classifyShiftKind(String(shift?.Name ?? ""), String(shift?.Start ?? assignment.Start));
    return kind === constraint.shiftKind;
  }

  return false;
}

export function normalizeAlternativeShiftIds(alternative: Alternative): Alternative {
  return {
    ...alternative,
    Assignments: (alternative.Assignments || []).map((a) => ({
      ...a,
      ShiftId: toBaseShiftId(String(a.ShiftId)),
    })),
    Changes: (alternative.Changes || []).map((c) => ({
      ...c,
      ShiftId: toBaseShiftId(String(c.ShiftId)),
    })),
  };
}

export function buildAlternativesPayload(
  originalRequest: any,
  solverAssignments: SolverAssignment[],
  constraint: AlternativeConstraint,
  maxAlternatives: number = 5
): any {
  const sourceShifts = Array.isArray(originalRequest?.Shifts) ? originalRequest.Shifts : [];
  const sourceEmployees = Array.isArray(originalRequest?.Employees) ? originalRequest.Employees : [];

  const { instanceShifts, byBaseAndStart, firstByBase } = buildShiftInstances(sourceShifts);

  const normalizedAssignments = (Array.isArray(solverAssignments) ? solverAssignments : [])
    .map((assignment) => {
      const instanceShiftId = resolveAssignmentInstanceShiftId(assignment, byBaseAndStart, firstByBase);
      if (!instanceShiftId) return null;
      return {
        ...assignment,
        PersonId: String(assignment.PersonId),
        ShiftId: instanceShiftId,
      };
    })
    .filter((a): a is SolverAssignment => Boolean(a));

  const assignmentShiftMap = new Map<string, any>();
  for (const shift of instanceShifts) {
    assignmentShiftMap.set(String(shift.Id), shift);
  }

  const assignmentsByEmployee = new Map<string, SolverAssignment[]>();
  for (const assignment of normalizedAssignments) {
    const employeeId = String(assignment.PersonId);
    if (!assignmentsByEmployee.has(employeeId)) {
      assignmentsByEmployee.set(employeeId, []);
    }
    assignmentsByEmployee.get(employeeId)!.push(assignment);
  }

  const employees = sourceEmployees.map((emp: any) => {
    const empId = String(emp.PersonId ?? emp.Id);
    const empAssignments = assignmentsByEmployee.get(empId) || [];

    const existingConstraints = Array.isArray(emp.Constraints) ? [...emp.Constraints] : [];

    const filteredAssignments =
      empId === String(constraint.employeeId)
        ? empAssignments.filter((a) => {
            const shift = assignmentShiftMap.get(String(a.ShiftId));
            return !assignmentMatchesConstraint(a, shift, constraint);
          })
        : empAssignments;

    const assignedShifts = filteredAssignments.map((a) => String(a.ShiftId));

    const constraints = [...existingConstraints];
    if (empId === String(constraint.employeeId)) {
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
    Start: originalRequest?.Start,
    End: originalRequest?.End,
    Shifts: instanceShifts,
    Employees: employees,
    SchedulingOptions: {
      ...(originalRequest?.SchedulingOptions || {}),
      MaxAlternatives: Math.max(1, Math.min(10, maxAlternatives)),
    },
  };
}
