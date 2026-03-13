import type { JsonScheduleData } from "@/components/planner/JsonDataViewer";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface RawQualification {
  Key?: string;
  Type?: string;
  Value: string;
  IsMainQualification?: boolean;
}

interface RawShift {
  Id: string;
  Name: string;
  Start: string;
  End: string;
  Demand: number;
  Qualifications?: { AllOf?: RawQualification[]; AnyOf?: RawQualification[]; NoneOf?: RawQualification[] };
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

function classifyShiftType(name: string, startHour: number): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("night") || lower.includes("nacht")) return "nacht";
  if (lower.includes("late") || lower.includes("laat")) return "laat";
  if (lower.includes("early") || lower.includes("vroeg")) return "vroeg";
  if (lower.includes("day") || lower.includes("dag")) return "dag";
  if (startHour >= 22 || startHour < 6) return "nacht";
  if (startHour >= 14) return "laat";
  if (startHour >= 9) return "dag";
  return "vroeg";
}

export function parseRawScheduleJson(raw: RawSchedule): JsonScheduleData {
  const start = raw.Start;
  const end = raw.End;

  // Days
  const days = eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end),
  }).map((d) => format(d, "EEE d/M", { locale: nl }));

  // Deduplicate shifts by Id+Name, aggregate demand
  const shiftMap = new Map<string, { name: string; type: string; startTime: string; endTime: string; totalDemand: number; count: number }>();
  for (const s of raw.Shifts) {
    const key = `${s.Id}_${s.Name}`;
    const sStart = parseISO(s.Start);
    const sEnd = parseISO(s.End);
    const startTime = format(sStart, "HH:mm");
    const endTime = format(sEnd, "HH:mm");
    const type = classifyShiftType(s.Name, sStart.getHours());

    if (shiftMap.has(key)) {
      const existing = shiftMap.get(key)!;
      existing.totalDemand += s.Demand;
      existing.count += 1;
    } else {
      shiftMap.set(key, { name: s.Name, type, startTime, endTime, totalDemand: s.Demand, count: 1 });
    }
  }

  const shifts = Array.from(shiftMap.values()).map((s) => ({
    name: s.name,
    type: s.type,
    startTime: s.startTime,
    endTime: s.endTime,
    requiredPerDay: Math.round(s.totalDemand / s.count),
  }));

  // Employees
  const employees = (raw.Employees || []).map((emp) => {
    const qualTags = (emp.Qualifications || [])
      .filter((q) => q.Type === "Qualification")
      .map((q) => q.Value);
    const empType = (emp.Qualifications || []).find((q) => q.Type === "EmployeeType")?.Value;
    const city = (emp.Qualifications || []).find((q) => q.Type === "City")?.Value;

    const tags = [...qualTags];
    if (empType) tags.push(empType);

    return {
      name: emp.Name,
      tags,
      location: city && city !== "-" ? city : undefined,
      contractHours: emp.MaxHoursPerWeek,
    };
  });

  return { start, end, employees, shifts, days };
}
