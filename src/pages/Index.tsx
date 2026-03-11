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

const robotQuotes = [
  "Onze AI maakt zo'n strakke planning, zelfs de kaas krijgt gaten van de stress.",
  "Onze AI plant zo precies… het zou een liniaal jaloers maken.",
  "Mijn AI maakt een planning zo strak dat zelfs de kippen eieren op tijd leggen.",
  "AI voorspelt beschikbaarheid. Ik voorspel koffiepauzes.",
  "Onze AI plant zo goed… zelfs de toekomst vraagt om feedback.",
  "Onze AI leert van data. Ik leer van fouten. Ik heb dus meer werk.",
  "AI doet de planning. Ik doe de emotionele schade.",
  "Met AI wordt planning kunstmatige intelligentie, zonder AI wordt het natuurlijke chaos.",
  "Onze AI plant zo strak, zelfs een Zwitsers uurwerk vraagt om tips.",
  "Ik vroeg AI om een planning. AI vroeg om betere medewerkers-data. We hebben allebei verwachtingen die niet worden waargemaakt.",
  "Onze AI gebruikt machine learning. Ik gebruik trial & error. Vooral error.",
];

const solvePhases = [
  { label: "Constraints inladen", icon: "📋" },
  { label: "Medewerkers toewijzen", icon: "👥" },
  { label: "ATW-regels controleren", icon: "⚖️" },
  { label: "Conflicten oplossen", icon: "🔧" },
  { label: "Rooster optimaliseren", icon: "✨" },
  { label: "Laatste controles", icon: "✅" },
];

function useTypingText(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayed;
}

function RobotQuoteBubble() {
  const [quote] = useState(() => robotQuotes[Math.floor(Math.random() * robotQuotes.length)]);
  const typed = useTypingText(quote, 45);

  return (
    <div className="relative bg-card border shadow-xl rounded-2xl px-5 py-4 max-w-[380px] animate-fade-in">
      <p className="text-sm font-medium text-foreground leading-relaxed">
        {typed}
        <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 animate-pulse align-middle" />
      </p>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-b border-r rotate-45 rounded-sm" />
    </div>
  );
}

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
  const [jsonLoaded, setJsonLoaded] = useState(false);

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
      <PlannerSidebar onSolve={handleSolve} onJsonLoaded={() => setJsonLoaded(true)} />

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
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto roster-scroll p-5 space-y-5">
                  <KpiCards solved={false} />
                  {jsonLoaded && <JsonDataViewer data={demoScheduleData} />}
                </div>

                {/* Grote robot gecentreerd — als JSON nog NIET geladen */}
                {!jsonLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="flex flex-col items-center gap-4 pointer-events-auto">
                      <img
                        src={robotImg}
                        alt="AI Assistent"
                        className="w-[420px] h-[420px] object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite]"
                      />
                      <p className="text-lg font-semibold text-muted-foreground">Upload een JSON-bestand om te beginnen</p>
                    </div>
                  </div>
                )}

                {/* Robot fixed rechtsonder — verschijnt alleen als JSON geladen en chat dicht */}
                {jsonLoaded && !chatOpen && (
                  <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 cursor-pointer" onClick={() => setChatOpen(true)}>
                    <div className="relative bg-primary text-primary-foreground shadow-xl rounded-2xl px-4 py-3 max-w-[230px] animate-[bounce_2s_ease-in-out_3] mr-4">
                      <p className="text-sm font-semibold leading-snug">Hey! 👋 Klik op mij om je roosterwensen door te geven in de chat!</p>
                      <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary rotate-45 rounded-sm" />
                    </div>
                    <img
                      src={robotImg}
                      alt="AI Briefing"
                      className="w-56 h-56 object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite] hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Chat side panel — works both pre-solve (AiBriefingChat) and post-solve (PostSolveChat) */}
          {(solved || (jsonLoaded && !solved)) && (
            <>
              {solved && !chatOpen && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 cursor-pointer" onClick={() => setChatOpen(true)}>
                  <div className="relative bg-primary text-primary-foreground shadow-xl rounded-2xl px-4 py-3 max-w-[230px] animate-[bounce_2s_ease-in-out_3] mr-4">
                    <p className="text-sm font-semibold leading-snug">Hey! 👋 Klik op mij, dan help ik je met het rooster!</p>
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
                        <h3 className="text-sm font-semibold">{solved ? "AI Assistent" : "AI Briefing"}</h3>
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
                      {solved ? <PostSolveChat /> : <AiBriefingChat />}
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
