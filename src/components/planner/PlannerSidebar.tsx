import { useState } from "react";
import {
  Upload,
  ShieldCheck,
  Sparkles,
  Settings2,
  FileJson,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
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
import { useTranslation } from "react-i18next";

type SectionId = "json" | "atw" | "zachte" | "solver";

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

function JsonSection({ onJsonLoaded }: { onJsonLoaded?: (rawJson?: string) => void }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [jsonText, setJsonText] = useState(`{\n  "Start": "2026-03-30T00:00:00",\n  "End": "2026-04-05T00:00:00",\n  "Shifts": [\n    {\n`);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonText(text);
      setLoaded(true);
      onJsonLoaded?.(text);
    };
    reader.readAsText(file);
  };

  const handleLoadFromTextarea = () => {
    setLoaded(true);
    onJsonLoaded?.(jsonText);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonText(text);
      setLoaded(true);
      onJsonLoaded?.(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-accent/50 px-4 py-6 text-center transition-colors hover:border-primary/30 hover:bg-accent cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">{t("sidebar.dragJson")}</p>
        <p className="text-xs text-muted-foreground">{t("sidebar.orClickBrowse")}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{t("sidebar.maxSize")}</p>
      </div>
      <textarea
        className="w-full h-28 rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />
      <div className="flex gap-2">
        <Button variant={loaded ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={handleLoadFromTextarea}>
          {loaded ? t("sidebar.loaded") : t("sidebar.validateLoad")}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
          try { setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2)); } catch {}
        }}>
          {t("sidebar.format")}
        </Button>
      </div>
    </div>
  );
}

function AtwSection() {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-2">
        {t("sidebar.toggleRuleHint")}
      </p>
      <RuleRow label={t("sidebar.maxShiftDuration")} sublabel={t("sidebar.maxShiftDurationSub")} value={720} />
      <RuleRow label={t("sidebar.maxNightShift")} sublabel={t("sidebar.maxNightShiftSub")} value={600} />
      <RuleRow label={t("sidebar.nightShiftException")} sublabel={t("sidebar.nightShiftExceptionSub")} enabled={false} />
      <RuleRow label={t("sidebar.maxWeekHours")} sublabel={t("sidebar.maxWeekHoursSub")} value={3600} />
      <RuleRow label={t("sidebar.minRestBetween")} sublabel={t("sidebar.minRestBetweenSub")} value={660} />
      <RuleRow label={t("sidebar.shortenedRest")} sublabel={t("sidebar.shortenedRestSub")} value={480} enabled={false} />
      <RuleRow label={t("sidebar.restAfterNight")} sublabel={t("sidebar.restAfterNightSub")} value={840} />
      <RuleRow label={t("sidebar.breakRules")} sublabel={t("sidebar.breakRulesSub")} value={330} secondValue={600} enabled={false} />
      <RuleRow label={t("sidebar.rest36h")} sublabel={t("sidebar.rest36hSub")} value={2160} />
      <RuleRow label={t("sidebar.rest46h")} sublabel={t("sidebar.rest46hSub")} value={2760} />
    </div>
  );
}

function ZachteSection() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.minimizeShiftChange")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.offLowMedHigh")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={0} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.forwardRotation")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.forwardRotationSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={3} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.crossWeekRotation")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.crossWeekRotationSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={0} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.shiftConsistency")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.shiftConsistencySub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={3} />
      </div>
      <RuleRow label={t("sidebar.minRotationBlock")} sublabel={t("sidebar.minRotationBlockSub")} value={2} unit="" />
      <RuleRow label={t("sidebar.maxRotationBlock")} sublabel={t("sidebar.maxRotationBlockSub")} value={5} unit="" />
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.rest14hPreference")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.rest14hPreferenceSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={2} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.singleNightShifts")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.singleNightShiftsSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={3} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("sidebar.distributeOpen")}</p>
          <p className="text-xs text-muted-foreground">{t("sidebar.distributeOpenSub")}</p>
        </div>
        <Switch defaultChecked />
      </div>
    </div>
  );
}

function SolverSection() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.timeLimit")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.timeLimitSub")}</p>
        <LevelSelector levels={["30s", "1m", "2m", "5m"]} active={0} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.plateauStop")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.plateauStopSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "15s", "30s", "1m"]} active={0} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("sidebar.aiExplanation")}</p>
          <p className="text-xs text-muted-foreground">{t("sidebar.aiExplanationSub")}</p>
        </div>
        <Switch />
      </div>
      <RuleRow label={t("sidebar.seedRepeat")} sublabel={t("sidebar.seedRepeatSub")} value={42} unit="" />
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.callbackUrl")}</p>
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

export function PlannerSidebar({ 
  onSolve, 
  hideFooter, 
  onJsonLoaded,
  collapsed: collapsedProp,
  onCollapsedChange 
}: { 
  onSolve?: () => void; 
  hideFooter?: boolean; 
  onJsonLoaded?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SectionId>("json");
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  
  const contentCollapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;
  const setContentCollapsed = (value: boolean) => {
    if (collapsedProp === undefined) {
      setInternalCollapsed(value);
    }
    onCollapsedChange?.(value);
  };

  const sections: { id: SectionId; icon: React.ElementType; label: string }[] = [
    { id: "json", icon: FileJson, label: t("sidebar.jsonInput") },
    { id: "atw", icon: ShieldCheck, label: t("sidebar.atwRules") },
    { id: "zachte", icon: Sparkles, label: t("sidebar.softConstraints") },
    { id: "solver", icon: Settings2, label: t("sidebar.solverSettings") },
  ];

  const activeDef = sections.find(s => s.id === activeSection)!;

  const contentMap: Record<SectionId, React.ReactNode> = {
    json: <JsonSection onJsonLoaded={onJsonLoaded} />,
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
        {!contentCollapsed && !hideFooter && (
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
                  {t("sidebar.closePanel")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto roster-scroll px-4 py-3">
              {contentMap[activeSection]}
            </div>
          </div>
        )}
      </div>

      {!hideFooter && (
        <div className="border-t border-border">
          {contentCollapsed ? (
            <div className="p-1.5 flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onSolve}
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-primary-foreground shadow-md transition-all"
                    style={{ background: "hsl(var(--kpi-assignments))" }}
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("sidebar.solve")}</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="p-4 pt-4 pb-3 flex flex-col justify-center">
              <div className="flex gap-2 mb-2">
                <Button className="flex-1 h-10" style={{ background: "hsl(var(--kpi-assignments))" }} onClick={onSolve}>
                  ▶ {t("sidebar.solve")}
                </Button>
                <Button variant="default" className="flex-1 h-10">
                  {t("sidebar.sendToApi")}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">{t("sidebar.readyIn")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
