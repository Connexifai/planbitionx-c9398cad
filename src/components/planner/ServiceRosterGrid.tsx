import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type ShiftType = "vroeg" | "dag" | "laat" | "nacht" | null;

interface ShiftData {
  type: ShiftType;
  time?: string;
  label?: string;
}

interface Employee {
  name: string;
  id: number;
  shifts: ShiftData[];
}

const days = [
  { day: "Ma", date: "02/03" },
  { day: "Di", date: "03/03" },
  { day: "Wo", date: "04/03" },
  { day: "Do", date: "05/03" },
  { day: "Vr", date: "06/03" },
  { day: "Za", date: "07/03" },
  { day: "Zo", date: "08/03" },
];

// Reuse same employees from RosterGrid but map to the 7-day week view (indices 5-11 from original 14-day range)
const employees: Employee[] = [
  {
    name: "AABachmann, Franz-Xaver", id: 233,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
    ],
  },
  {
    name: "AKBLY, Lelia", id: 1177,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "ANGIUS, Benvenuto", id: 1187,
    shifts: [
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: null },
    ],
  },
  {
    name: "Ankrett, Emmie", id: 787,
    shifts: [
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: null },
    ],
  },
  {
    name: "GRENIER, Beatrice", id: 2975,
    shifts: [
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: null },
    ],
  },
  {
    name: "POUCKE, Matthieu", id: 2878,
    shifts: [
      { type: null },
      { type: null },
      { type: "dag", time: "09:00-18:00", label: "Day no qualification" },
      { type: "vroeg", time: "06:00-14:00", label: "Early no qualification" },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "SARCY, Coralie", id: 2754,
    shifts: [
      { type: null },
      { type: null },
      { type: null },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "SARPAUX, Teddy", id: 2735,
    shifts: [
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "BOUCHARD, Pierre", id: 3012,
    shifts: [
      { type: null },
      { type: null },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
    ],
  },
  {
    name: "DELACROIX, Marie", id: 3045,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "FERNANDEZ, Carlos", id: 3102,
    shifts: [
      { type: null },
      { type: null },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "JANSSEN, Eva", id: 3156,
    shifts: [
      { type: null },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "KOWALSKI, Adam", id: 3201,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "MARTIN, Sophie", id: 3278,
    shifts: [
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: null },
      { type: null },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "NGUYEN, Thanh", id: 3334,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: null },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "PETIT, Lucas", id: 3389,
    shifts: [
      { type: null },
      { type: null },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "ROUSSEAU, Claire", id: 3421,
    shifts: [
      { type: null },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "HELOISE, Heloise, TEST", id: 4001,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
    ],
  },
  {
    name: "SEDE, Alexia", id: 4002,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "SEMAILLE, Laurence", id: 4003,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
    ],
  },
  {
    name: "SENECHAL, Lucie", id: 4004,
    shifts: [
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "SERAICHE, Nesrine", id: 4005,
    shifts: [
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: null },
    ],
  },
  {
    name: "SILLAH, Mamogara", id: 4006,
    shifts: [
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "TAISNE, Aurelien", id: 4007,
    shifts: [
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "TALLOUT, Manelle", id: 4008,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: null },
      { type: null },
      { type: null },
      { type: null },
      { type: null },
    ],
  },
  {
    name: "TARRADE, Loic", id: 4009,
    shifts: [
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: null },
      { type: null },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: null },
    ],
  },
];

// Shift group definitions for grouping
const shiftGroups = [
  { label: "Early pick", type: "vroeg" as ShiftType, matchLabel: "Early pick", time: "06:00-14:00", target: 25 },
  { label: "Day Pick", type: "dag" as ShiftType, matchLabel: "Day Pick", time: "09:00-18:00", target: 25 },
  { label: "Late pick", type: "laat" as ShiftType, matchLabel: "Late pick", time: "14:00-22:00", target: 25 },
  { label: "Late pack", type: "laat" as ShiftType, matchLabel: "Late pack", time: "14:00-22:00", target: 25 },
  { label: "Night Pick", type: "nacht" as ShiftType, matchLabel: "Night Pick", time: "22:00-06:00", target: 25 },
  { label: "Night Pack", type: "nacht" as ShiftType, matchLabel: "Night Pack", time: "22:00-06:00", target: 25 },
];

const shiftClassMap: Record<string, string> = {
  vroeg: "shift-early",
  dag: "shift-day",
  laat: "shift-late",
  nacht: "shift-night",
};

const shiftTypeLabel: Record<string, string> = {
  vroeg: "Vroeg",
  dag: "Dag",
  laat: "Laat",
  nacht: "Nacht",
};

interface DayShiftGroup {
  groupLabel: string;
  shiftType: ShiftType;
  time: string;
  target: number;
  employees: string[];
}

function buildDayData(): DayShiftGroup[][] {
  return days.map((_, dayIdx) => {
    return shiftGroups.map((group) => {
      const emps = employees
        .filter((emp) => {
          const s = emp.shifts[dayIdx];
          return s && s.type === group.type && s.label === group.matchLabel;
        })
        .map((emp) => emp.name);
      return {
        groupLabel: group.label,
        shiftType: group.type,
        time: group.time,
        target: group.target,
        employees: emps,
      };
    }).filter(g => g.employees.length > 0);
  });
}

function CountBadge({ count, target }: { count: number; target: number }) {
  const full = count >= target;
  const color = full
    ? "text-kpi-assignments"
    : count >= target * 0.6
    ? "text-kpi-unfilled"
    : "text-destructive";
  return (
    <span className={`text-xs font-bold ${color}`}>
      {count}/{target}
    </span>
  );
}

function DayFillRate({ dayGroups, totalTarget }: { dayGroups: DayShiftGroup[]; totalTarget: number }) {
  const filled = dayGroups.reduce((sum, g) => sum + g.employees.length, 0);
  const pct = totalTarget > 0 ? Math.round((filled / totalTarget) * 100) : 0;
  const color = pct >= 75 ? "text-kpi-assignments" : pct >= 50 ? "text-kpi-unfilled" : "text-destructive";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {filled}/{totalTarget} · {pct}%
    </span>
  );
}

export function ServiceRosterGrid() {
  const dayData = buildDayData();
  const totalTarget = shiftGroups.reduce((s, g) => s + g.target, 0);

  return (
    <div className="roster-scroll w-full max-w-full rounded-xl border border-border/50 bg-card shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
      <table style={{ minWidth: "1200px" }} className="w-full border-collapse">
        <thead>
          <tr className="sticky top-0 z-[5]">
            {/* Empty top-left corner */}
            <th className="sticky left-0 z-[6] bg-card border-b border-r w-[180px] min-w-[180px]" />
            {days.map((d, i) => (
              <th
                key={i}
                className={`border-b border-r last:border-r-0 py-3 px-2 bg-card shadow-sm ${
                  d.day === "Za" || d.day === "Zo" ? "bg-weekend" : ""
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-bold text-foreground">{d.day}</span>
                  <span className="text-[11px] text-muted-foreground">{d.date}</span>
                  <DayFillRate dayGroups={dayData[i]} totalTarget={totalTarget} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shiftGroups.map((group, gIdx) => (
            <tr key={gIdx} className="border-b last:border-b-0">
              {/* Sticky left column with shift info */}
              <td className="sticky left-0 z-[3] bg-card border-r w-[180px] min-w-[180px] px-3 py-3 align-top">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-foreground">{group.label}</span>
                  <div className={`shift-badge ${shiftClassMap[group.type!]} text-[10px] px-2 py-0.5 w-fit`}>
                    {shiftTypeLabel[group.type!]}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{group.time}</span>
                </div>
              </td>
              {/* Day cells */}
              {days.map((d, dayIdx) => {
                const emps = employees
                  .filter((emp) => {
                    const s = emp.shifts[dayIdx];
                    return s && s.type === group.type && s.label === group.matchLabel;
                  })
                  .map((emp) => emp.name);
                return (
                  <td
                    key={dayIdx}
                    className={`border-r last:border-r-0 px-3 py-2 align-top ${
                      d.day === "Za" || d.day === "Zo" ? "bg-weekend" : ""
                    }`}
                  >
                    <div className="mb-1">
                      <CountBadge count={emps.length} target={group.target} />
                    </div>
                    {emps.map((name, nIdx) => (
                      <div
                        key={nIdx}
                        className="text-[12px] leading-relaxed text-foreground py-0.5 truncate hover:text-primary transition-colors cursor-default"
                      >
                        {name}
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
