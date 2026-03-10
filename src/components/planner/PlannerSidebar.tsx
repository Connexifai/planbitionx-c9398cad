import { useState } from "react";
import {
  Upload,
  ShieldCheck,
  Sparkles,
  Settings2,
  FileJson,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionId = "json" | "atw" | "zachte" | "solver";

const sections: { id: SectionId; icon: React.ElementType; label: string }[] = [
  { id: "json", icon: FileJson, label: "JSON Invoer" },
  { id: "atw", icon: ShieldCheck, label: "ATW Regels" },
  { id: "zachte", icon: Sparkles, label: "Zachte Beperkingen" },
  { id: "solver", icon: Settings2, label: "Solver Instellingen" },
];

/* ── Rule row ─────────────────────────────────────────── */

interface RuleRowProps {
  label: string;
  sublabel?: string;
  value?: number;
  unit?: string;
  enabled?: boolean;
  secondValue?: number;
}

function RuleRow({ label, sublabel, value, unit = "min", enabled = true, secondValue }: RuleRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Switch defaultChecked={enabled} className="scale-75" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
        </div>
      </div>
      {value !== undefined && (
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            defaultValue={value}
            className="h-8 w-16 text-xs text-right"
          />
          {secondValue !== undefined && (
            <>
              <span className="text-xs text-muted-foreground">/</span>
              <Input
                type="number"
                defaultValue={secondValue}
                className="h-8 w-16 text-xs text-right"
              />
            </>
          )}
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      )}
    </div>
  );
}

/* ── Level selector ───────────────────────────────────── */

function LevelSelector({ levels, active }: { levels: string[]; active: number }) {
  return (
    <div className="flex gap-1">
      {levels.map((level, i) => (
        <Button
          key={level}
          variant={i === active ? "default" : "outline"}
          size="sm"
          className="flex-1 text-xs h-7"
        >
          {level}
        </Button>
      ))}
    </div>
  );
}

/* ── Section content panels ───────────────────────────── */

function JsonSection() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-accent/50 px-4 py-6 text-center transition-colors hover:border-primary/30 hover:bg-accent cursor-pointer">
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Sleep een JSON-bestand</p>
        <p className="text-xs text-muted-foreground">of klik om te bladeren</p>
        <p className="text-[10px] text-muted-foreground mt-1">.json · max 10 MB</p>
      </div>
      <textarea
        className="w-full h-28 rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        defaultValue={`{\n  "Start": "2026-03-30T00:00:00",\n  "End": "2026-04-05T00:00:00",\n  "Shifts": [\n    {\n`}
      />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs">
          ✓ Valideer
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs">
          {"{ } Format"}
        </Button>
      </div>
    </div>
  );
}

function AtwSection() {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-2">
        Schakel een regel uit om te testen. Pas de waarde aan om de grens te wijzigen.
      </p>
      <RuleRow label="Max dienstduur" sublabel="Max minuten per dienst" value={720} />
      <RuleRow label="Max nachtdienst" sublabel="Max minuten nachtdienst" value={600} />
      <RuleRow label="Nachtdienst uitzondering" sublabel="Laat 12 uur nachtdiensten toe" enabled={false} />
      <RuleRow label="Max weekuren" sublabel="Max minuten per week" value={3600} />
      <RuleRow label="Min rust tussen diensten" sublabel="Min minuten rust" value={660} />
      <RuleRow label="Verkorte rust (1× per week)" sublabel="Min minuten verkorte rust" value={480} enabled={false} />
      <RuleRow label="Rust na nachtdienst" sublabel="Min minuten rust na nacht" value={840} />
      <RuleRow label="Pauzeregels" sublabel="Drempel pauze 1 / pauze 2" value={330} secondValue={600} enabled={false} />
      <RuleRow label="36u rust per 7 dagen" sublabel="ATW art. 5:5 – aaneengesloten" value={2160} />
      <RuleRow label="46u rust na nachtreeks" sublabel="Na ≥3 nachtdiensten op rij" value={2760} />
    </div>
  );
}

function ZachteSection() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Minimaliseer dienstwisseling</p>
        <p className="text-xs text-muted-foreground mb-1.5">Uit / Laag / Middel / Hoog</p>
        <LevelSelector levels={["Uit", "L", "M", "H"]} active={0} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Voorwaartse rotatie</p>
        <p className="text-xs text-muted-foreground mb-1.5">Vroeg → Dag → Laat → Nacht</p>
        <LevelSelector levels={["Uit", "L", "M", "H"]} active={3} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Cross-week rotatie</p>
        <p className="text-xs text-muted-foreground mb-1.5">Roteer naar volgend diensttype per week</p>
        <LevelSelector levels={["Uit", "L", "M", "H"]} active={0} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Dienstkonsistentie blok</p>
        <p className="text-xs text-muted-foreground mb-1.5">Zelfde dienst (Vroeg/Dag) per blok</p>
        <LevelSelector levels={["Uit", "L", "M", "H"]} active={3} />
      </div>
      <RuleRow label="Min rotatieblok" sublabel="Minimaal aaneengesloten diensten" value={2} unit="" />
      <RuleRow label="Max rotatieblok" sublabel="Maximaal aaneengesloten diensten" value={5} unit="" />
      <div>
        <p className="text-sm font-medium mb-1">14u rust voorkeur</p>
        <p className="text-xs text-muted-foreground mb-1.5">Voorkeur voor ≥14u tussen diensten</p>
        <LevelSelector levels={["Uit", "L", "M", "H"]} active={2} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Losse nachtdiensten</p>
        <p className="text-xs text-muted-foreground mb-1.5">Penaliseer vrij-nacht-vrij patroon</p>
        <LevelSelector levels={["Uit", "L", "M", "H"]} active={3} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Verdeel open posities</p>
          <p className="text-xs text-muted-foreground">Spreidt niet-ingevulde diensten over de week</p>
        </div>
        <Switch defaultChecked />
      </div>
    </div>
  );
}

function SolverSection() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Tijdslimiet</p>
        <p className="text-xs text-muted-foreground mb-1.5">Maximale rekentijd</p>
        <LevelSelector levels={["30s", "1m", "2m", "5m"]} active={0} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Plateau-stop</p>
        <p className="text-xs text-muted-foreground mb-1.5">Stop als geen verbetering na…</p>
        <LevelSelector levels={["Uit", "15s", "30s", "1m"]} active={0} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">✨ AI-uitleg</p>
          <p className="text-xs text-muted-foreground">Begrijpelijke uitleg via Claude na het oplossen</p>
        </div>
        <Switch />
      </div>
      <RuleRow label="Startpunt herhaling" sublabel="Zelfde getal = zelfde rooster; 0 = willekeurig" value={42} unit="" />
      <div>
        <p className="text-sm font-medium mb-1">Callback URL</p>
        <div className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs">
          <span className="text-kpi-assignments">🔒</span>
          <Input
            defaultValue="https://jouw-server.nl/webhook"
            className="h-6 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Main sidebar ─────────────────────────────────────── */

export function PlannerSidebar({ onSolve }: { onSolve?: () => void }) {
  const [activeSection, setActiveSection] = useState<SectionId>("json");
  const [contentCollapsed, setContentCollapsed] = useState(false);

  const activeDef = sections.find(s => s.id === activeSection)!;

  const contentMap: Record<SectionId, React.ReactNode> = {
    json: <JsonSection />,
    atw: <AtwSection />,
    zachte: <ZachteSection />,
    solver: <SolverSection />,
  };

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-sidebar shrink-0 transition-all duration-300 h-screen sticky top-0",
        contentCollapsed ? "w-[52px]" : "w-[360px]"
      )}
    >
      <div className="flex flex-row flex-1 min-h-0">
        {/* Icon strip */}
        <div className="flex flex-col items-center gap-1 border-r bg-muted/30 px-1.5 py-3 shrink-0">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveSection(section.id);
                      if (contentCollapsed) setContentCollapsed(false);
                    }}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                      isActive && !contentCollapsed
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {section.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Content panel */}
        {!contentCollapsed && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <activeDef.icon className="h-4 w-4 text-primary" />
                {activeDef.label}
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setContentCollapsed(true)}
                    className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Paneel sluiten
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto roster-scroll px-4 py-3">
              {contentMap[activeSection]}
            </div>
          </div>
        )}
      </div>

      {!contentCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex gap-2 mb-2">
            <Button className="flex-1 h-10" style={{ background: "hsl(var(--kpi-assignments))" }} onClick={onSolve}>
              ▶ Oplossen
            </Button>
            <Button variant="default" className="flex-1 h-10">
              Stuur naar API
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Klaar in 16s</p>
        </div>
      )}
    </div>
  );
}
