import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ShiftType = "vroeg" | "dag" | "laat" | "nacht" | null;

interface ShiftData {
  type: ShiftType;
  time?: string;
  label?: string;
}

interface Employee {
  name: string;
  id: number;
  tags: string[];
  location?: string;
  hours: string;
  hoursPercent: number;
  shifts: ShiftData[];
}

const days = [
  { day: "Wo", date: "25/02", weekend: false },
  { day: "Do", date: "26/02", weekend: false },
  { day: "Vr", date: "27/02", weekend: false },
  { day: "Za", date: "28/02", weekend: true },
  { day: "Zo", date: "01/03", weekend: true },
  { day: "Ma", date: "02/03", weekend: false },
  { day: "Di", date: "03/03", weekend: false },
  { day: "Wo", date: "04/03", weekend: false },
  { day: "Do", date: "05/03", weekend: false },
  { day: "Vr", date: "06/03", weekend: false },
  { day: "Za", date: "07/03", weekend: true },
  { day: "Zo", date: "08/03", weekend: true },
  { day: "Ma", date: "09/03", weekend: false },
  { day: "Di", date: "10/03", weekend: false },
];

const employees: Employee[] = [
  {
    name: "AABachmann, Franz-Xaver",
    id: 233,
    tags: ["Pack", "Own Employee"],
    location: "Liège",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      null, null, null, null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "AKBLY, Lelia",
    id: 1177,
    tags: ["Pick", "Pack"],
    location: "Escaudain",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      null, null, null, null, { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "ANGIUS, Benvenuto",
    id: 1187,
    tags: ["Pick", "Own Employee"],
    location: "Valenciennes",
    hours: "52.8/48u",
    hoursPercent: 110,
    shifts: [
      null, null, null, null, null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      null, null, null,
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "Ankrett, Emmie",
    id: 787,
    tags: ["Pick", "Own Employee"],
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      null, null, null, null, null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      null, null, null,
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "GRENIER, Beatrice, STACHOWIAK",
    id: 2975,
    tags: ["Pick", "Own Employee"],
    location: "Harnes",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      null, null, null, null, null,
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      null, null, null,
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "POUCKE, Matthieu, VAN",
    id: 2878,
    tags: ["Own Employee"],
    location: "Noyelles Godault",
    hours: "34.8/48u",
    hoursPercent: 73,
    shifts: [
      null, null, null, null, null,
      null, null,
      { type: "dag", time: "09:00-18:00", label: "Day no qualification" },
      { type: "vroeg", time: "06:00-14:00", label: "Early no qualification" },
      null, null, null,
      { type: "dag", time: "09:00-18:00", label: "Day no qualification" },
      { type: "vroeg", time: "06:00-14:00", label: "Early no qualification" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "SARCY, Coralie",
    id: 2754,
    tags: ["Pick", "Own Employee"],
    location: "Harnes",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      null, null, null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      null, null, null,
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "SARPAUX, Teddy",
    id: 2735,
    tags: ["Pick", "Own Employee"],
    location: "Oignies",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      null, null, null, null, null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      null, null, null,
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "BOUCHARD, Pierre",
    id: 3012,
    tags: ["Pick", "Own Employee"],
    location: "Lens",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      null, null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      null, null,
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "DELACROIX, Marie",
    id: 3045,
    tags: ["Pack", "Own Employee"],
    location: "Douai",
    hours: "40.0/48u",
    hoursPercent: 83,
    shifts: [
      null, null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      null, null, null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "FERNANDEZ, Carlos",
    id: 3102,
    tags: ["Pick", "Pack"],
    location: "Béthune",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pick" },
      null, null, null, null,
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      null, null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "JANSSEN, Eva",
    id: 3156,
    tags: ["Pick", "Own Employee"],
    location: "Arras",
    hours: "44.0/48u",
    hoursPercent: 92,
    shifts: [
      null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      null, null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      null, null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      null,
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "KOWALSKI, Adam",
    id: 3201,
    tags: ["Pack"],
    location: "Liévin",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      null, null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
      { type: "laat", time: "14:00-22:00", label: "Late pack" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "MARTIN, Sophie",
    id: 3278,
    tags: ["Pick", "Own Employee"],
    location: "Hénin-Beaumont",
    hours: "36.0/48u",
    hoursPercent: 75,
    shifts: [
      null, null, null, null, null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      null, null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      null, null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "NGUYEN, Thanh",
    id: 3334,
    tags: ["Pick", "Pack", "Own Employee"],
    location: "Carvin",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pack" },
      { type: "dag", time: "09:00-18:00", label: "Day Pack" },
      null, null,
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      { type: "laat", time: "14:00-22:00", label: "Late pick" },
      null, null, null,
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "PETIT, Lucas",
    id: 3389,
    tags: ["Pack", "Own Employee"],
    location: "Sallaumines",
    hours: "48.0/48u",
    hoursPercent: 100,
    shifts: [
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      null, null,
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      { type: "nacht", time: "22:00-06:00", label: "Night Pack" },
      null, null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pack" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pack" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
  {
    name: "ROUSSEAU, Claire",
    id: 3421,
    tags: ["Pick"],
    location: "Noyelles Godault",
    hours: "42.0/48u",
    hoursPercent: 88,
    shifts: [
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
      null, null,
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      { type: "vroeg", time: "06:00-14:00", label: "Early pick" },
      null, null, null,
      { type: "dag", time: "09:00-18:00", label: "Day Pick" },
    ].map(s => s ? s as ShiftData : { type: null }),
  },
];

const shiftClassMap: Record<string, string> = {
  vroeg: "shift-early",
  dag: "shift-day",
  laat: "shift-late",
  nacht: "shift-night",
};

function ShiftCell({ shift }: { shift: ShiftData }) {
  if (!shift.type) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-xs text-muted-foreground/40">—</span>
      </div>
    );
  }

  const cls = shiftClassMap[shift.type] || "";

  // Extract role from label (e.g. "Late pick" → "pick", "Night Pack" → "pack")
  const role = shift.label?.split(" ").slice(1).join(" ") || "";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`shift-badge ${cls} cursor-default flex-col items-start w-full`}>
          <span className="font-semibold capitalize text-[11px]">{shift.type === "vroeg" ? "Vroeg" : shift.type === "dag" ? "Dag" : shift.type === "laat" ? "Laat" : "Nacht"}</span>
          <span className="text-[10px] opacity-75">{shift.time}</span>
          {role && <span className="text-[9px] opacity-60 capitalize font-medium mt-0.5">{role}</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-medium">{shift.label}</p>
        <p className="text-xs text-muted-foreground">{shift.time}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function HoursBar({ percent }: { percent: number }) {
  const color = percent > 100 ? "bg-destructive" : percent > 90 ? "bg-kpi-assignments" : "bg-primary";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

// Compute fill rate per day across all employees
function getDayFillRates() {
  return days.map((_, dayIdx) => {
    const filled = employees.filter(emp => emp.shifts[dayIdx]?.type !== null).length;
    return Math.round((filled / employees.length) * 100);
  });
}

// Compute fill rate per employee (filled shifts / total days)
function getEmployeeFillRate(emp: Employee) {
  const filled = emp.shifts.filter(s => s.type !== null).length;
  return Math.round((filled / days.length) * 100);
}

function FillRateIndicator({ percent }: { percent: number }) {
  const color = percent >= 80 ? "text-kpi-assignments" : percent >= 50 ? "text-kpi-unfilled" : "text-destructive";
  return (
    <span className={`text-[10px] font-semibold ${color}`}>{percent}%</span>
  );
}

export function RosterGrid() {
  const dayFillRates = getDayFillRates();

  return (
    <div className="roster-scroll w-full rounded-xl border border-border/50 bg-card shadow-sm overflow-auto max-h-[calc(100vh-280px)]">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="sticky top-0 z-10 grid grid-cols-[280px_repeat(14,1fr)] border-b bg-card shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-r">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medewerker</span>
          </div>
          {days.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-2.5 text-center border-r last:border-r-0 ${d.weekend ? "bg-weekend" : ""}`}
            >
              <span className="text-xs font-semibold text-foreground">{d.day}</span>
              <span className="text-[10px] text-muted-foreground">{d.date}</span>
              <FillRateIndicator percent={dayFillRates[i]} />
            </div>
          ))}
        </div>

        {/* Rows */}
        {employees.map((emp, rowIdx) => {
          const fillRate = getEmployeeFillRate(emp);
          return (
            <div
              key={emp.id}
              className={`grid grid-cols-[280px_repeat(14,1fr)] border-b last:border-b-0 transition-colors hover:bg-accent/30 ${rowIdx % 2 === 0 ? "" : "bg-accent/10"}`}
            >
              {/* Employee info */}
              <div className="flex flex-col justify-center gap-1.5 px-4 py-3 border-r">
                <div>
                  <p className="text-sm font-semibold leading-tight truncate">{emp.name}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {emp.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {tag}
                    </Badge>
                  ))}
                  {emp.location && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {emp.location}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{emp.hours}</span>
                  <HoursBar percent={emp.hoursPercent} />
                </div>
              </div>

              {/* Shift cells */}
              {emp.shifts.map((shift, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center px-1 py-2 border-r last:border-r-0 ${days[i]?.weekend ? "bg-weekend" : ""}`}
                >
                  <ShiftCell shift={shift} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
