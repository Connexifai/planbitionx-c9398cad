import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, memo, useMemo } from "react";
import { Ban, ShieldAlert } from "lucide-react";
import type { RosterData, ShiftData, DayColumn, RosterEmployee, DemandMap } from "@/lib/parseSolverResponse";
import type { EmployeeConstraint } from "@/components/planner/AiBriefingChat";

type ShiftType = "vroeg" | "dag" | "laat" | "nacht" | null;

const shiftClassMap: Record<string, string> = {
  vroeg: "shift-early",
  dag: "shift-day",
  laat: "shift-late",
  nacht: "shift-night",
};

const ShiftCell = memo(function ShiftCell({ shift, t }: { shift: ShiftData; t: (key: string) => string }) {
  if (!shift.type) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-xs text-muted-foreground/40">—</span>
      </div>
    );
  }

  const cls = shiftClassMap[shift.type] || "";
  const role = shift.label?.split(" ").slice(1).join(" ") || "";

  const shiftTypeLabel: Record<string, string> = {
    vroeg: t("grid.early"),
    dag: t("grid.day"),
    laat: t("grid.late"),
    nacht: t("grid.night"),
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`shift-badge ${cls} cursor-default flex-col items-start w-full gap-0.5`}>
          <span className="font-semibold capitalize text-[13px] tracking-tight">
            {shiftTypeLabel[shift.type]}{role && <span className="opacity-70 font-medium"> [{role}]</span>}
          </span>
          <span className="text-[12px] opacity-90 font-medium">{shift.time}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-medium">{shift.label}</p>
        <p className="text-xs text-muted-foreground">{shift.time}</p>
      </TooltipContent>
    </Tooltip>
  );
});

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

function FillRateIndicator({ filled, target, pct }: { filled: number; target: number; pct: number }) {
  const color = pct >= 95 ? "text-kpi-assignments" : pct >= 85 ? "text-kpi-unfilled" : "text-destructive";
  const bgColor = pct >= 95 ? "bg-kpi-assignments/20" : pct >= 85 ? "bg-kpi-unfilled/20" : "bg-destructive/20";
  return (
    <div className={`flex flex-col items-center justify-center ${bgColor} rounded-lg px-2 py-1.5 min-w-[44px]`}>
      <span className={`text-[18px] font-extrabold leading-none ${color}`}>{pct}%</span>
      <span className={`text-[10px] font-semibold ${color} opacity-80`}>{filled}/{target}</span>
    </div>
  );
}

const dayNames = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const shiftKindLabels: Record<string, string> = { early: "Vroeg", day: "Dag", late: "Laat", night: "Nacht" };

function ConstraintIcons({ constraints }: { constraints: EmployeeConstraint[] }) {
  if (constraints.length === 0) return null;

  const hardCount = constraints.filter(c => c.constraint.strength === "hard").length;
  const softCount = constraints.length - hardCount;

  const lines = constraints.map(c => {
    const str = c.constraint.strength === "hard" ? "🚫" : "⚠️";
    if (c.constraint.type === "avoid_day") return `${str} ${dayNames[c.constraint.dayOfWeek ?? 0]}`;
    if (c.constraint.type === "avoid_shift_kind") return `${str} ${shiftKindLabels[c.constraint.shiftKind ?? ""] || c.constraint.shiftKind}`;
    if (c.constraint.type === "avoid_date") return `${str} ${c.constraint.date}`;
    return str;
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-0.5 ml-1">
          {hardCount > 0 && (
            <Ban className="h-3 w-3 text-destructive shrink-0" />
          )}
          {softCount > 0 && (
            <ShieldAlert className="h-3 w-3 text-kpi-unfilled shrink-0" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        <p className="text-xs font-semibold mb-1">Constraints:</p>
        {lines.map((line, i) => (
          <p key={i} className="text-xs">{line}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

const EmployeeRow = memo(function EmployeeRow({
  emp,
  numDays,
  days,
  t,
  constraints,
}: {
  emp: RosterEmployee;
  numDays: number;
  days: DayColumn[];
  t: (key: string) => string;
  constraints: EmployeeConstraint[];
}) {
  // Check which day cells have constraint violations
  const dayConstraintFlags = useMemo(() => {
    return days.map((day) => {
      const dayDate = day.fullDate; // YYYY-MM-DD
      const jsDate = new Date(dayDate);
      const dayOfWeek = (jsDate.getDay() + 6) % 7; // Convert JS Sunday=0 to Monday=0

      return constraints.some(c => {
        if (c.constraint.type === "avoid_day" && c.constraint.dayOfWeek === dayOfWeek) return true;
        if (c.constraint.type === "avoid_date" && c.constraint.date === dayDate) return true;
        return false;
      });
    });
  }, [days, constraints]);

  // Check if there's a shift-kind violation for a given cell
  const shiftKindViolation = (shift: ShiftData) => {
    if (!shift.type) return false;
    const typeMap: Record<string, string> = { vroeg: "early", dag: "day", laat: "late", nacht: "night" };
    const kind = typeMap[shift.type];
    return constraints.some(c => c.constraint.type === "avoid_shift_kind" && c.constraint.shiftKind === kind);
  };

  return (
    <div
      className="grid border-b border-border/60 transition-colors hover:bg-accent/30"
      style={{
        gridTemplateColumns: `230px repeat(${numDays}, minmax(85px, 1fr))`,
      }}
    >
      <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 border-r">
        <div className="flex items-center">
          <p className="text-[13px] font-bold leading-snug truncate text-foreground">
            {emp.lastName}, <span className="font-medium">{emp.firstName}</span>
          </p>
          <ConstraintIcons constraints={constraints} />
        </div>
        {emp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {emp.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium leading-none">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {emp.shifts.map((shift, i) => {
        const hasDayViolation = dayConstraintFlags[i] && shift.type !== null;
        const hasShiftViolation = shiftKindViolation(shift);
        const hasViolation = hasDayViolation || hasShiftViolation;
        const violationStrength = constraints.find(c => {
          if (c.constraint.type === "avoid_day" && dayConstraintFlags[i]) return true;
          if (c.constraint.type === "avoid_date" && dayConstraintFlags[i]) return true;
          if (c.constraint.type === "avoid_shift_kind" && hasShiftViolation) return true;
          return false;
        })?.constraint.strength;

        return (
          <div
            key={i}
            className={`flex items-center justify-center px-0.5 py-0.5 border-r last:border-r-0 relative ${days[i]?.weekend ? "bg-weekend" : ""} ${hasViolation ? (violationStrength === "hard" ? "ring-2 ring-inset ring-destructive/50 bg-destructive/10" : "ring-2 ring-inset ring-kpi-unfilled/40 bg-kpi-unfilled/10") : ""}`}
          >
            <ShiftCell shift={shift} t={t} />
          </div>
        );
      })}
    </div>
  );
});

interface RosterGridProps {
  data?: RosterData;
}

export function RosterGrid({ data }: RosterGridProps) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const employees = data?.employees ?? [];
  const days = data?.days ?? [];
  const numDays = days.length;

  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 74,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  if (!data) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">{t("grid.noData", "Geen roosterdata beschikbaar")}</p>
      </div>
    );
  }

  const { demandMap, plannedByDay, assignedByDay } = data;

  const dayDemands = days.map((_, dayIdx) => {
    let total = 0;
    demandMap.forEach((dayArr) => { total += dayArr[dayIdx] || 0; });
    return total;
  });

  const dayFillRates = days.map((_, dayIdx) => {
    const filled = assignedByDay?.[dayIdx] ?? plannedByDay?.[dayIdx] ?? employees.filter(emp => emp.shifts[dayIdx]?.type !== null).length;
    const demandTarget = dayDemands[dayIdx];
    const target = demandTarget > 0 ? demandTarget : filled;
    return { filled, target, pct: target > 0 ? Math.round((filled / target) * 100) : 0 };
  });

  return (
    <div
      ref={parentRef}
      className="roster-scroll w-full max-w-full rounded-xl border border-border/50 bg-card shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]"
    >
      <div style={{ minWidth: `${220 + numDays * 90}px` }}>
        {/* Header */}
        <div
          className="sticky top-0 z-[5] grid border-b-2 border-border bg-card shadow-sm"
          style={{ gridTemplateColumns: `230px repeat(${numDays}, minmax(85px, 1fr))` }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-r">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("grid.employee")}</span>
          </div>
          {days.map((d, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-1 px-2 py-2 border-r last:border-r-0 ${d.weekend ? "bg-weekend" : ""}`}
            >
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-bold text-foreground leading-tight">{t(`days.${d.dayKey}`)}</span>
                <span className="text-[11px] font-medium text-muted-foreground">{d.date}</span>
              </div>
              <FillRateIndicator filled={dayFillRates[i].filled} target={dayFillRates[i].target} pct={dayFillRates[i].pct} />
            </div>
          ))}
        </div>

        {/* Virtualized rows */}
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const emp = employees[virtualRow.index];
            return (
              <div
                key={emp.id}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <EmployeeRow
                  emp={emp}
                  numDays={numDays}
                  days={days}
                  t={t}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}