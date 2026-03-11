import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Users, TrendingUp, AlertTriangle, Clock, Target, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RosterData } from "@/lib/parseSolverResponse";

const CHART_COLORS = [
  "hsl(217, 91%, 53%)",
  "hsl(152, 60%, 46%)",
  "hsl(32, 95%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(190, 70%, 50%)",
];

function HeatmapCell({ value }: { value: number }) {
  let bg = "bg-destructive/20 text-destructive";
  if (value >= 80) bg = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  else if (value >= 60) bg = "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  else if (value > 0) bg = "bg-destructive/15 text-destructive";
  else bg = "bg-muted/50 text-muted-foreground";

  return (
    <td className={`px-2 py-1.5 text-center text-xs font-medium rounded ${bg}`}>
      {value > 0 ? `${value}%` : "—"}
    </td>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle: string; icon: any; color: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractDeltaBar({ naam, gepland, contract, delta }: {
  naam: string; gepland: number; contract: number; delta: number;
}) {
  const maxHours = Math.max(gepland, contract, 48) + 8;
  const contractPct = (contract / maxHours) * 100;
  const geplandPct = (gepland / maxHours) * 100;
  const overUnder = delta > 0 ? "text-destructive" : delta < 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[11px] text-foreground w-24 truncate" title={naam}>{naam}</span>
      <div className="flex-1 h-4 bg-muted/50 rounded-full relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-primary/30 rounded-full" style={{ width: `${contractPct}%` }} />
        <div
          className={`absolute top-0 left-0 h-full rounded-full ${
            delta > 0 ? "bg-destructive/60" : delta < 0 ? "bg-amber-500/60" : "bg-emerald-500/60"
          }`}
          style={{ width: `${geplandPct}%` }}
        />
        <div className="absolute top-0 h-full w-0.5 bg-foreground/40" style={{ left: `${contractPct}%` }} />
      </div>
      <span className={`text-[11px] font-semibold w-16 text-right ${overUnder}`}>
        {delta > 0 ? "+" : ""}{delta.toFixed(0)}u ({gepland.toFixed(0)}/{contract})
      </span>
    </div>
  );
}

// ── Compute stats from RosterData ──

function computeStats(data: RosterData, t: (key: string) => string) {
  const { days, employees } = data;
  const numDays = days.length;

  // Employee hours
  const employeeHours = employees.map((emp) => {
    // Parse hours string "X.X/Yu" to get planned and contract
    const match = emp.hours.match(/([\d.]+)\/([\d.]+)/);
    const gepland = match ? parseFloat(match[1]) : 0;
    const contract = match ? parseFloat(match[2]) : 48;
    const nameParts = emp.name.split(",");
    const shortName = nameParts.length >= 2
      ? `${nameParts[0].trim().charAt(0).toUpperCase()}${nameParts[0].trim().slice(1).toLowerCase()}, ${nameParts[1].trim().charAt(0).toUpperCase()}.`
      : emp.name;
    return { naam: shortName, gepland, contract, delta: gepland - contract };
  });

  const totalGepland = employeeHours.reduce((s, e) => s + e.gepland, 0);
  const totalContract = employeeHours.reduce((s, e) => s + e.contract, 0);
  const overEmployees = employeeHours.filter((e) => e.delta > 4).length;
  const underEmployees = employeeHours.filter((e) => e.delta < -8).length;
  const scheduledEmployees = employees.filter((e) => e.shifts.some((s) => s.type !== null)).length;

  // Daily fill rate based on actual demand
  const dailyFillRate = days.map((d, dayIdx) => {
    const filled = employees.filter((emp) => emp.shifts[dayIdx]?.type !== null).length;
    // Sum demand for this day across all shifts
    let dayDemand = 0;
    data.demandMap.forEach((dayDemands) => {
      dayDemand += dayDemands[dayIdx] || 0;
    });
    const target = dayDemand > 0 ? dayDemand : filled; // fallback
    const pct = target > 0 ? Math.round((filled / target) * 100) : 0;
    return { dag: t(`days.${d.dayKey}`), bezet: filled, target, pct };
  });

  const avgFillRate = dailyFillRate.length > 0
    ? Math.round(dailyFillRate.reduce((s, d) => s + d.pct, 0) / dailyFillRate.length)
    : 0;

  // Shift groups for heatmap
  const shiftLabels = new Set<string>();
  employees.forEach((emp) => emp.shifts.forEach((s) => { if (s.label) shiftLabels.add(s.label); }));

  const dayLabels = days.map((d) => t(`days.${d.dayKey}`));
  const heatmapData = Array.from(shiftLabels).map((label) => {
    const row: Record<string, any> = { dienst: label };
    const demands = data.demandMap.get(label);
    days.forEach((d, dayIdx) => {
      const dayLabel = t(`days.${d.dayKey}`);
      const target = demands ? demands[dayIdx] : 0;
      const filled = employees.filter((emp) => emp.shifts[dayIdx]?.label === label).length;
      row[dayLabel] = target > 0 ? Math.round((filled / target) * 100) : 0;
    });
    return row;
  });

  // Shift type distribution
  const shiftTypeCounts: Record<string, number> = { vroeg: 0, dag: 0, laat: 0, nacht: 0 };
  employees.forEach((emp) => emp.shifts.forEach((s) => { if (s.type) shiftTypeCounts[s.type]++; }));
  const totalShifts = Object.values(shiftTypeCounts).reduce((a, b) => a + b, 0);
  const shiftDistribution = [
    { shift: t("grid.early"), value: totalShifts > 0 ? Math.round((shiftTypeCounts.vroeg / totalShifts) * 100) : 0 },
    { shift: t("grid.day"), value: totalShifts > 0 ? Math.round((shiftTypeCounts.dag / totalShifts) * 100) : 0 },
    { shift: t("grid.late"), value: totalShifts > 0 ? Math.round((shiftTypeCounts.laat / totalShifts) * 100) : 0 },
    { shift: t("grid.night"), value: totalShifts > 0 ? Math.round((shiftTypeCounts.nacht / totalShifts) * 100) : 0 },
  ];

  // Qualification distribution
  const qualCounts: Record<string, number> = {};
  employees.forEach((emp) => {
    const quals = emp.tags.filter((t) => !["Own Employee", "Flex", "Temp"].includes(t));
    if (quals.length === 0) {
      qualCounts[t("stats.noQualification")] = (qualCounts[t("stats.noQualification")] || 0) + 1;
    } else {
      quals.forEach((q) => { qualCounts[q] = (qualCounts[q] || 0) + 1; });
    }
  });
  const totalQuals = Object.values(qualCounts).reduce((a, b) => a + b, 0);
  const qualificationData = Object.entries(qualCounts).map(([name, count]) => ({
    name,
    value: totalQuals > 0 ? Math.round((count / totalQuals) * 100) : 0,
  }));

  // Weekend vs weekday using actual demand
  const weekdayDays = days.filter((d) => !d.weekend);
  const weekendDays = days.filter((d) => d.weekend);

  const computeDayGroupStats = (daySubset: DayColumn[]) => {
    let filled = 0;
    let demand = 0;
    for (const d of daySubset) {
      const dayIdx = days.indexOf(d);
      filled += employees.filter((emp) => emp.shifts[dayIdx]?.type !== null).length;
      data.demandMap.forEach((dayDemands) => {
        demand += dayDemands[dayIdx] || 0;
      });
    }
    return { filled, demand };
  };

  const weekdayStats = computeDayGroupStats(weekdayDays);
  const weekendStats = computeDayGroupStats(weekendDays);

  const weekdayWeekend = [
    { type: t("stats.weekday"), bezetting: weekdayStats.demand > 0 ? Math.round((weekdayStats.filled / weekdayStats.demand) * 100) : 0, uren: Math.round(weekdayStats.filled * 8) },
    { type: t("stats.weekend"), bezetting: weekendStats.demand > 0 ? Math.round((weekendStats.filled / weekendStats.demand) * 100) : 0, uren: Math.round(weekendStats.filled * 8) },
  ];

  return {
    employeeHours,
    totalGepland,
    totalContract,
    overEmployees,
    underEmployees,
    scheduledEmployees,
    dailyFillRate,
    avgFillRate,
    heatmapData,
    dayLabels,
    shiftDistribution,
    qualificationData,
    weekdayWeekend,
    shiftTypeCount: shiftLabels.size,
  };
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

interface StatsDashboardProps {
  data?: RosterData;
}

export function StatsDashboard({ data }: StatsDashboardProps) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">{t("grid.noData", "Geen data beschikbaar")}</p>
      </div>
    );
  }

  const stats = computeStats(data, t);

  return (
    <div className="space-y-5">
      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard
          title={t("stats.avgFillRate")}
          value={`${stats.avgFillRate}%`}
          subtitle={t("stats.over7days")}
          icon={Target}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title={t("stats.totalPlannedHours")}
          value={`${Math.round(stats.totalGepland)}u`}
          subtitle={t("stats.ofContract", { count: Math.round(stats.totalContract) })}
          icon={Clock}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title={t("stats.overloaded")}
          value={`${stats.overEmployees}`}
          subtitle={t("stats.overloadedSub")}
          icon={AlertTriangle}
          color="bg-destructive/10 text-destructive"
        />
        <StatCard
          title={t("stats.underloaded")}
          value={`${stats.underEmployees}`}
          subtitle={t("stats.underloadedSub")}
          icon={TrendingUp}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title={t("stats.employeesScheduled")}
          value={`${stats.scheduledEmployees}`}
          subtitle={t("stats.scheduledThisWeek")}
          icon={Users}
          color="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          title={t("stats.shiftsLabel")}
          value={`${stats.shiftTypeCount}`}
          subtitle={t("stats.activeShiftTypes")}
          icon={BarChart3}
          color="bg-blue-500/10 text-blue-600"
        />
      </div>

      {/* ── Row 1: Fill Rate + Heatmap ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("stats.occupancyPerDay")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.dailyFillRate} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="dag" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, t("stats.fillRate")]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} fill="hsl(217, 91%, 53%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("stats.occupancyHeatmap")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 px-2 text-muted-foreground font-medium">{t("json.shift")}</th>
                  {stats.dayLabels.map((d) => (
                    <th key={d} className="text-center py-1 px-2 text-muted-foreground font-medium">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.heatmapData.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-2 font-medium text-foreground whitespace-nowrap">{row.dienst}</td>
                    {stats.dayLabels.map((d) => (
                      <HeatmapCell key={d} value={(row as any)[d]} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Contract Uren ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">{t("stats.plannedVsContract")}</CardTitle>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary/30" /> {t("stats.contractLegend")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/60" /> {t("stats.plannedOk")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-destructive/60" /> {t("stats.overloadedLegend")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500/60" /> {t("stats.underloadedLegend")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 max-h-[320px] overflow-y-auto roster-scroll">
            {stats.employeeHours
              .sort((a, b) => a.delta - b.delta)
              .map((e, i) => (
                <ContractDeltaBar key={i} {...e} />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Row 3: Kwalificaties + Dienst spreiding ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("stats.qualificationDist")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.qualificationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {stats.qualificationData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("stats.shiftSpread")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={stats.shiftDistribution}>
                <PolarGrid stroke="hsl(220,15%,85%)" />
                <PolarAngleAxis dataKey="shift" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="hsl(217,91%,53%)" fill="hsl(217,91%,53%)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("stats.weekendVsWeekday")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.weekdayWeekend} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="bezetting" name={t("stats.occupancyPct")} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="uren" name={t("grid.hours")} fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
