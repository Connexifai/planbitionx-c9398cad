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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Moon, Sun, MessageCircle, PanelRightClose } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import robotImg from "@/assets/robot-assistant.png";

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
  const { t } = useTranslation();
  const quotes = t("robot.quotes", { returnObjects: true }) as string[];
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  const typed = useTypingText(quote, 45);

  return (
    <div className="relative bg-card border shadow-xl rounded-2xl px-5 py-4 w-[480px] animate-fade-in">
      <p className="text-sm font-medium text-foreground leading-relaxed">
        {typed}
        <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 animate-pulse align-middle" />
      </p>
      <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-card border-r border-b rotate-45 rounded-sm" />
    </div>
  );
}

function SolvingOverlay() {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);
  const progress = Math.min(elapsed / 15, 0.95);

  const solvePhases = [
    { label: t("solving.loadConstraints"), icon: "📋" },
    { label: t("solving.assignEmployees"), icon: "👥" },
    { label: t("solving.checkAtw"), icon: "⚖️" },
    { label: t("solving.resolveConflicts"), icon: "🔧" },
    { label: t("solving.optimizeRoster"), icon: "✨" },
    { label: t("solving.finalChecks"), icon: "✅" },
  ];

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
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" className="stroke-muted" />
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" className="stroke-primary" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <img src={robotImg} alt="Solving..." className="absolute inset-4 object-contain drop-shadow-xl animate-[orbit_360s_ease-in-out_infinite]" />
        </div>

        <h2 className="text-2xl font-bold text-foreground">{t("solving.title")}</h2>

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

        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {solvePhases[phase]?.label}…
        </p>

        <span className="text-xs text-muted-foreground font-mono">{elapsed}s</span>
      </div>
    </div>
  );
}

export default function Index() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [chatOpen, setChatOpen] = useState(false);
  const [jsonLoaded, setJsonLoaded] = useState(false);
  const [robotLanded, setRobotLanded] = useState(false);
  const [scheduleData, setScheduleData] = useState<JsonScheduleData | null>(null);

  useEffect(() => {
    if (jsonLoaded && !scheduleData) {
      fetch("/data/schedule-request.json")
        .then((r) => r.json())
        .then((raw) => setScheduleData(parseRawScheduleJson(raw)))
        .catch(console.error);
    }
  }, [jsonLoaded, scheduleData]);

  useEffect(() => {
    if (jsonLoaded) {
      const timer = setTimeout(() => setRobotLanded(true), 3200);
      return () => clearTimeout(timer);
    }
    setRobotLanded(false);
  }, [jsonLoaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSolve = () => {
    setSolving(true);
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
        <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">{t("app.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            {solved && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                {t("app.downloadJson")}
              </Button>
            )}
            <LanguageSwitcher />
            <div className="flex items-center gap-1.5 ml-1">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch checked={dark} onCheckedChange={setDark} className="scale-75" />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
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

                {!chatOpen && (
                  <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                      transition: 'all 3s cubic-bezier(0.4, 0, 0.2, 1)',
                      ...(jsonLoaded
                        ? { bottom: 24, right: 24, top: 'auto', left: 'auto' }
                        : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
                      ),
                    }}
                  >
                    <div className="flex flex-col items-center">
                      {!jsonLoaded && (
                        <p className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-semibold text-muted-foreground">
                          {t("robot.uploadJson")}
                        </p>
                      )}

                      {robotLanded && jsonLoaded && (
                        <div
                          className="relative bg-primary text-primary-foreground shadow-xl rounded-2xl px-4 py-3 max-w-[230px] mb-2 animate-fade-in cursor-pointer pointer-events-auto"
                          onClick={() => setChatOpen(true)}
                        >
                          <p className="text-sm font-semibold leading-snug">{t("robot.clickMe")}</p>
                          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary rotate-45 rounded-sm" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "relative pointer-events-auto",
                          jsonLoaded && robotLanded ? "cursor-pointer" : ""
                        )}
                        onClick={jsonLoaded && robotLanded ? () => setChatOpen(true) : undefined}
                      >
                        <img
                          src={robotImg}
                          alt="AI Assistent"
                          className="object-contain drop-shadow-2xl robot-float"
                          style={{
                            transition: 'width 3s cubic-bezier(0.4, 0, 0.2, 1), height 3s cubic-bezier(0.4, 0, 0.2, 1)',
                            width: jsonLoaded ? 224 : 420,
                            height: jsonLoaded ? 224 : 420,
                          }}
                        />
                        {!jsonLoaded && (
                          <div className="absolute right-[95%] top-[20%]">
                            <RobotQuoteBubble />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {(solved || (jsonLoaded && !solved)) && (
            <>
              {solved && !chatOpen && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 cursor-pointer" onClick={() => setChatOpen(true)}>
                  <div className="relative bg-primary text-primary-foreground shadow-xl rounded-2xl px-4 py-3 max-w-[230px] animate-[bounce_2s_ease-in-out_3] mr-4">
                    <p className="text-sm font-semibold leading-snug">{t("robot.clickMePost")}</p>
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary rotate-45 rounded-sm" />
                  </div>
                  <img
                    src={robotImg}
                    alt="AI Assistent"
                    className="w-56 h-56 object-contain drop-shadow-2xl robot-float hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}

              <div
                className={cn(
                  "flex flex-col border-l bg-sidebar shrink-0 transition-all duration-300 overflow-hidden",
                  chatOpen ? "w-[800px]" : "w-0"
                )}
              >
                {chatOpen && (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">{solved ? t("chat.aiAssistant") : t("chat.aiBriefing")}</h3>
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
                        <TooltipContent side="left">{t("sidebar.closePanel")}</TooltipContent>
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
