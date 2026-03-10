import { TrendingUp, Users, AlertTriangle, HelpCircle, Clock } from "lucide-react";

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

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard
        label="Bezetting"
        value="79.7%"
        subtitle="1396 / 1751 slots"
        icon={<TrendingUp className="h-5 w-5" />}
        colorClass="text-kpi-occupancy"
        bgClass="bg-kpi-occupancy/10"
      />
      <KpiCard
        label="Toewijzingen"
        value="1396"
        subtitle="van 1751 slots"
        icon={<Users className="h-5 w-5" />}
        colorClass="text-kpi-assignments"
        bgClass="bg-kpi-assignments/10"
      />
      <KpiCard
        label="ATW Overtredingen"
        value="0"
        subtitle="✓ compliant"
        icon={<AlertTriangle className="h-5 w-5" />}
        colorClass="text-kpi-violations"
        bgClass="bg-kpi-violations/10"
      />
      <KpiCard
        label="Niet Ingevuld"
        value="53"
        subtitle="klik voor details"
        icon={<HelpCircle className="h-5 w-5" />}
        colorClass="text-kpi-unfilled"
        bgClass="bg-kpi-unfilled/10"
      />
      <KpiCard
        label="Rekentijd"
        value="20.6s"
        subtitle="solver tijd"
        icon={<Clock className="h-5 w-5" />}
        colorClass="text-kpi-time"
        bgClass="bg-kpi-time/10"
      />
    </div>
  );
}
