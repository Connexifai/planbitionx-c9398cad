import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, memo, useCallback } from "react";
import type { RosterData, ShiftData, DayColumn, RosterEmployee, DemandMap } from "@/lib/parseSolverResponse";

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
  const color = pct >= 80 ? "text-kpi-assignments" : pct >= 50 ? "text-kpi-unfilled" : "text-destructive";
  return (
    <span className={`text-[10px] font-semibold ${color}`}>{filled}/{target} · {pct}%</span>
  );
}

const ROW_HEIGHT = 100;

const EmployeeRow = memo(function EmployeeRow({
  emp,
  rowIdx,
  numDays,
  days,
  t,
}: {
  emp: RosterEmployee;
  rowIdx: number;
  numDays: number;
  days: DayColumn[];
  t: (key: string) => string;
}) {
  return (
    <div
      className="grid border-b border-border/60 transition-colors hover:bg-accent/30"
      style={{
        gridTemplateColumns: `230px repeat(${numDays}, minmax(85px, 1fr))`,
        height: ROW_HEIGHT,
      }}
    >
      <div className="flex flex-col justify-center gap-1 px-4 py-2.5 border-r">
        <p className="text-[13px] font-semibold leading-tight truncate">
          {emp.lastName}, <span className="font-normal">{emp.firstName}</span>
        </p>
        {emp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {emp.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium tabular-nums">{emp.hours}</span>
          <HoursBar percent={emp.hoursPercent} />
        </div>
      </div>

      {emp.shifts.map((shift, i) => (
        <div
          key={i}
          className={`flex items-center justify-center px-1 py-2 border-r last:border-r-0 ${days[i]?.weekend ? "bg-weekend" : ""}`}
        >
          <ShiftCell shift={shift} t={t} />
        </div>
      ))}
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
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
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
          className="sticky top-0 z-[5] grid border-b bg-card shadow-sm"
          style={{ gridTemplateColumns: `230px repeat(${numDays}, minmax(85px, 1fr))` }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-r">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("grid.employee")}</span>
          </div>
          {days.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-2.5 text-center border-r last:border-r-0 ${d.weekend ? "bg-weekend" : ""}`}
            >
              <span className="text-xs font-semibold text-foreground">{t(`days.${d.dayKey}`)}</span>
              <span className="text-[10px] text-muted-foreground">{d.date}</span>
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
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <EmployeeRow
                  emp={emp}
                  rowIdx={virtualRow.index}
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