import { PlannerSidebar } from "@/components/planner/PlannerSidebar";
import { KpiCards } from "@/components/planner/KpiCards";
import { RosterGrid } from "@/components/planner/RosterGrid";
import { ServiceRosterGrid } from "@/components/planner/ServiceRosterGrid";
import { StatsDashboard } from "@/components/planner/StatsDashboard";
import { ExplanationView } from "@/components/planner/ExplanationView";
import { RosterTabs } from "@/components/planner/RosterTabs";
import { PostSolveChat } from "@/components/planner/PostSolveChat";
import { AiBriefingChat } from "@/components/planner/AiBriefingChat";
import { JsonDataViewer, demoScheduleData } from "@/components/planner/JsonDataViewer";
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

function SolvingOverlay() {
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);

  const progress = Math.min(elapsed / 15, 0.95);


  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const phaseTimer = setInterval(() => setPhase((p) => (p + 1) % solvePhases.length), 2500);
    return () => clearInterval(phaseTimer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="animate-[fade-in_0.3s_ease-out] flex flex-col items-center gap-6">
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

        {/* Timeline steps */}
        <div className="flex items-center gap-2">
          {solvePhases.map((step, i) => {
            const status = i < phase ? "done" : i === phase ? "active" : "pending";
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500",
                  status === "done" ? "bg-primary border-primary text-primary-foreground scale-90" :
                  status === "active" ? "border-primary text-primary animate-pulse bg-primary/10 scale-110" :
                  "border-border text-muted-foreground bg-muted scale-90 opacity-50"
                )} title={step.label}>
                  {status === "done" ? "✓" : step.icon}
                </div>
                {i < solvePhases.length - 1 && (
                  <div className={cn("w-6 h-0.5 rounded-full transition-all duration-500", status === "done" ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Active phase label */}
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {solvePhases[phase]?.label}…
        </p>


        <span className="text-xs text-muted-foreground font-mono">{elapsed}s</span>
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
  const [jsonLoaded, setJsonLoaded] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSolve = () => {
    setSolving(true);
    // Simulate solve duration (replace with real API call later)
    setTimeout(() => {
      setSolving(false);
      setSolved(true);
    }, 15000);
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
            {solved && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Download JSON
              </Button>
            )}
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
            ) : showChat ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-5 pb-0">
                  <KpiCards solved={false} />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <AiBriefingChat />
                </div>
                <img
                  src={robotImg}
                  alt="AI Briefing"
                  className="fixed bottom-8 right-8 w-56 h-56 object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite] hover:scale-110 transition-transform duration-500 cursor-pointer z-50"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto roster-scroll p-5 space-y-5">
                  <KpiCards solved={false} />
                  {jsonLoaded && (
                    <>
                      <JsonDataViewer data={demoScheduleData} />
                      <div className="flex justify-center pt-2 pb-8">
                        <Button
                          size="lg"
                          className="gap-2 px-8 text-sm font-semibold"
                          style={{ background: "hsl(var(--kpi-assignments))" }}
                          onClick={() => setShowChat(true)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Ga verder naar AI Briefing
                        </Button>
                      </div>
                    </>
                  )}
                </div>
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
