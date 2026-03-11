import { format, parseISO, eachDayOfInterval } from "date-fns";
import { nl } from "date-fns/locale";

/**
 * Solver response format: { assignedShifts: AssignedShift[] }
 * Request format: { Start, End, Shifts[], Employees[] }
 * 
 * This module merges both to produce RosterGrid-compatible data.
 */

export interface AssignedShift {
  scheduleDate: string;
  startTime: string;
  endTime: string;
  shiftId: string;
  contractId: string;
}

export interface SolverResponse {
  assignedShifts: AssignedShift[];
}

interface RawShift {
  Id: string;
  Name: string;
  Start: string;
  End: string;
  Demand: number;
}

interface RawEmployee {
  ContractId: string;
  PersonId: number;
  Name: string;
  Qualifications?: { Type: string; Value: string }[];
  MaxHoursPerWeek?: number;
}

interface RawSchedule {
  Start: string;
  End: string;
  Shifts: RawShift[];
  Employees: RawEmployee[];
}

export type ShiftType = "vroeg" | "dag" | "laat" | "nacht" | null;

export interface ShiftData {
  type: ShiftType;
  time?: string;
  label?: string;
}

export interface RosterEmployee {
  name: string;
  id: number;
  contractId: string;
  tags: string[];
  location?: string;
  hours: string;
  hoursPercent: number;
  shifts: ShiftData[];
}

export interface DayColumn {
  dayKey: string;
  date: string;
  weekend: boolean;
}

export interface RosterData {
  days: DayColumn[];
  employees: RosterEmployee[];
}

function classifyShiftType(name: string, startHour: number): ShiftType {
  const lower = name.toLowerCase();
  if (lower.includes("night") || lower.includes("nacht")) return "nacht";
  if (lower.includes("late") || lower.includes("laat")) return "laat";
  if (lower.includes("early") || lower.includes("vroeg")) return "vroeg";
  if (lower.includes("day") || lower.includes("dag")) return "dag";
  if (startHour >= 22 || startHour < 6) return "nacht";
  if (startHour >= 14) return "laat";
  if (startHour >= 9) return "dag";
  return "vroeg";
}

const dayKeyMap: Record<number, string> = {
  0: "su", 1: "mo", 2: "tu", 3: "we", 4: "th", 5: "fr", 6: "sa",
};

export function parseSolverResponse(request: RawSchedule, response: SolverResponse): RosterData {
  // Build day columns from request date range
  const startDate = parseISO(request.Start);
  const endDate = parseISO(request.End);
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const days: DayColumn[] = allDays.map((d) => ({
    dayKey: dayKeyMap[d.getDay()],
    date: format(d, "dd/MM"),
    weekend: d.getDay() === 0 || d.getDay() === 6,
  }));

  // Map of date string (YYYY-MM-DD) → day index
  const dayIndexMap = new Map<string, number>();
  allDays.forEach((d, i) => {
    dayIndexMap.set(format(d, "yyyy-MM-dd"), i);
  });

  // Map shiftId → shift name from request (deduplicated)
  const shiftNameMap = new Map<string, string>();
  for (const s of request.Shifts) {
    if (!shiftNameMap.has(s.Id)) {
      shiftNameMap.set(s.Id, s.Name);
    }
  }

  // Map contractId → employee info
  const employeeMap = new Map<string, RawEmployee>();
  for (const emp of request.Employees) {
    employeeMap.set(emp.ContractId, emp);
  }

  // Group assigned shifts by contractId
  const assignmentsByContract = new Map<string, AssignedShift[]>();
  for (const a of response.assignedShifts) {
    if (!assignmentsByContract.has(a.contractId)) {
      assignmentsByContract.set(a.contractId, []);
    }
    assignmentsByContract.get(a.contractId)!.push(a);
  }

  // Build employee rows
  const employees: RosterEmployee[] = [];

  for (const emp of request.Employees) {
    const assignments = assignmentsByContract.get(emp.ContractId) || [];
    const shifts: ShiftData[] = days.map(() => ({ type: null }));

    let totalHours = 0;

    for (const a of assignments) {
      const dateKey = format(parseISO(a.scheduleDate), "yyyy-MM-dd");
      const dayIdx = dayIndexMap.get(dateKey);
      if (dayIdx === undefined) continue;

      const start = parseISO(a.startTime);
      const end = parseISO(a.endTime);
      const startHour = start.getHours();
      const shiftName = shiftNameMap.get(a.shiftId) || "Shift";
      const type = classifyShiftType(shiftName, startHour);
      const time = `${format(start, "HH:mm")}-${format(end, "HH:mm")}`;
      const durationH = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      totalHours += durationH;

      shifts[dayIdx] = { type, time, label: shiftName };
    }

    // Employee tags from qualifications
    const qualTags = (emp.Qualifications || [])
      .filter((q) => q.Type === "Qualification")
      .map((q) => q.Value);
    const empType = (emp.Qualifications || []).find((q) => q.Type === "EmployeeType")?.Value;
    const city = (emp.Qualifications || []).find((q) => q.Type === "City")?.Value;
    const tags = [...qualTags];
    if (empType) tags.push(empType);

    const maxHours = emp.MaxHoursPerWeek || 48;
    const hoursPercent = Math.round((totalHours / maxHours) * 100);

    employees.push({
      name: emp.Name,
      id: emp.PersonId,
      contractId: emp.ContractId,
      tags,
      location: city && city !== "-" ? city : undefined,
      hours: `${totalHours.toFixed(1)}/${maxHours}u`,
      hoursPercent,
      shifts,
    });
  }

  // Sort: employees with shifts first, then by name
  employees.sort((a, b) => {
    const aHasShifts = a.shifts.some((s) => s.type !== null);
    const bHasShifts = b.shifts.some((s) => s.type !== null);
    if (aHasShifts !== bHasShifts) return aHasShifts ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { days, employees };
}
