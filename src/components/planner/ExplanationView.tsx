import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
  Users,
  ShieldCheck,
  Repeat,
  CalendarCheck,
  TrendingUp,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toTitleCase } from "@/lib/utils";
import type { RosterData, RosterEmployee, ShiftData } from "@/lib/parseSolverResponse";
import { useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SolverExplanation {
  EmployeeId: string;
  ShiftId: string;
  Reasons: string[];
}

interface SolverStatistics {
  ElapsedSeconds?: number;
  FillRatePercentage?: number;
  HardViolations?: number;
  TotalAssignments?: number;
  FairnessPenalty?: number;
  FairnessStats?: Record<string, { AssignedHours: number; Deviation: number; TargetHours: number }>;
  StoppedEarly?: boolean;
}

interface Reason {
  icon: React.ElementType;
  label: string;
  detail: string;
  weight: "high" | "medium" | "low";
}

interface EmployeeExplanation {
  name: string;
  id: string;
  reasons: Reason[];
  shiftCount: number;
}

// ── Map solver reasons to structured display ───────────────────────────────────

function classifyReason(text: string): { icon: React.ElementType; weight: "high" | "medium" | "low" } {
  const lower = text.toLowerCase();
  if (lower.includes("qualification")) return { icon: Star, weight: "high" };
  if (lower.includes("atw") || lower.includes("constraint") || lower.includes("violation")) return { icon: ShieldCheck, weight: "high" };
  if (lower.includes("fair") || lower.includes("workload") || lower.includes("distribution")) return { icon: TrendingUp, weight: "medium" };
  if (lower.includes("rest") || lower.includes("rust")) return { icon: Clock, weight: "medium" };
  if (lower.includes("rotation") || lower.includes("pattern")) return { icon: Repeat, weight: "medium" };
  if (lower.includes("contract") || lower.includes("hours") || lower.includes("uren")) return { icon: CalendarCheck, weight: "medium" };
  if (lower.includes("team") || lower.includes("employee")) return { icon: Users, weight: "low" };
  return { icon: Info, weight: "low" };
}

function buildFromSolverExplanations(
  solverExplanations: SolverExplanation[],
  data: RosterData
): EmployeeExplanation[] {
  // Group by EmployeeId
  const grouped = new Map<string, SolverExplanation[]>();
  for (const exp of solverExplanations) {
    if (!grouped.has(exp.EmployeeId)) grouped.set(exp.EmployeeId, []);
    grouped.get(exp.EmployeeId)!.push(exp);
  }

  const employeeMap = new Map(data.employees.map(e => [e.contractId, e]));

  const results: EmployeeExplanation[] = [];
  for (const [empId, explanations] of grouped) {
    const emp = employeeMap.get(empId);
    const name = emp ? `${emp.lastName}, ${emp.firstName}` : empId;

    // Deduplicate reasons across all shifts
    const uniqueReasons = new Set<string>();
    for (const exp of explanations) {
      for (const r of exp.Reasons) uniqueReasons.add(r);
    }

    const reasons: Reason[] = Array.from(uniqueReasons).map(text => {
      const { icon, weight } = classifyReason(text);
      return { icon, label: text.split(":")[0].trim(), detail: text, weight };
    });

    // Sort: high first, then medium, then low
    const weightOrder = { high: 0, medium: 1, low: 2 };
    reasons.sort((a, b) => weightOrder[a.weight] - weightOrder[b.weight]);

    results.push({
      name,
      id: empId,
      reasons,
      shiftCount: explanations.length,
    });
  }

  return results.sort((a, b) => b.shiftCount - a.shiftCount);
}

// ── Fallback: generate from roster data ────────────────────────────────────────

function generateFallbackExplanations(data: RosterData, t: (key: string) => string): EmployeeExplanation[] {
  const { days, employees } = data;
  const results: EmployeeExplanation[] = [];

  for (const emp of employees) {
    const assignedShifts = emp.shifts.filter(s => s.type !== null);
    if (assignedShifts.length === 0) continue;

    const reasons: Reason[] = [];

    const qualTags = emp.tags.filter(t => !["Own Employee", "Flex", "Temp"].includes(t));
    if (qualTags.length > 0) {
      reasons.push({ icon: Star, label: t("explanation.qualification"), detail: t("explanation.qualifiedFor") + ": " + qualTags.join(", "), weight: "high" });
    }

    const hoursMatch = emp.hours.match(/([\d.]+)\/([\d.]+)/);
    const planned = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    const contract = hoursMatch ? parseFloat(hoursMatch[2]) : 48;
    const delta = planned - contract;
    reasons.push({
      icon: CalendarCheck,
      label: t("explanation.contractHours"),
      detail: `${planned.toFixed(0)}u ${t("explanation.of")} ${contract}u — ${Math.abs(delta) <= 4 ? t("explanation.withinTarget") : delta > 0 ? t("explanation.overloaded") : t("explanation.underloaded")}`,
      weight: Math.abs(delta) > 4 ? "high" : "low",
    });

    const fillPct = Math.round((assignedShifts.length / days.length) * 100);
    reasons.push({
      icon: Clock,
      label: t("explanation.availability"),
      detail: `${assignedShifts.length}/${days.length} ${t("explanation.daysAssigned")} (${fillPct}%)`,
      weight: fillPct >= 60 ? "high" : "medium",
    });

    results.push({
      name: `${emp.lastName}, ${emp.firstName}`,
      id: emp.contractId,
      reasons,
      shiftCount: assignedShifts.length,
    });
  }

  return results.sort((a, b) => b.shiftCount - a.shiftCount).slice(0, 30);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const weightColor: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

// ── Statistics summary ─────────────────────────────────────────────────────────

function StatsSummary({ stats }: { stats: SolverStatistics }) {
  const { t } = useTranslation();
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2 bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground">{t("explanation.solverStats", "Solver Statistieken")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {stats.ElapsedSeconds !== undefined && (
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("explanation.solveTime", "Oplostijd")}</p>
                  <p className="text-sm font-bold">{stats.ElapsedSeconds.toFixed(1)}s</p>
                </div>
              )}
              {stats.FillRatePercentage !== undefined && (
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("explanation.fillRate", "Bezettingsgraad")}</p>
                  <p className="text-sm font-bold">{stats.FillRatePercentage}%</p>
                </div>
              )}
              {stats.TotalAssignments !== undefined && (
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("explanation.totalAssignments", "Toewijzingen")}</p>
                  <p className="text-sm font-bold">{stats.TotalAssignments}</p>
                </div>
              )}
              {stats.HardViolations !== undefined && (
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("explanation.hardViolations", "Harde overtredingen")}</p>
                  <p className={`text-sm font-bold ${stats.HardViolations > 0 ? "text-destructive" : "text-kpi-assignments"}`}>{stats.HardViolations}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export interface ExplanationViewProps {
  data?: RosterData;
  solverExplanations?: SolverExplanation[];
  solverStatistics?: SolverStatistics | null;
}

export function ExplanationView({ data, solverExplanations, solverStatistics }: ExplanationViewProps) {
  const { t } = useTranslation();

  const explanations = useMemo(() => {
    if (!data) return [];
    if (solverExplanations && solverExplanations.length > 0) {
      return buildFromSolverExplanations(solverExplanations, data);
    }
    return generateFallbackExplanations(data, t);
  }, [data, solverExplanations, t]);

  const hasSolverData = solverExplanations && solverExplanations.length > 0;

  const weightLabel: Record<string, string> = {
    high: t("explanation.decisive"),
    medium: t("explanation.considered"),
    low: t("explanation.additional"),
  };

  if (!data || explanations.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">{t("grid.noData", "Geen data beschikbaar")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Solver statistics */}
      {solverStatistics && <StatsSummary stats={solverStatistics} />}

      {/* Header */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{t("explanation.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasSolverData
                  ? t("explanation.solverDataAvailable", "Onderstaande uitleg komt direct van de solver engine.")
                  : <span dangerouslySetInnerHTML={{ __html: t("explanation.description") }} />
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        {Object.entries(weightLabel).map(([key, label]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${weightColor[key]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Explanations */}
      <ScrollArea className="max-h-[calc(100vh-380px)]">
        <Accordion type="multiple" defaultValue={explanations.length > 0 ? [explanations[0].id] : []} className="space-y-2">
          {explanations.map((emp) => (
            <AccordionItem
              key={emp.id}
              value={emp.id}
              className="border border-border/50 rounded-xl bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                    <span className="text-sm font-semibold text-foreground truncate">{toTitleCase(emp.name)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {emp.shiftCount} {t("explanation.shifts", "diensten")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{emp.reasons.length} {t("explanation.reasonCount", "redenen")}</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-2">
                  {emp.reasons.map((reason, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${weightColor[reason.weight]}`}
                    >
                      <reason.icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{reason.label}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-current/30">
                            {weightLabel[reason.weight]}
                          </Badge>
                        </div>
                        <p className="text-[11px] mt-0.5 opacity-80 leading-relaxed">{reason.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
