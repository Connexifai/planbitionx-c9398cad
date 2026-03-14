import React, { useState } from "react";
import {
  Upload,
  ShieldCheck,
  Sparkles,
  Settings2,
  FileJson,
  PanelLeftClose,
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
import type { AtwConstraints, SoftConstraints, SolverSettings } from "@/lib/solverSettings";
import { defaultAtw, defaultSoft, defaultSolver } from "@/lib/solverSettings";

type SectionId = "json" | "atw" | "zachte" | "solver";

/* ── Rule row ─────────────────────────────────────────── */

interface RuleRowProps {
  label: string;
  sublabel?: string;
  value?: number;
  unit?: string;
  enabled?: boolean;
  secondValue?: number;
  onToggle?: (v: boolean) => void;
  onChange?: (v: number) => void;
  onSecondChange?: (v: number) => void;
}

function RuleRow({ label, sublabel, value, unit = "min", enabled = true, secondValue, onToggle, onChange, onSecondChange }: RuleRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Switch checked={enabled} onCheckedChange={onToggle} className="scale-75" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
        </div>
      </div>
      {value !== undefined && (
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="h-8 w-16 text-xs text-right"
          />
          {secondValue !== undefined && (
            <>
              <span className="text-xs text-muted-foreground">/</span>
              <Input
                type="number"
                value={secondValue}
                onChange={(e) => onSecondChange?.(Number(e.target.value))}
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

function LevelSelector({ levels, active, onChange }: { levels: string[]; active: number; onChange?: (i: number) => void }) {
  return (
    <div className="flex gap-1">
      {levels.map((level, i) => (
        <Button
          key={level}
          variant={i === active ? "default" : "outline"}
          size="sm"
          className="flex-1 text-xs h-7"
          onClick={() => onChange?.(i)}
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
        onChange={(e) => {
          setJsonText(e.target.value);
          onJsonLoaded?.(e.target.value);
          setLoaded(true);
        }}
      />
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={async () => {
        try {
          const res = await fetch("/data/schedule-request.json");
          const text = await res.text();
          setJsonText(text);
          onJsonLoaded?.(text);
          setLoaded(true);
        } catch {}
      }}>
        {t("sidebar.example", "Voorbeeld")}
      </Button>
    </div>
  );
}

function AtwSection({ atw, setAtw }: { atw: AtwConstraints; setAtw: React.Dispatch<React.SetStateAction<AtwConstraints>> }) {
  const { t } = useTranslation();
  const update = (patch: Partial<AtwConstraints>) => setAtw((prev) => ({ ...prev, ...patch }));
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-2">{t("sidebar.toggleRuleHint")}</p>
      <RuleRow label={t("sidebar.maxShiftDuration")} sublabel={t("sidebar.maxShiftDurationSub")} value={atw.maxShiftDurationMinutes} enabled={atw.maxShiftDurationEnabled} onToggle={(v) => update({ maxShiftDurationEnabled: v })} onChange={(v) => update({ maxShiftDurationMinutes: v })} />
      <RuleRow label={t("sidebar.maxNightShift")} sublabel={t("sidebar.maxNightShiftSub")} value={atw.maxNightShiftMinutes} enabled={atw.maxNightShiftEnabled} onToggle={(v) => update({ maxNightShiftEnabled: v })} onChange={(v) => update({ maxNightShiftMinutes: v })} />
      <RuleRow label={t("sidebar.nightShiftException")} sublabel={t("sidebar.nightShiftExceptionSub")} enabled={atw.nightShiftExceptionEnabled} onToggle={(v) => update({ nightShiftExceptionEnabled: v })} />
      <RuleRow label={t("sidebar.maxWeekHours")} sublabel={t("sidebar.maxWeekHoursSub")} value={atw.maxWeekHoursMinutes} enabled={atw.maxWeekHoursEnabled} onToggle={(v) => update({ maxWeekHoursEnabled: v })} onChange={(v) => update({ maxWeekHoursMinutes: v })} />
      <RuleRow label={t("sidebar.minRestBetween")} sublabel={t("sidebar.minRestBetweenSub")} value={atw.minRestBetweenMinutes} enabled={atw.minRestBetweenEnabled} onToggle={(v) => update({ minRestBetweenEnabled: v })} onChange={(v) => update({ minRestBetweenMinutes: v })} />
      <RuleRow label={t("sidebar.shortenedRest")} sublabel={t("sidebar.shortenedRestSub")} value={atw.shortenedRestMinutes} enabled={atw.shortenedRestEnabled} onToggle={(v) => update({ shortenedRestEnabled: v })} onChange={(v) => update({ shortenedRestMinutes: v })} />
      <RuleRow label={t("sidebar.restAfterNight")} sublabel={t("sidebar.restAfterNightSub")} value={atw.restAfterNightMinutes} enabled={atw.restAfterNightEnabled} onToggle={(v) => update({ restAfterNightEnabled: v })} onChange={(v) => update({ restAfterNightMinutes: v })} />
      <RuleRow label={t("sidebar.breakRules")} sublabel={t("sidebar.breakRulesSub")} value={atw.breakRulesMinutes1} secondValue={atw.breakRulesMinutes2} enabled={atw.breakRulesEnabled} onToggle={(v) => update({ breakRulesEnabled: v })} onChange={(v) => update({ breakRulesMinutes1: v })} onSecondChange={(v) => update({ breakRulesMinutes2: v })} />
      <RuleRow label={t("sidebar.rest36h")} sublabel={t("sidebar.rest36hSub")} value={atw.rest36hMinutes} enabled={atw.rest36hEnabled} onToggle={(v) => update({ rest36hEnabled: v })} onChange={(v) => update({ rest36hMinutes: v })} />
      <RuleRow label={t("sidebar.rest46h")} sublabel={t("sidebar.rest46hSub")} value={atw.rest46hMinutes} enabled={atw.rest46hEnabled} onToggle={(v) => update({ rest46hEnabled: v })} onChange={(v) => update({ rest46hMinutes: v })} />
    </div>
  );
}

function ZachteSection({ soft, setSoft }: { soft: SoftConstraints; setSoft: React.Dispatch<React.SetStateAction<SoftConstraints>> }) {
  const { t } = useTranslation();
  const update = (patch: Partial<SoftConstraints>) => setSoft((prev) => ({ ...prev, ...patch }));
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.minimizeShiftChange")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.offLowMedHigh")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={soft.minimizeShiftChange} onChange={(i) => update({ minimizeShiftChange: i })} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.forwardRotation")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.forwardRotationSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={soft.forwardRotation} onChange={(i) => update({ forwardRotation: i })} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.crossWeekRotation")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.crossWeekRotationSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={soft.crossWeekRotation} onChange={(i) => update({ crossWeekRotation: i })} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.shiftConsistency")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.shiftConsistencySub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={soft.shiftConsistency} onChange={(i) => update({ shiftConsistency: i })} />
      </div>
      <RuleRow label={t("sidebar.minRotationBlock")} sublabel={t("sidebar.minRotationBlockSub")} value={soft.minRotationBlock} unit="" onChange={(v) => update({ minRotationBlock: v })} />
      <RuleRow label={t("sidebar.maxRotationBlock")} sublabel={t("sidebar.maxRotationBlockSub")} value={soft.maxRotationBlock} unit="" onChange={(v) => update({ maxRotationBlock: v })} />
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.rest14hPreference")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.rest14hPreferenceSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={soft.rest14hPreference} onChange={(i) => update({ rest14hPreference: i })} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.singleNightShifts")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.singleNightShiftsSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "L", "M", "H"]} active={soft.singleNightShifts} onChange={(i) => update({ singleNightShifts: i })} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("sidebar.distributeOpen")}</p>
          <p className="text-xs text-muted-foreground">{t("sidebar.distributeOpenSub")}</p>
        </div>
        <Switch checked={soft.distributeOpen} onCheckedChange={(v) => update({ distributeOpen: v })} />
      </div>
    </div>
  );
}

function SolverSection({ solver, setSolver }: { solver: SolverSettings; setSolver: React.Dispatch<React.SetStateAction<SolverSettings>> }) {
  const { t } = useTranslation();
  const update = (patch: Partial<SolverSettings>) => setSolver((prev) => ({ ...prev, ...patch }));
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.timeLimit")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.timeLimitSub")}</p>
        <LevelSelector levels={["30s", "1m", "2m", "5m"]} active={solver.timeLimitIndex} onChange={(i) => update({ timeLimitIndex: i })} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.plateauStop")}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{t("sidebar.plateauStopSub")}</p>
        <LevelSelector levels={[t("sidebar.off"), "15s", "30s", "1m"]} active={solver.plateauStopIndex} onChange={(i) => update({ plateauStopIndex: i })} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("sidebar.aiExplanation")}</p>
          <p className="text-xs text-muted-foreground">{t("sidebar.aiExplanationSub")}</p>
        </div>
        <Switch checked={solver.aiExplanation} onCheckedChange={(v) => update({ aiExplanation: v })} />
      </div>
      <RuleRow label={t("sidebar.seedRepeat")} sublabel={t("sidebar.seedRepeatSub")} value={solver.seed} unit="" onChange={(v) => update({ seed: v })} />
      <div>
        <p className="text-sm font-medium mb-1">{t("sidebar.callbackUrl")}</p>
        <div className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs">
          <span className="text-kpi-assignments">🔒</span>
          <Input
            value={solver.callbackUrl}
            onChange={(e) => update({ callbackUrl: e.target.value })}
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
  onCollapsedChange,
  atw,
  setAtw,
  soft,
  setSoft,
  solver,
  setSolver,
}: {
  onSolve?: () => void;
  hideFooter?: boolean;
  onJsonLoaded?: (rawJson?: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  atw: AtwConstraints;
  setAtw: React.Dispatch<React.SetStateAction<AtwConstraints>>;
  soft: SoftConstraints;
  setSoft: React.Dispatch<React.SetStateAction<SoftConstraints>>;
  solver: SolverSettings;
  setSolver: React.Dispatch<React.SetStateAction<SolverSettings>>;
  hideIconStrip?: boolean;
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

  const renderSection = () => {
    switch (activeSection) {
      case "json": return <JsonSection onJsonLoaded={onJsonLoaded} />;
      case "atw": return <AtwSection atw={atw} setAtw={setAtw} />;
      case "zachte": return <ZachteSection soft={soft} setSoft={setSoft} />;
      case "solver": return <SolverSection solver={solver} setSolver={setSolver} />;
    }
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
              {renderSection()}
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
              <Button className="w-full h-10 mb-2" style={{ background: "hsl(var(--kpi-assignments))" }} onClick={onSolve}>
                ▶ {t("sidebar.solve")}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">{t("sidebar.readyIn")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
