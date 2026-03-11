import { useTranslation } from "react-i18next";
import { toTitleCase } from "@/lib/utils";
import type { RosterData, ShiftData, DayColumn, RosterEmployee, DemandMap } from "@/lib/parseSolverResponse";

type ShiftType = "vroeg" | "dag" | "laat" | "nacht" | null;

const shiftClassMap: Record<string, string> = {
  vroeg: "shift-early",
  dag: "shift-day",
  laat: "shift-late",
  nacht: "shift-night",
};

interface ShiftGroup {
  label: string;
  type: ShiftType;
  time: string;
}

function deriveShiftGroups(data: RosterData): ShiftGroup[] {
  const groupMap = new Map<string, ShiftGroup>();

  for (const emp of data.employees) {
    for (const shift of emp.shifts) {
      if (!shift.type || !shift.label) continue;
      const key = `${shift.label}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          label: shift.label,
          type: shift.type,
          time: shift.time || "",
        });
      }
    }
  }

  const typeOrder: Record<string, number> = { vroeg: 0, dag: 1, laat: 2, nacht: 3 };
  return Array.from(groupMap.values()).sort((a, b) => {
    const oa = typeOrder[a.type || ""] ?? 9;
    const ob = typeOrder[b.type || ""] ?? 9;
    if (oa !== ob) return oa - ob;
    return a.label.localeCompare(b.label);
  });
}

function getDemand(demandMap: DemandMap, label: string, dayIdx: number): number {
  const arr = demandMap.get(label);
  return arr ? arr[dayIdx] : 0;
}

function CountBadge({ count, target }: { count: number; target: number }) {
  if (target === 0 && count === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const effective = target > 0 ? target : count;
  const full = count >= effective;
  const color = full
    ? "text-kpi-assignments"
    : count >= effective * 0.6
    ? "text-kpi-unfilled"
    : "text-destructive";
  return (
    <span className={`text-xs font-bold ${color}`}>
      {count}/{target}
    </span>
  );
}

function DayFillRate({ filled, totalTarget }: { filled: number; totalTarget: number }) {
  if (totalTarget === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = Math.round((filled / totalTarget) * 100);
  const color = pct >= 75 ? "text-kpi-assignments" : pct >= 50 ? "text-kpi-unfilled" : "text-destructive";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {filled}/{totalTarget} · {pct}%
    </span>
  );
}

interface ServiceRosterGridProps {
  data?: RosterData;
}

export function ServiceRosterGrid({ data }: ServiceRosterGridProps) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">{t("grid.noData", "Geen roosterdata beschikbaar")}</p>
      </div>
    );
  }

  const { days, employees, demandMap } = data;
  const shiftGroups = deriveShiftGroups(data);

  const shiftTypeLabel: Record<string, string> = {
    vroeg: t("grid.early"),
    dag: t("grid.day"),
    laat: t("grid.late"),
    nacht: t("grid.night"),
  };

  return (
    <div className="roster-scroll w-full max-w-full rounded-xl border border-border/50 bg-card shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
      <table style={{ minWidth: `${180 + days.length * 140}px` }} className="w-full border-collapse">
        <thead>
          <tr className="sticky top-0 z-[5]">
            <th className="sticky left-0 z-[6] bg-card border-b border-r w-[180px] min-w-[180px]" />
            {days.map((d, i) => {
              const dayTotalDemand = shiftGroups.reduce((s, g) => s + getDemand(demandMap, g.label, i), 0);
              const dayFilled = shiftGroups.reduce((s, g) => {
                return s + employees.filter((emp) => {
                  const sh = emp.shifts[i];
                  return sh && sh.type === g.type && sh.label === g.label;
                }).length;
              }, 0);
              return (
                <th
                  key={i}
                  className={`border-b border-r last:border-r-0 py-3 px-2 bg-card shadow-sm ${
                    d.weekend ? "bg-weekend" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-bold text-foreground">{t(`days.${d.dayKey}`)}</span>
                    <span className="text-[11px] text-muted-foreground">{d.date}</span>
                    <DayFillRate filled={dayFilled} totalTarget={dayTotalDemand} />
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {shiftGroups.map((group, gIdx) => (
            <tr key={gIdx} className="border-b last:border-b-0">
              <td className="sticky left-0 z-[3] bg-card border-r w-[180px] min-w-[180px] px-3 py-3 align-top">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-foreground">{group.label}</span>
                  <div className={`shift-badge ${shiftClassMap[group.type!]} text-[10px] px-2 py-0.5 w-fit`}>
                    {shiftTypeLabel[group.type!]}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{group.time}</span>
                </div>
              </td>
              {days.map((d, dayIdx) => {
                const target = getDemand(demandMap, group.label, dayIdx);
                const emps = employees
                  .filter((emp) => {
                    const s = emp.shifts[dayIdx];
                    return s && s.type === group.type && s.label === group.label;
                  })
                  .map((emp) => emp.name);
                return (
                  <td
                    key={dayIdx}
                    className={`border-r last:border-r-0 px-3 py-2 align-top ${
                      d.weekend ? "bg-weekend" : ""
                    }`}
                  >
                    <div className="mb-1">
                      <CountBadge count={emps.length} target={target} />
                    </div>
                    {emps.map((name, nIdx) => (
                      <div
                        key={nIdx}
                        className="text-[12px] leading-relaxed text-foreground py-0.5 truncate hover:text-primary transition-colors cursor-default"
                      >
                        {toTitleCase(name)}
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
