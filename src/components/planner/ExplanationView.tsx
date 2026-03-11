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
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toTitleCase } from "@/lib/utils";
import type { RosterData, RosterEmployee, ShiftData } from "@/lib/parseSolverResponse";
import { useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Reason {
  icon: React.ElementType;
  labelKey: string;
  detail: string;
  weight: "high" | "medium" | "low";
}

interface EmployeeExplanation {
  name: string;
  id: number;
  shift: string;
  shiftType: "vroeg" | "dag" | "laat" | "nacht";
  day: string;
  date: string;
  reasons: Reason[];
  score: number;
  alternatives: string[];
}

// ── Generate explanations from roster data ─────────────────────────────────────

function generateExplanations(data: RosterData, t: (key: string) => string): EmployeeExplanation[] {
  const { days, employees } = data;
  const explanations: EmployeeExplanation[] = [];

  for (const emp of employees) {
    // Find the first assigned shift for this employee
    const firstShiftIdx = emp.shifts.findIndex((s) => s.type !== null);
    if (firstShiftIdx === -1) continue;

    const shift = emp.shifts[firstShiftIdx];
    if (!shift.type) continue;

    const day = days[firstShiftIdx];
    const totalAssigned = emp.shifts.filter((s) => s.type !== null).length;
    const totalDays = days.length;

    // Parse hours
    const hoursMatch = emp.hours.match(/([\d.]+)\/([\d.]+)/);
    const planned = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    const contract = hoursMatch ? parseFloat(hoursMatch[2]) : 48;
    const delta = planned - contract;

    // Build reasons
    const reasons: Reason[] = [];

    // Qualification reason
    const qualTags = emp.tags.filter((t) => !["Own Employee", "Flex", "Temp"].includes(t));
    if (qualTags.length > 0) {
      reasons.push({
        icon: Star,
        labelKey: "qualification",
        detail: t("explanation.qualifiedFor") + ": " + qualTags.join(", "),
        weight: "high",
      });
    } else {
      reasons.push({
        icon: AlertTriangle,
        labelKey: "noQualification",
        detail: t("explanation.noSpecificQual"),
        weight: "low",
      });
    }

    // Fill rate / availability
    const fillPct = Math.round((totalAssigned / totalDays) * 100);
    reasons.push({
      icon: Clock,
      labelKey: "availability",
      detail: `${totalAssigned}/${totalDays} ${t("explanation.daysAssigned")} (${fillPct}%)`,
      weight: fillPct >= 60 ? "high" : "medium",
    });

    // Contract hours
    if (delta > 4) {
      reasons.push({
        icon: CalendarCheck,
        labelKey: "contractHours",
        detail: `${planned.toFixed(0)}u ${t("explanation.of")} ${contract}u — ${t("explanation.overloaded")}`,
        weight: "high",
      });
    } else if (delta < -8) {
      reasons.push({
        icon: CalendarCheck,
        labelKey: "contractHours",
        detail: `${planned.toFixed(0)}u ${t("explanation.of")} ${contract}u — ${t("explanation.underloaded")}`,
        weight: "high",
      });
    } else {
      reasons.push({
        icon: CalendarCheck,
        labelKey: "contractHours",
        detail: `${planned.toFixed(0)}u ${t("explanation.of")} ${contract}u — ${t("explanation.withinTarget")}`,
        weight: "low",
      });
    }

    // Shift pattern continuity
    const consecutiveShifts = countConsecutiveSameType(emp.shifts, firstShiftIdx);
    if (consecutiveShifts >= 3) {
      reasons.push({
        icon: Repeat,
        labelKey: "patternContinuity",
        detail: `${consecutiveShifts} ${t("explanation.consecutiveSameShift")}`,
        weight: "medium",
      });
    }

    // Rest time (check if previous day was different shift type)
    if (firstShiftIdx > 0 && emp.shifts[firstShiftIdx - 1]?.type) {
      const prevType = emp.shifts[firstShiftIdx - 1].type;
      if (prevType !== shift.type) {
        reasons.push({
          icon: ShieldCheck,
          labelKey: "restTime",
          detail: t("explanation.shiftChangeRest"),
          weight: "high",
        });
      }
    }

    // Team occupancy - find how many others have same shift on same day
    const sameShiftCount = employees.filter(
      (e) => e.id !== emp.id && e.shifts[firstShiftIdx]?.label === shift.label
    ).length;
    reasons.push({
      icon: Users,
      labelKey: "teamOccupancy",
      detail: `${sameShiftCount + 1} ${t("explanation.employeesOnShift")} "${shift.label}"`,
      weight: sameShiftCount < 10 ? "medium" : "low",
    });

    // Score: based on qualification match, hours balance, fill rate
    let score = 50;
    if (qualTags.length > 0) score += 20;
    if (Math.abs(delta) <= 4) score += 15;
    else if (Math.abs(delta) <= 8) score += 8;
    if (fillPct >= 60) score += 10;
    if (consecutiveShifts >= 2) score += 5;
    score = Math.min(score, 100);

    // Alternatives: other employees with same qualification who could do this shift
    const alternatives = employees
      .filter((e) => {
        if (e.id === emp.id) return false;
        if (e.shifts[firstShiftIdx]?.type !== null) return false; // already assigned
        // Check if they share a qualification
        const eQuals = e.tags.filter((t) => !["Own Employee", "Flex", "Temp"].includes(t));
        return qualTags.some((q) => eQuals.includes(q));
      })
      .slice(0, 3)
      .map((e) => toTitleCase(e.name));

    explanations.push({
      name: emp.name,
      id: emp.id,
      shift: shift.label || "",
      shiftType: shift.type,
      day: t(`days.${day.dayKey}`),
      date: day.date,
      reasons,
      score,
      alternatives,
    });
  }

  // Sort by score descending, show top entries
  return explanations.sort((a, b) => b.score - a.score).slice(0, 30);
}

function countConsecutiveSameType(shifts: ShiftData[], startIdx: number): number {
  const type = shifts[startIdx]?.type;
  if (!type) return 0;
  let count = 1;
  for (let i = startIdx + 1; i < shifts.length; i++) {
    if (shifts[i]?.type === type) count++;
    else break;
  }
  for (let i = startIdx - 1; i >= 0; i--) {
    if (shifts[i]?.type === type) count++;
    else break;
  }
  return count;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const shiftClassMap: Record<string, string> = {
  vroeg: "shift-early",
  dag: "shift-day",
  laat: "shift-late",
  nacht: "shift-night",
};

const weightColor: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

function ScoreBadge({ score }: { score: number }) {
  let color = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (score < 65) color = "bg-destructive/15 text-destructive";
  else if (score < 80) color = "bg-amber-500/15 text-amber-700 dark:text-amber-400";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${color}`}>
      {score}/100
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface ExplanationViewProps {
  data?: RosterData;
}

export function ExplanationView({ data }: ExplanationViewProps) {
  const { t } = useTranslation();

  const explanations = useMemo(
    () => (data ? generateExplanations(data, t) : []),
    [data, t]
  );

  const weightLabel: Record<string, string> = {
    high: t("explanation.decisive"),
    medium: t("explanation.considered"),
    low: t("explanation.additional"),
  };

  const shiftTypeLabel: Record<string, string> = {
    vroeg: t("grid.early"),
    dag: t("grid.day"),
    laat: t("grid.late"),
    nacht: t("grid.night"),
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
      {/* Header */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{t("explanation.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: t("explanation.description") }} />
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
        <Accordion type="multiple" defaultValue={explanations.length > 0 ? [explanations[0].id.toString()] : []} className="space-y-2">
          {explanations.map((emp) => (
            <AccordionItem
              key={emp.id}
              value={emp.id.toString()}
              className="border border-border/50 rounded-xl bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{toTitleCase(emp.name)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`shift-badge ${shiftClassMap[emp.shiftType]} text-[10px] px-2 py-0.5`}>
                        {shiftTypeLabel[emp.shiftType]}
                      </div>
                      <span className="text-xs text-muted-foreground">{emp.shift}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-foreground font-medium">{emp.day} {emp.date}</span>
                    </div>
                  </div>
                  <ScoreBadge score={emp.score} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-3">
                  {/* Reasons */}
                  <div className="space-y-2">
                    {emp.reasons.map((reason, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${weightColor[reason.weight]}`}
                      >
                        <reason.icon className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{t(`explanation.${reason.labelKey}`)}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-current/30">
                              {weightLabel[reason.weight]}
                            </Badge>
                          </div>
                          <p className="text-[11px] mt-0.5 opacity-80 leading-relaxed">{reason.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alternatives */}
                  {emp.alternatives.length > 0 && (
                    <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2.5">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {t("explanation.alternativeCandidates")}{" "}
                      </span>
                      {emp.alternatives.map((alt, i) => (
                        <span key={i} className="text-[11px] text-foreground">
                          {alt}{i < emp.alternatives.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
