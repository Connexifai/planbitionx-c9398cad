import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface Reason {
  icon: React.ElementType;
  label: string;
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

// ── Mock explanations ──────────────────────────────────────────────────────────

const explanations: EmployeeExplanation[] = [
  {
    name: "AABachmann, Franz-Xaver", id: 233,
    shift: "Late pack", shiftType: "laat", day: "Ma", date: "02/03",
    score: 94,
    reasons: [
      { icon: Star, label: "Kwalificatie", detail: "Gecertificeerd voor Pack-werkzaamheden (niveau 3)", weight: "high" },
      { icon: Clock, label: "Beschikbaarheid", detail: "Volledige beschikbaarheid opgegeven voor late diensten Ma-Za", weight: "high" },
      { icon: Repeat, label: "Patroon continuïteit", detail: "Draait al 3 weken aaneengesloten late diensten — minimale verstoring", weight: "medium" },
      { icon: CalendarCheck, label: "Contracturen", detail: "48u gepland van 40u contract — licht boven target maar binnen marge", weight: "low" },
      { icon: Users, label: "Teambezetting", detail: "Late pack had nog 3 plekken open op maandag", weight: "medium" },
    ],
    alternatives: ["SEDE, Alexia", "SEMAILLE, Laurence"],
  },
  {
    name: "ANGIUS, Benvenuto", id: 1187,
    shift: "Day Pick", shiftType: "dag", day: "Ma", date: "02/03",
    score: 87,
    reasons: [
      { icon: Star, label: "Kwalificatie", detail: "Pick-kwalificatie (niveau 2) — voldoet aan minimale eis", weight: "high" },
      { icon: Briefcase, label: "Voorkeur", detail: "Heeft voorkeur opgegeven voor dagdiensten", weight: "medium" },
      { icon: ShieldCheck, label: "Rusttijd", detail: "Minimaal 11 uur rust sinds laatste dienst (vr nacht) — conform CAO", weight: "high" },
      { icon: TrendingUp, label: "Urenverdeling", detail: "44u gepland van 38u contract — binnen toegestane overwerk", weight: "low" },
    ],
    alternatives: ["TAISNE, Aurelien", "SILLAH, Mamogara"],
  },
  {
    name: "Ankrett, Emmie", id: 787,
    shift: "Early pick", shiftType: "vroeg", day: "Ma", date: "02/03",
    score: 91,
    reasons: [
      { icon: Star, label: "Kwalificatie", detail: "Senior Pick-medewerker (niveau 4) — hoogst beschikbare kwalificatie", weight: "high" },
      { icon: Clock, label: "Beschikbaarheid", detail: "Beschikbaar Ma-Za voor vroege diensten", weight: "high" },
      { icon: Repeat, label: "Patroon continuïteit", detail: "Consistent vroege diensten afgelopen 4 weken", weight: "medium" },
      { icon: Users, label: "Teambezetting", detail: "Vroege pick had minimaal 2 ervaren krachten nodig — Ankrett vult die rol", weight: "high" },
      { icon: CalendarCheck, label: "Contracturen", detail: "48u gepland van 40u contract — overwerk geaccepteerd door medewerker", weight: "low" },
    ],
    alternatives: ["SERAICHE, Nesrine", "TARRADE, Loic"],
  },
  {
    name: "GRENIER, Beatrice", id: 2975,
    shift: "Night Pick", shiftType: "nacht", day: "Ma", date: "02/03",
    score: 89,
    reasons: [
      { icon: Star, label: "Kwalificatie", detail: "Nacht-gecertificeerd Pick-medewerker", weight: "high" },
      { icon: ShieldCheck, label: "Gezondheidscheck", detail: "Medische goedkeuring voor nachtwerk geldig t/m 12/2026", weight: "high" },
      { icon: Clock, label: "Beschikbaarheid", detail: "Heeft exclusief nachtdiensten aangevraagd", weight: "medium" },
      { icon: Repeat, label: "Rotatie", detail: "Max 6 aaneengesloten nachten — nu op dag 1 van cyclus", weight: "medium" },
      { icon: CalendarCheck, label: "Contracturen", detail: "48u van 40u — nachttoeslag meeberekend", weight: "low" },
    ],
    alternatives: ["SENECHAL, Lucie"],
  },
  {
    name: "POUCKE, Matthieu", id: 2878,
    shift: "Day no qualification", shiftType: "dag", day: "Wo", date: "04/03",
    score: 62,
    reasons: [
      { icon: AlertTriangle, label: "Geen kwalificatie", detail: "Geen specifieke pick/pack kwalificatie — ingezet op ondersteunende taken", weight: "low" },
      { icon: Clock, label: "Beschikbaarheid", detail: "Beperkt beschikbaar: alleen Wo-Do", weight: "medium" },
      { icon: CalendarCheck, label: "Contracturen", detail: "18u gepland van 32u contract — significant onderbelast", weight: "high" },
      { icon: Users, label: "Teambezetting", detail: "Woensdag had nog capaciteit nodig — Poucke was enige beschikbare optie", weight: "high" },
    ],
    alternatives: [],
  },
  {
    name: "SARCY, Coralie", id: 2754,
    shift: "Late pack", shiftType: "laat", day: "Do", date: "05/03",
    score: 58,
    reasons: [
      { icon: Star, label: "Kwalificatie", detail: "Pack-kwalificatie (niveau 1) — basisniveau", weight: "medium" },
      { icon: Clock, label: "Beschikbaarheid", detail: "Zeer beperkt beschikbaar deze week — alleen donderdag", weight: "high" },
      { icon: CalendarCheck, label: "Contracturen", detail: "8u gepland van 24u contract — sterk onderbelast, maar geen beschikbaarheid", weight: "high" },
      { icon: AlertTriangle, label: "Aandachtspunt", detail: "Solver kon geen extra diensten plannen door beschikbaarheidsbeperkingen", weight: "low" },
    ],
    alternatives: ["KOWALSKI, Adam"],
  },
  {
    name: "SARPAUX, Teddy", id: 2735,
    shift: "Early pick", shiftType: "vroeg", day: "Ma", date: "02/03",
    score: 78,
    reasons: [
      { icon: Star, label: "Kwalificatie", detail: "Pick-kwalificatie (niveau 2)", weight: "high" },
      { icon: Repeat, label: "Wisseldienst", detail: "Wisselt van vroeg naar laat op dinsdag — solver minimaliseert wisselingen", weight: "medium" },
      { icon: ShieldCheck, label: "Rusttijd", detail: "11+ uur rust gegarandeerd bij overgang vroeg→laat", weight: "high" },
      { icon: CalendarCheck, label: "Contracturen", detail: "32u van 38u — licht onder target", weight: "low" },
    ],
    alternatives: ["JANSSEN, Eva", "ROUSSEAU, Claire"],
  },
  {
    name: "BOUCHARD, Pierre", id: 3012,
    shift: "Day Pick", shiftType: "dag", day: "Wo", date: "04/03",
    score: 85,
    reasons: [
      { icon: Star, label: "Kwalificatie", detail: "Pick-kwalificatie (niveau 3) — ervaren medewerker", weight: "high" },
      { icon: Clock, label: "Beschikbaarheid", detail: "Beschikbaar Wo-Zo voor dagdiensten", weight: "high" },
      { icon: Briefcase, label: "Voorkeur", detail: "Voorkeur voor aaneengesloten werkblokken — 5 dagen achtereen gepland", weight: "medium" },
      { icon: CalendarCheck, label: "Contracturen", detail: "45u van 40u — overwerk binnen marge", weight: "low" },
    ],
    alternatives: ["MARTIN, Sophie", "TAISNE, Aurelien"],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const shiftClassMap: Record<string, string> = {
  vroeg: "shift-early",
  dag: "shift-day",
  laat: "shift-late",
  nacht: "shift-night",
};

const shiftTypeLabel: Record<string, string> = {
  vroeg: "Vroeg",
  dag: "Dag",
  laat: "Laat",
  nacht: "Nacht",
};

const weightColor: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const weightLabel: Record<string, string> = {
  high: "Doorslaggevend",
  medium: "Meegewogen",
  low: "Bijkomend",
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

export function ExplanationView() {
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
              <h2 className="text-sm font-bold text-foreground">Solver Uitleg</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hieronder wordt per medewerker uitgelegd waarom de solver deze specifieke dienst heeft toegewezen.
                Elke toewijzing heeft een <strong>score</strong> (0-100) gebaseerd op kwalificatie, beschikbaarheid,
                contracturen, rusttijden en teambezetting. Hoe hoger de score, hoe beter de match.
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
        <Accordion type="multiple" defaultValue={[explanations[0].id.toString()]} className="space-y-2">
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
                      <span className="text-sm font-semibold text-foreground truncate">{emp.name}</span>
                      <span className="text-[10px] text-muted-foreground">#{emp.id}</span>
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

                  {/* Alternatives */}
                  {emp.alternatives.length > 0 && (
                    <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2.5">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Alternatieve kandidaten:{" "}
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
