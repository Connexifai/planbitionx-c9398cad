import { TrendingUp, Users, AlertTriangle, HelpCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

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

export function KpiCards({ solved = false }: { solved?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard label={t("kpi.occupancy")} value={solved ? "79.7%" : "0%"} subtitle={solved ? "1396 / 1751 slots" : "—"} icon={<TrendingUp className="h-5 w-5" />} colorClass="text-kpi-occupancy" bgClass="bg-kpi-occupancy/10" />
      <KpiCard label={t("kpi.assignments")} value={solved ? "1396" : "0"} subtitle={solved ? t("kpi.ofSlots", { count: 1751 }) : "—"} icon={<Users className="h-5 w-5" />} colorClass="text-kpi-assignments" bgClass="bg-kpi-assignments/10" />
      <KpiCard label={t("kpi.atwViolations")} value="0" subtitle={solved ? t("kpi.compliant") : "—"} icon={<AlertTriangle className="h-5 w-5" />} colorClass="text-kpi-violations" bgClass="bg-kpi-violations/10" />
      <KpiCard label={t("kpi.unfilled")} value={solved ? "53" : "0"} subtitle={solved ? t("kpi.clickDetails") : "—"} icon={<HelpCircle className="h-5 w-5" />} colorClass="text-kpi-unfilled" bgClass="bg-kpi-unfilled/10" />
      <KpiCard label={t("kpi.solveTime")} value={solved ? "20.6s" : "0s"} subtitle={solved ? t("kpi.solverTime") : "—"} icon={<Clock className="h-5 w-5" />} colorClass="text-kpi-time" bgClass="bg-kpi-time/10" />
    </div>
  );
}
