import { PlannerSidebar } from "@/components/planner/PlannerSidebar";
import { KpiCards } from "@/components/planner/KpiCards";
import { RosterGrid } from "@/components/planner/RosterGrid";
import { ServiceRosterGrid } from "@/components/planner/ServiceRosterGrid";
import { StatsDashboard } from "@/components/planner/StatsDashboard";
import { ExplanationView } from "@/components/planner/ExplanationView";
import { RosterTabs } from "@/components/planner/RosterTabs";
import { PostSolveChat } from "@/components/planner/PostSolveChat";
import { AiBriefingChat } from "@/components/planner/AiBriefingChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Settings, Key, Moon, Sun, MessageCircle, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import robotImg from "@/assets/robot-assistant.png";

const solvePhases = [
  { label: "Constraints inladen", icon: "📋" },
  { label: "Medewerkers toewijzen", icon: "👥" },
  { label: "ATW-regels controleren", icon: "⚖️" },
  { label: "Conflicten oplossen", icon: "🔧" },
  { label: "Rooster optimaliseren", icon: "✨" },
  { label: "Laatste controles", icon: "✅" },
];

// ── Variant 1: Stappen-tijdlijn ──
function TimelineOverlay({ elapsed, phase }: { elapsed: number; phase: number }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <img src={robotImg} alt="Solving..." className="w-32 h-32 object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite]" />
      <h2 className="text-2xl font-bold text-foreground">Rooster wordt opgelost</h2>
      <div className="flex flex-col gap-1 w-72">
        {solvePhases.map((step, i) => {
          const status = i < phase ? "done" : i === phase ? "active" : "pending";
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500",
                  status === "done" ? "bg-primary border-primary text-primary-foreground" :
                  status === "active" ? "border-primary text-primary animate-pulse bg-primary/10" :
                  "border-border text-muted-foreground bg-muted"
                )}>
                  {status === "done" ? "✓" : step.icon}
                </div>
                {i < solvePhases.length - 1 && (
                  <div className={cn("w-0.5 h-4 transition-all duration-500", status === "done" ? "bg-primary" : "bg-border")} />
                )}
              </div>
              <span className={cn("text-sm transition-all duration-300", status === "active" ? "text-foreground font-semibold" : status === "done" ? "text-muted-foreground line-through" : "text-muted-foreground")}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground font-mono">{elapsed}s</span>
    </div>
  );
}

// ── Variant 2: Rooster dat zich vult ──
function GridFillOverlay({ elapsed, phase }: { elapsed: number; phase: number }) {
  const totalCells = 35;
  const filledCells = Math.min(Math.floor((elapsed / 45) * totalCells), totalCells);
  const shiftColors = ["bg-shift-early", "bg-shift-day", "bg-shift-late", "bg-shift-night"];

  return (
    <div className="flex flex-col items-center gap-6">
      <img src={robotImg} alt="Solving..." className="w-28 h-28 object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite]" />
      <h2 className="text-2xl font-bold text-foreground">Rooster wordt opgebouwd</h2>
      <p className="text-sm text-muted-foreground animate-pulse">{solvePhases[phase]?.label}…</p>
      <div className="grid grid-cols-7 gap-1.5 p-4 rounded-xl bg-card/50 border border-border/50">
        {Array.from({ length: totalCells }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-10 h-7 rounded-md transition-all duration-500",
              i < filledCells
                ? `${shiftColors[i % shiftColors.length]} opacity-80 shadow-sm`
                : "bg-muted/50"
            )}
            style={{ transitionDelay: `${(i % 7) * 50}ms` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-48 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${Math.min((elapsed / 45) * 100, 95)}%` }} />
        </div>
        <span className="text-xs text-muted-foreground font-mono w-8">{elapsed}s</span>
      </div>
    </div>
  );
}

// ── Variant 3: Pulserend dashboard ──
function PulsingDashboardOverlay({ elapsed }: { elapsed: number }) {
  const progress = Math.min(elapsed / 45, 0.95);
  const kpis = [
    { label: "Bezetting", target: 79.7, unit: "%", color: "text-kpi-occupancy", bg: "bg-kpi-occupancy" },
    { label: "Toewijzingen", target: 1396, unit: "", color: "text-kpi-assignments", bg: "bg-kpi-assignments" },
    { label: "Overtredingen", target: 0, unit: "", color: "text-kpi-violations", bg: "bg-kpi-violations" },
    { label: "Niet ingevuld", target: 53, unit: "", color: "text-kpi-unfilled", bg: "bg-kpi-unfilled" },
  ];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Circular progress with robot */}
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" className="stroke-muted" />
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" className="stroke-primary" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <img src={robotImg} alt="Solving..." className="absolute inset-4 object-contain drop-shadow-xl animate-[orbit_180s_ease-in-out_infinite]" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Rooster wordt opgelost</h2>
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cn("flex flex-col items-center gap-1 p-4 rounded-xl bg-card border border-border/50 animate-pulse")}>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
            <span className={cn("text-xl font-bold", kpi.color)}>—</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-mono">{elapsed}s</span>
    </div>
  );
}

function SolvingOverlay() {
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);
  const [variant, setVariant] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const phaseTimer = setInterval(() => setPhase((p) => (p + 1) % solvePhases.length), 5000);
    return () => clearInterval(phaseTimer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="animate-[fade-in_0.3s_ease-out]">
        {variant === 1 && <TimelineOverlay elapsed={elapsed} phase={phase} />}
        {variant === 2 && <GridFillOverlay elapsed={elapsed} phase={phase} />}
        {variant === 3 && <PulsingDashboardOverlay elapsed={elapsed} />}

        {/* Variant switcher */}
        <div className="flex justify-center gap-2 mt-8">
          {([1, 2, 3] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                variant === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {v === 1 ? "Tijdlijn" : v === 2 ? "Rooster" : "Dashboard"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSolve = () => {
    setSolving(true);
    // Simulate solve duration (replace with real API call later)
    setTimeout(() => {
      setSolving(false);
      setSolved(true);
    }, 8000);
  };

  return (
    <div className="h-screen flex w-full">
      {solving && <SolvingOverlay />}
      <PlannerSidebar onSolve={handleSolve} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
             <h1 className="text-lg font-bold tracking-tight">Planbition X</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">API:</span>
              <Input
                defaultValue="http://localhost:8080"
                className="h-6 w-40 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs">
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Key:</span>
              <Input
                defaultValue="test-2024"
                className="h-6 w-24 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Download JSON
            </Button>
            <div className="flex items-center gap-1.5 ml-1">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch checked={dark} onCheckedChange={setDark} className="scale-75" />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex min-h-0">
          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-visible">
            {solved ? (
              <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5">
                <KpiCards solved />
                <RosterTabs value={activeTab} onChange={setActiveTab} />
                {activeTab === "roster" && <RosterGrid />}
                {activeTab === "dienst" && <ServiceRosterGrid />}
                {activeTab === "stats" && <StatsDashboard />}
                {activeTab === "uitleg" && <ExplanationView />}
              </main>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-5 pb-0">
                  <KpiCards solved={false} />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <AiBriefingChat />
                </div>
                {/* Robot fixed rechtsonder */}
                <img
                  src={robotImg}
                  alt="AI Briefing"
                  className="fixed bottom-8 right-8 w-56 h-56 object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite] hover:scale-110 transition-transform duration-500 cursor-pointer z-50"
                />
              </div>
            )}
          </div>

          {/* AI Chat side panel (only after solve) */}
          {solved && (
            <>
              {!chatOpen && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 cursor-pointer" onClick={() => setChatOpen(true)}>
                  {/* Speech bubble with tail */}
                  <div className="relative bg-primary text-primary-foreground shadow-xl rounded-2xl px-4 py-3 max-w-[230px] animate-[bounce_2s_ease-in-out_3] mr-4">
                    <p className="text-sm font-semibold leading-snug">Hey! 👋 Klik op mij, dan help ik je met het rooster!</p>
                    {/* Tail pointing down-right toward robot */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary rotate-45 rounded-sm" />
                  </div>
                  <img
                    src={robotImg}
                    alt="AI Assistent"
                    className="w-56 h-56 object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite] hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}

              <div
                className={cn(
                  "flex flex-col border-l bg-sidebar shrink-0 transition-all duration-300 overflow-hidden",
                  chatOpen ? "w-[400px]" : "w-0"
                )}
              >
                {chatOpen && (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">AI Assistent</h3>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setChatOpen(false)}
                            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                          >
                            <PanelRightClose className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Paneel sluiten</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex-1 min-h-0">
                      <PostSolveChat />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
