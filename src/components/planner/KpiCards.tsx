import { TrendingUp, Users, AlertTriangle, HelpCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RosterData } from "@/lib/parseSolverResponse";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

const KpiCard = ({ label, value, subtitle, icon, colorClass, bgClass }: KpiCardProps) => (
  <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-sm border border-border/50">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
      <span className={colorClass}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
  </div>
);

interface KpiCardsProps {
  solved?: boolean;
  data?: RosterData;
  solveTime?: number;
}

export function KpiCards({ solved = false, data, solveTime }: KpiCardsProps) {
  const { t } = useTranslation();

  // Compute stats from data
  let totalSlots = 0;
  let filledSlots = 0;
  let occupancyPct = "0%";
  let unfilledCount = 0;

  if (solved && data) {
    const numDays = data.days.length;
    totalSlots = data.employees.length * numDays;
    filledSlots = data.employees.reduce(
      (sum, emp) => sum + emp.shifts.filter((s) => s.type !== null).length,
      0
    );
    unfilledCount = totalSlots - filledSlots;
    occupancyPct = totalSlots > 0 ? `${((filledSlots / totalSlots) * 100).toFixed(1)}%` : "0%";
  }

  const timeStr = solveTime ? `${(solveTime / 1000).toFixed(1)}s` : "0s";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard label={t("kpi.occupancy")} value={solved ? occupancyPct : "0%"} subtitle={solved ? `${filledSlots} / ${totalSlots} slots` : "—"} icon={<TrendingUp className="h-5 w-5" />} colorClass="text-kpi-occupancy" bgClass="bg-kpi-occupancy/10" />
      <KpiCard label={t("kpi.assignments")} value={solved ? filledSlots : "0"} subtitle={solved ? t("kpi.ofSlots", { count: totalSlots }) : "—"} icon={<Users className="h-5 w-5" />} colorClass="text-kpi-assignments" bgClass="bg-kpi-assignments/10" />
      <KpiCard label={t("kpi.atwViolations")} value="0" subtitle={solved ? t("kpi.compliant") : "—"} icon={<AlertTriangle className="h-5 w-5" />} colorClass="text-kpi-violations" bgClass="bg-kpi-violations/10" />
      <KpiCard label={t("kpi.unfilled")} value={solved ? unfilledCount : "0"} subtitle={solved ? t("kpi.clickDetails") : "—"} icon={<HelpCircle className="h-5 w-5" />} colorClass="text-kpi-unfilled" bgClass="bg-kpi-unfilled/10" />
      <KpiCard label={t("kpi.solveTime")} value={solved ? timeStr : "0s"} subtitle={solved ? t("kpi.solverTime") : "—"} icon={<Clock className="h-5 w-5" />} colorClass="text-kpi-time" bgClass="bg-kpi-time/10" />
    </div>
  );
}
