import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, memo, useMemo, useEffect, useCallback } from "react";
import { Ban, ShieldAlert } from "lucide-react";
import type { RosterData, ShiftData, DayColumn, RosterEmployee, DemandMap } from "@/lib/parseSolverResponse";
import type { EmployeeConstraint } from "@/components/planner/AiBriefingChat";
import type { RosterAnimationState } from "@/hooks/useRosterAnimation";

type ShiftType = "vroeg" | "dag" | "laat" | "nacht" | null;

const shiftClassMap: Record<string, string> = {
  vroeg: "shift-early",
  dag: "shift-day",
  laat: "shift-late",
  nacht: "shift-night",
};

const dayNames = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const shiftKindLabels: Record<string, string> = { early: "Vroeg", day: "Dag", late: "Laat", night: "Nacht" };

function ViolationIcon({ strength }: { strength: "hard" | "soft" }) {
  if (strength === "hard") {
    return <Ban className="h-3 w-3 text-destructive shrink-0" />;
  }
  return <ShieldAlert className="h-3 w-3 text-kpi-unfilled shrink-0" />;
}

interface ShiftCellProps {
  shift: ShiftData;
  t: (key: string) => string;
  violationStrength?: "hard" | "soft";
  constraints: EmployeeConstraint[];
}

const ShiftCell = memo(function ShiftCell({ shift, t, violationStrength, constraints }: ShiftCellProps) {
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

  const tooltipLines = constraints.map(c => {
    const str = c.constraint.strength === "hard" ? "🚫" : "⚠️";
    if (c.constraint.type === "avoid_day") return `${str} ${dayNames[c.constraint.dayOfWeek ?? 0]}`;
    if (c.constraint.type === "avoid_shift_kind") return `${str} ${shiftKindLabels[c.constraint.shiftKind ?? ""] || c.constraint.shiftKind}`;
    if (c.constraint.type === "avoid_date") return `${str} ${c.constraint.date}`;
    return str;
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`shift-badge ${cls} cursor-default flex-col items-start w-full gap-0.5 relative`}>
          {violationStrength && (
            <div className="absolute top-0.5 right-0.5 z-10">
              <ViolationIcon strength={violationStrength} />
            </div>
          )}
          <span className="font-semibold capitalize text-[13px] tracking-tight">
            {shiftTypeLabel[shift.type]}{role && <span className="opacity-70 font-medium"> [{role}]</span>}
          </span>
          <span className="text-[12px] opacity-90 font-medium">{shift.time}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-medium">{shift.label}</p>
        <p className="text-xs text-muted-foreground">{shift.time}</p>
        {tooltipLines.length > 0 && (
          <>
            <div className="my-1 border-t border-border" />
            <p className="text-xs font-semibold mb-1">Constraints:</p>
            {tooltipLines.map((line, i) => (
              <p key={i} className="text-xs">{line}</p>
            ))}
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
});

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

const EmployeeRow = memo(function EmployeeRow({
  emp,
  numDays,
  days,
  t,
  constraints,
  isPickupRow,
  pickupDayDate,
  isLandingRow,
  landingDayDate,
}: {
  emp: RosterEmployee;
  numDays: number;
  days: DayColumn[];
  t: (key: string) => string;
  constraints: EmployeeConstraint[];
  isPickupRow?: boolean;
  pickupDayDate?: string;
  isLandingRow?: boolean;
  landingDayDate?: string;
}) {
  const dayConstraintFlags = useMemo(() => {
    return days.map((day) => {
      const dayDate = day.fullDate;
      const jsDate = new Date(dayDate);
      const dayOfWeek = (jsDate.getDay() + 6) % 7;
      return constraints.some(c => {
        if (c.constraint.type === "avoid_day" && c.constraint.dayOfWeek === dayOfWeek) return true;
        if (c.constraint.type === "avoid_date" && c.constraint.date === dayDate) return true;
        return false;
      });
    });
  }, [days, constraints]);

  return (
    <div
      className={cn(
        "grid border-b border-border/60 transition-colors hover:bg-accent/30",
        isPickupRow && "bg-destructive/5",
        isLandingRow && "bg-primary/5",
      )}
      style={{
        gridTemplateColumns: `230px repeat(${numDays}, minmax(85px, 1fr))`,
      }}
    >
      <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 border-r sticky left-0 z-[2] bg-card">
        <div className="flex items-center">
          <p className="text-[13px] font-bold leading-snug truncate text-foreground">
            {emp.lastName}, <span className="font-medium">{emp.firstName}</span>
          </p>
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
        const dayDate = days[i]?.fullDate;
        const jsDate = dayDate ? new Date(dayDate) : null;
        const dayOfWeek = jsDate ? (jsDate.getDay() + 6) % 7 : -1;
        const typeMap: Record<string, string> = { vroeg: "early", dag: "day", laat: "late", nacht: "night" };
        const shiftKind = shift.type ? typeMap[shift.type] : null;

        const cellConstraints = constraints.filter(c => {
          if (c.constraint.type === "avoid_day" && c.constraint.dayOfWeek === dayOfWeek) return true;
          if (c.constraint.type === "avoid_date" && c.constraint.date === dayDate) return true;
          if (c.constraint.type === "avoid_shift_kind" && shiftKind && c.constraint.shiftKind === shiftKind) return true;
          return false;
        });
        const hasConstraintOnCell = cellConstraints.length > 0;
        const cellStrength = cellConstraints.some(c => c.constraint.strength === "hard") ? "hard" as const
          : cellConstraints.length > 0 ? "soft" as const : undefined;
        const hasShiftAssigned = shift.type !== null;
        const showViolationRing = hasConstraintOnCell && hasShiftAssigned;

        const isBeingPickedUp = isPickupRow && pickupDayDate === dayDate;
        const isLandingTarget = isLandingRow && landingDayDate === dayDate;

        return (
          <div
            key={i}
            data-cell-id={`${emp.id}-${dayDate}`}
            className={cn(
              "flex items-center justify-center px-0.5 py-0.5 border-r last:border-r-0 relative transition-all duration-500",
              days[i]?.weekend && "bg-weekend",
              showViolationRing && (cellStrength === "hard" ? "ring-2 ring-inset ring-destructive/50 bg-destructive/10" : "ring-2 ring-inset ring-kpi-unfilled/40 bg-kpi-unfilled/10"),
              isBeingPickedUp && "roster-cell-pickup",
              isLandingTarget && "roster-cell-landing",
            )}
          >
            {hasConstraintOnCell && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-0.5 right-0.5 z-10">
                    <ViolationIcon strength={cellStrength || "soft"} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs font-semibold mb-1">Constraints:</p>
                  {cellConstraints.map((c, ci) => {
                    const str = c.constraint.strength === "hard" ? "🚫" : "⚠️";
                    let label = str;
                    if (c.constraint.type === "avoid_day") label = `${str} ${dayNames[c.constraint.dayOfWeek ?? 0]}`;
                    if (c.constraint.type === "avoid_shift_kind") label = `${str} ${shiftKindLabels[c.constraint.shiftKind ?? ""] || c.constraint.shiftKind}`;
                    if (c.constraint.type === "avoid_date") label = `${str} ${c.constraint.date}`;
                    return <p key={ci} className="text-xs">{label}</p>;
                  })}
                </TooltipContent>
              </Tooltip>
            )}
            <ShiftCell shift={shift} t={t} violationStrength={undefined} constraints={[]} />
          </div>
        );
      })}
    </div>
  );
});

interface RosterGridProps {
  data?: RosterData;
  employeeConstraints?: EmployeeConstraint[];
  animationState?: RosterAnimationState;
  onRegisterGridFns?: (fns: {
    scrollToEmployee: (empId: string) => Promise<void>;
    getCellRect: (empId: string, dayDate: string) => DOMRect | null;
    getCellHtml: (empId: string, dayDate: string) => string;
  }) => void;
}

export function RosterGrid({ data, employeeConstraints = [], animationState, onRegisterGridFns }: RosterGridProps) {
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

  // Register helper functions for the animation system
  const scrollToEmployee = useCallback(
    (empId: string): Promise<void> => {
      return new Promise((resolve) => {
        const empIdx = employees.findIndex((e) => String(e.id) === empId);
        if (empIdx >= 0) {
          rowVirtualizer.scrollToIndex(empIdx, { align: "center", behavior: "smooth" });
        }
        // Wait for scroll + virtualization to settle
        setTimeout(resolve, 350);
      });
    },
    [employees, rowVirtualizer]
  );

  const getCellRect = useCallback(
    (empId: string, dayDate: string): DOMRect | null => {
      if (!parentRef.current) return null;
      const el = parentRef.current.querySelector(`[data-cell-id="${empId}-${dayDate}"]`);
      return el ? el.getBoundingClientRect() : null;
    },
    []
  );

  const getCellHtml = useCallback(
    (empId: string, dayDate: string): string => {
      if (!parentRef.current) return "";
      const el = parentRef.current.querySelector(`[data-cell-id="${empId}-${dayDate}"]`);
      return el ? el.innerHTML : "";
    },
    []
  );

  useEffect(() => {
    onRegisterGridFns?.({ scrollToEmployee, getCellRect, getCellHtml });
  }, [onRegisterGridFns, scrollToEmployee, getCellRect, getCellHtml]);

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

  // Determine which cells are being animated
  const currentMove = animationState?.currentMove;
  const phase = animationState?.phase;
  const isPickupPhase = phase === "pickup" || phase === "flying";
  const isLandingPhase = phase === "landing";

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
          <div className="flex items-center gap-2 px-4 py-3 border-r sticky left-0 z-[6] bg-card">
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
            const empIdStr = String(emp.id);

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
                  constraints={employeeConstraints.filter(c => c.personId === emp.id)}
                  isPickupRow={isPickupPhase && currentMove?.source.employeeId === empIdStr}
                  pickupDayDate={isPickupPhase && currentMove?.source.employeeId === empIdStr ? currentMove.source.dayDate : undefined}
                  isLandingRow={isLandingPhase && currentMove?.target.employeeId === empIdStr}
                  landingDayDate={isLandingPhase && currentMove?.target.employeeId === empIdStr ? currentMove.target.dayDate : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
