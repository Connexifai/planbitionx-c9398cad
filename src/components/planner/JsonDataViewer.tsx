import { Users, Calendar, Clock, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function toTitleCase(name: string): string {
  return name
    .split(/([,\s\-]+)/)
    .map((part) =>
      /^[,\s\-]+$/.test(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("");
}

export interface JsonScheduleData {
  start: string;
  end: string;
  employees: {
    name: string;
    tags: string[];
    location?: string;
    contractHours?: number;
  }[];
  shifts: {
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    requiredPerDay: number;
  }[];
  days: string[];
}

export const demoScheduleData: JsonScheduleData = {
  start: "2026-03-30T00:00:00",
  end: "2026-04-12T00:00:00",
  employees: [
    { name: "Bachmann, Franz-Xaver", tags: ["Pack", "Own Employee"], location: "Liège", contractHours: 48 },
    { name: "Claessens, Pieter", tags: ["Pick", "Own Employee"], location: "Liège", contractHours: 40 },
    { name: "De Groot, Sophie", tags: ["Pick", "Pack", "Own Employee"], location: "Liège", contractHours: 36 },
    { name: "El Amrani, Youssef", tags: ["Pick", "Own Employee"], location: "Liège", contractHours: 40 },
    { name: "Fontaine, Marie", tags: ["Pack", "Own Employee"], location: "Liège", contractHours: 32 },
    { name: "Janssen, Thomas", tags: ["Pick", "Temporary"], location: "Liège", contractHours: 40 },
    { name: "Kovačević, Ana", tags: ["Pack", "Own Employee"], location: "Liège", contractHours: 40 },
    { name: "Lambert, Lucas", tags: ["Pick", "Own Employee"], location: "Liège", contractHours: 48 },
    { name: "Müller, Stefanie", tags: ["Pick", "Pack", "Own Employee"], location: "Liège", contractHours: 36 },
    { name: "Nguyen, Thanh", tags: ["Pack", "Temporary"], location: "Liège", contractHours: 40 },
    { name: "Peeters, Jan", tags: ["Pick", "Own Employee"], location: "Liège", contractHours: 40 },
    { name: "Rossi, Marco", tags: ["Pack", "Own Employee"], location: "Liège", contractHours: 32 },
  ],
  shifts: [
    { name: "Vroege pick", type: "vroeg", startTime: "06:00", endTime: "14:00", requiredPerDay: 3 },
    { name: "Vroege pack", type: "vroeg", startTime: "06:00", endTime: "14:00", requiredPerDay: 2 },
    { name: "Dag pick", type: "dag", startTime: "09:00", endTime: "17:00", requiredPerDay: 2 },
    { name: "Dag pack", type: "dag", startTime: "09:00", endTime: "17:00", requiredPerDay: 2 },
    { name: "Late pick", type: "laat", startTime: "14:00", endTime: "22:00", requiredPerDay: 2 },
    { name: "Late pack", type: "laat", startTime: "14:00", endTime: "22:00", requiredPerDay: 2 },
    { name: "Nacht", type: "nacht", startTime: "22:00", endTime: "06:00", requiredPerDay: 1 },
  ],
  days: ["Ma 30/3", "Di 31/3", "Wo 1/4", "Do 2/4", "Vr 3/4", "Za 4/4", "Zo 5/4", "Ma 6/4", "Di 7/4", "Wo 8/4", "Do 9/4", "Vr 10/4", "Za 11/4", "Zo 12/4"],
};

/* ── Summary Cards ───────────────────────── */

function SummaryCards({ data }: { data: JsonScheduleData }) {
  const { t } = useTranslation();
  const totalShiftsPerDay = data.shifts.reduce((sum, s) => sum + s.requiredPerDay, 0);
  const totalShifts = totalShiftsPerDay * data.days.length;

  const cards = [
    { label: t("json.employees"), value: data.employees.length, icon: <Users className="h-5 w-5" />, color: "text-kpi-occupancy", bg: "bg-kpi-occupancy/10" },
    { label: t("json.shiftsPerDay"), value: totalShiftsPerDay, icon: <Layers className="h-5 w-5" />, color: "text-kpi-assignments", bg: "bg-kpi-assignments/10" },
    { label: t("json.days"), value: data.days.length, icon: <Calendar className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10" },
    { label: t("json.totalShifts"), value: totalShifts, icon: <Layers className="h-5 w-5" />, color: "text-kpi-open", bg: "bg-kpi-open/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="flex items-center gap-3 rounded-xl bg-card border border-border/50 p-4 shadow-sm">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", card.bg)}>
            <span className={card.color}>{card.icon}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            <p className={cn("text-xl font-bold", card.color)}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Employee Table ──────────────────────── */

function EmployeeTable({ data }: { data: JsonScheduleData }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("json.employees")} ({data.employees.length})</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t">
          <ScrollArea className="h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{t("json.name")}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{t("json.location")}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{t("json.contract")}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{t("json.tags")}</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp, i) => (
                  <tr key={i} className="border-t border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2 font-medium">{emp.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{emp.location || "–"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{emp.contractHours ? `${emp.contractHours}u` : "–"}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {emp.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/* ── Shift Overview ──────────────────────── */

function ShiftOverview({ data }: { data: JsonScheduleData }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const shiftColorMap: Record<string, string> = {
    vroeg: "bg-shift-early/20 text-shift-early border-shift-early/30",
    dag: "bg-shift-day/20 text-shift-day border-shift-day/30",
    laat: "bg-shift-late/20 text-shift-late border-shift-late/30",
    nacht: "bg-shift-night/20 text-shift-night border-shift-night/30",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("json.shifts")} ({data.shifts.length})</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {data.shifts.map((shift, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2.5",
                shiftColorMap[shift.type] || "bg-muted"
              )}
            >
              <div>
                <p className="text-sm font-semibold">{shift.name}</p>
                <p className="text-xs opacity-80">{shift.startTime} – {shift.endTime}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{shift.requiredPerDay}</p>
                <p className="text-[10px] opacity-70">{t("json.perDay")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Week Grid ───────────────────────────── */

function WeekGrid({ data }: { data: JsonScheduleData }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const shiftBgMap: Record<string, string> = {
    vroeg: "bg-shift-early",
    dag: "bg-shift-day",
    laat: "bg-shift-late",
    nacht: "bg-shift-night",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("json.weekOverview")}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t">
          <ScrollArea className="w-full">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[120px]">{t("json.shift")}</th>
                  {data.days.map((day, i) => {
                    const isWeekend = day.startsWith("Za") || day.startsWith("Zo");
                    return (
                      <th key={i} className={cn("text-center px-2 py-2 font-medium min-w-[56px]", isWeekend ? "text-muted-foreground bg-weekend/50" : "text-muted-foreground")}>
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.shifts.map((shift, si) => (
                  <tr key={si} className="border-t border-border/30">
                    <td className="px-3 py-2 font-medium sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", shiftBgMap[shift.type])} />
                        {shift.name}
                      </div>
                    </td>
                    {data.days.map((day, di) => {
                      const isWeekend = day.startsWith("Za") || day.startsWith("Zo");
                      const required = isWeekend ? Math.max(1, shift.requiredPerDay - 1) : shift.requiredPerDay;
                      return (
                        <td key={di} className={cn("text-center py-2", isWeekend && "bg-weekend/30")}>
                          <span className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold",
                            required > 0 ? `${shiftBgMap[shift.type]}/20 text-foreground` : "text-muted-foreground"
                          )}>
                            {required}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-muted/30 font-bold">
                  <td className="px-3 py-2 sticky left-0 bg-muted/30 z-10">{t("json.total")}</td>
                  {data.days.map((day, di) => {
                    const isWeekend = day.startsWith("Za") || day.startsWith("Zo");
                    const total = data.shifts.reduce((sum, s) => sum + (isWeekend ? Math.max(1, s.requiredPerDay - 1) : s.requiredPerDay), 0);
                    return (
                      <td key={di} className={cn("text-center py-2", isWeekend && "bg-weekend/30")}>
                        {total}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/* ── Main Viewer ─────────────────────────── */

export function JsonDataViewer({ data }: { data: JsonScheduleData }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full bg-kpi-assignments animate-pulse" />
        <p className="text-sm font-medium text-muted-foreground">
          {t("json.loaded")} · {data.start.split("T")[0]} {t("json.toDate")} {data.end.split("T")[0]}
        </p>
      </div>
      <SummaryCards data={data} />
      <EmployeeTable data={data} />
      <ShiftOverview data={data} />
      <WeekGrid data={data} />
    </div>
  );
}
