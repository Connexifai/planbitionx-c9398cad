import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import { Users, TrendingUp, AlertTriangle, Clock, Target, BarChart3 } from "lucide-react";

// ── Mock data derived from roster ──────────────────────────────────────────────

const SHIFT_COLORS = {
  early: "hsl(152, 60%, 46%)",
  day: "hsl(32, 95%, 55%)",
  late: "hsl(217, 75%, 55%)",
  night: "hsl(270, 60%, 55%)",
};

const CHART_COLORS = [
  "hsl(217, 91%, 53%)",
  "hsl(152, 60%, 46%)",
  "hsl(32, 95%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(190, 70%, 50%)",
];

// Fill rate per dag
const dailyFillRate = [
  { dag: "Ma", bezet: 18, target: 25, pct: 72 },
  { dag: "Di", bezet: 20, target: 25, pct: 80 },
  { dag: "Wo", bezet: 22, target: 25, pct: 88 },
  { dag: "Do", bezet: 21, target: 25, pct: 84 },
  { dag: "Vr", bezet: 19, target: 25, pct: 76 },
  { dag: "Za", bezet: 12, target: 25, pct: 48 },
  { dag: "Zo", bezet: 2, target: 25, pct: 8 },
];

// Fill rate per dienst per dag (heatmap data)
const heatmapData = [
  { dienst: "Early pick", Ma: 85, Di: 80, Wo: 75, Do: 90, Vr: 80, Za: 60, Zo: 0 },
  { dienst: "Day Pick", Ma: 70, Di: 75, Wo: 80, Do: 85, Vr: 70, Za: 50, Zo: 40 },
  { dienst: "Late pick", Ma: 90, Di: 85, Wo: 80, Do: 75, Vr: 65, Za: 0, Zo: 0 },
  { dienst: "Late pack", Ma: 95, Di: 90, Wo: 90, Do: 85, Vr: 80, Za: 45, Zo: 0 },
  { dienst: "Night Pick", Ma: 80, Di: 80, Wo: 80, Do: 80, Vr: 80, Za: 60, Zo: 0 },
  { dienst: "Night Pack", Ma: 0, Di: 0, Wo: 60, Do: 60, Vr: 60, Za: 0, Zo: 0 },
];

// Uren per medewerker vs contract
const employeeHours = [
  { naam: "Bachmann, F.", gepland: 48, contract: 40, delta: 8 },
  { naam: "Bly, L.", gepland: 40, contract: 40, delta: 0 },
  { naam: "Angius, B.", gepland: 44, contract: 38, delta: 6 },
  { naam: "Ankrett, E.", gepland: 48, contract: 40, delta: 8 },
  { naam: "Grenier, B.", gepland: 48, contract: 40, delta: 8 },
  { naam: "Poucke, M.", gepland: 18, contract: 32, delta: -14 },
  { naam: "Sarcy, C.", gepland: 8, contract: 24, delta: -16 },
  { naam: "Sarpaux, T.", gepland: 32, contract: 38, delta: -6 },
  { naam: "Bouchard, P.", gepland: 45, contract: 40, delta: 5 },
  { naam: "Delacroix, M.", gepland: 24, contract: 38, delta: -14 },
  { naam: "Fernandez, C.", gepland: 24, contract: 40, delta: -16 },
  { naam: "Janssen, E.", gepland: 32, contract: 38, delta: -6 },
  { naam: "Kowalski, A.", gepland: 40, contract: 40, delta: 0 },
  { naam: "Martin, S.", gepland: 26, contract: 32, delta: -6 },
  { naam: "Nguyen, T.", gepland: 24, contract: 38, delta: -14 },
  { naam: "Petit, L.", gepland: 24, contract: 40, delta: -16 },
  { naam: "Rousseau, C.", gepland: 32, contract: 38, delta: -6 },
  { naam: "Heloise, H.", gepland: 48, contract: 40, delta: 8 },
  { naam: "Sede, A.", gepland: 32, contract: 38, delta: -6 },
  { naam: "Semaille, L.", gepland: 48, contract: 40, delta: 8 },
  { naam: "Senechal, L.", gepland: 40, contract: 40, delta: 0 },
  { naam: "Seraiche, N.", gepland: 48, contract: 40, delta: 8 },
  { naam: "Sillah, M.", gepland: 34, contract: 38, delta: -4 },
  { naam: "Taisne, A.", gepland: 45, contract: 40, delta: 5 },
  { naam: "Tallout, M.", gepland: 16, contract: 32, delta: -16 },
  { naam: "Tarrade, L.", gepland: 32, contract: 38, delta: -6 },
];

// Dienst spreiding radar (gemiddelde verdeling over medewerkers)
const shiftDistribution = [
  { shift: "Vroeg", value: 28 },
  { shift: "Dag", value: 22 },
  { shift: "Laat", value: 35 },
  { shift: "Nacht", value: 15 },
];

// Pick vs Pack verdeling
const qualificationData = [
  { name: "Pick", value: 62 },
  { name: "Pack", value: 30 },
  { name: "Geen kwalificatie", value: 8 },
];

// Week trend
const weekTrend = [
  { week: "Wk 8", fillRate: 68, uren: 780, kosten: 14200 },
  { week: "Wk 9", fillRate: 72, uren: 810, kosten: 14800 },
  { week: "Wk 10", fillRate: 75, uren: 845, kosten: 15300 },
  { week: "Wk 11", fillRate: 78, uren: 860, kosten: 15600 },
];

// Weekend vs doordeweeks
const weekdayWeekend = [
  { type: "Doordeweeks", bezetting: 82, uren: 680 },
  { type: "Weekend", bezetting: 38, uren: 165 },
];

// ── Helper components ──────────────────────────────────────────────────────────

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
  const maxHours = 56;
  const contractPct = (contract / maxHours) * 100;
  const geplandPct = (gepland / maxHours) * 100;
  const overUnder = delta > 0 ? "text-destructive" : delta < 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[11px] text-foreground w-24 truncate" title={naam}>{naam}</span>
      <div className="flex-1 h-4 bg-muted/50 rounded-full relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary/30 rounded-full"
          style={{ width: `${contractPct}%` }}
        />
        <div
          className={`absolute top-0 left-0 h-full rounded-full ${
            delta > 0 ? "bg-destructive/60" : delta < 0 ? "bg-amber-500/60" : "bg-emerald-500/60"
          }`}
          style={{ width: `${geplandPct}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/40"
          style={{ left: `${contractPct}%` }}
        />
      </div>
      <span className={`text-[11px] font-semibold w-16 text-right ${overUnder}`}>
        {delta > 0 ? "+" : ""}{delta}u ({gepland}/{contract})
      </span>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function StatsDashboard() {
  const totalGepland = employeeHours.reduce((s, e) => s + e.gepland, 0);
  const totalContract = employeeHours.reduce((s, e) => s + e.contract, 0);
  const avgFillRate = Math.round(dailyFillRate.reduce((s, d) => s + d.pct, 0) / dailyFillRate.length);
  const overEmployees = employeeHours.filter(e => e.delta > 4).length;
  const underEmployees = employeeHours.filter(e => e.delta < -8).length;

  return (
    <div className="space-y-5">
      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard
          title="Gem. Fill Rate"
          value={`${avgFillRate}%`}
          subtitle="Over 7 dagen"
          icon={Target}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title="Totaal Geplande Uren"
          value={`${totalGepland}u`}
          subtitle={`van ${totalContract}u contract`}
          icon={Clock}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Overbelast"
          value={`${overEmployees}`}
          subtitle="medewerkers >4u boven contract"
          icon={AlertTriangle}
          color="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Onderbelast"
          value={`${underEmployees}`}
          subtitle="medewerkers >8u onder contract"
          icon={TrendingUp}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Medewerkers"
          value={`${employeeHours.length}`}
          subtitle="Ingepland deze week"
          icon={Users}
          color="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          title="Diensten"
          value="6"
          subtitle="Actieve shift-types"
          icon={BarChart3}
          color="bg-blue-500/10 text-blue-600"
        />
      </div>

      {/* ── Row 1: Fill Rate + Heatmap ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Fill Rate per dag */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Bezetting per dag</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyFillRate} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="dag" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Fill Rate"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} fill="hsl(217, 91%, 53%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Onderbezetting heatmap */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Bezetting per dienst (heatmap)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 px-2 text-muted-foreground font-medium">Dienst</th>
                  {["Ma","Di","Wo","Do","Vr","Za","Zo"].map(d => (
                    <th key={d} className="text-center py-1 px-2 text-muted-foreground font-medium">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-2 font-medium text-foreground whitespace-nowrap">{row.dienst}</td>
                    {["Ma","Di","Wo","Do","Vr","Za","Zo"].map(d => (
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
            <CardTitle className="text-sm font-semibold">Geplande uren vs. contract uren per medewerker</CardTitle>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary/30" /> Contract
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/60" /> Gepland (OK)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-destructive/60" /> Overbelast
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500/60" /> Onderbelast
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 max-h-[320px] overflow-y-auto roster-scroll">
            {employeeHours
              .sort((a, b) => a.delta - b.delta)
              .map((e, i) => (
                <ContractDeltaBar key={i} {...e} />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Row 3: Kwalificaties + Dienst spreiding ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pick vs Pack */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Kwalificatieverdeling</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={qualificationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {qualificationData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dienst spreiding radar */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Dienstspreiding</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={shiftDistribution}>
                <PolarGrid stroke="hsl(220,15%,85%)" />
                <PolarAngleAxis dataKey="shift" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="hsl(217,91%,53%)" fill="hsl(217,91%,53%)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekend vs doordeweeks */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Weekend vs. doordeweeks</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekdayWeekend} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="bezetting" name="Bezetting %" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="uren" name="Uren" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Trends ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Fill rate trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Fill rate trend (per week)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weekTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[50, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="fillRate" name="Fill Rate %" stroke="hsl(217,91%,53%)" fill="hsl(217,91%,53%)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Kosten trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Geschatte loonkosten per week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(1)}k`} />
                <Tooltip
                  formatter={(value: number) => [`€${value.toLocaleString()}`, "Kosten"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="kosten" name="Loonkosten" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="uren" name="Uren" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
