import { format, parseISO, getDay } from "date-fns";

/**
 * Builds a /solve/alternatives request payload from:
 * - The original solve request (with Shifts, Employees, etc.)
 * - The solver's Assignments response
 * - The user's constraint (which employee, what they want)
 */

export interface AlternativeConstraint {
  employeeId: string;
  employeeName: string;
  type: "avoid_day" | "avoid_date" | "avoid_shift_kind";
  dayOfWeek?: number;   // 0=ma..6=zo
  date?: string;        // YYYY-MM-DD
  shiftKind?: string;   // "early","day","late","night"
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

/**
 * Determines which shifts to remove from an employee's AssignedShifts
 * based on the constraint type.
 */
function getConflictingShiftIds(
  assignments: SolverAssignment[],
  employeeId: string,
  constraint: AlternativeConstraint,
  shifts: any[]
): string[] {
  const employeeAssignments = assignments.filter(a => String(a.PersonId) === String(employeeId));
  
  return employeeAssignments
    .filter(a => {
      const date = parseISO(a.Start);
      
      if (constraint.type === "avoid_date") {
        return format(date, "yyyy-MM-dd") === constraint.date;
      }
      
      if (constraint.type === "avoid_day") {
        // JS getDay: 0=Sun, convert to 0=Mon
        const jsDay = getDay(date);
        const mondayBased = jsDay === 0 ? 6 : jsDay - 1;
        return mondayBased === constraint.dayOfWeek;
      }
      
      if (constraint.type === "avoid_shift_kind") {
        const shift = shifts.find(s => s.Id === a.ShiftId);
        if (!shift) return false;
        const hour = parseISO(shift.Start).getHours();
        const name = (shift.Name || "").toLowerCase();
        let kind = "day";
        if (name.includes("nacht") || name.includes("night") || hour >= 22 || hour < 6) kind = "night";
        else if (name.includes("laat") || name.includes("late") || hour >= 14) kind = "late";
        else if (name.includes("vroeg") || name.includes("early") || hour < 9) kind = "early";
        return kind === constraint.shiftKind;
      }
      
      return false;
    })
    .map(a => a.ShiftId);
}

export function buildAlternativesPayload(
  originalRequest: any,
  solverAssignments: SolverAssignment[],
  constraint: AlternativeConstraint,
  maxAlternatives: number = 5
): any {
  const conflictingShiftIds = getConflictingShiftIds(
    solverAssignments,
    constraint.employeeId,
    constraint,
    originalRequest.Shifts || []
  );

  const conflictingSet = new Set(conflictingShiftIds);

  // Build employees with AssignedShifts
  const employees = (originalRequest.Employees || []).map((emp: any) => {
    const empId = String(emp.PersonId ?? emp.Id);
    const empAssignments = solverAssignments.filter(a => String(a.PersonId) === empId);
    
    let assignedShifts: string[];
    let constraints = [...(emp.Constraints || [])];

    if (empId === String(constraint.employeeId)) {
      // Remove conflicting shifts for the target employee
      assignedShifts = empAssignments
        .filter(a => !conflictingSet.has(a.ShiftId))
        .map(a => a.ShiftId);
      
      // Add hard constraint
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
    } else {
      // Keep all shifts for other employees
      assignedShifts = empAssignments.map(a => a.ShiftId);
    }

    return {
      ...emp,
      AssignedShifts: assignedShifts,
      Constraints: constraints,
    };
  });

  return {
    Start: originalRequest.Start,
    End: originalRequest.End,
    Shifts: originalRequest.Shifts,
    Employees: employees,
    SchedulingOptions: {
      ...(originalRequest.SchedulingOptions || {}),
      MaxAlternatives: maxAlternatives,
    },
  };
}
