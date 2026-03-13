import { PlannerSidebar } from "@/components/planner/PlannerSidebar";
import { KpiCards } from "@/components/planner/KpiCards";
import { RosterGrid } from "@/components/planner/RosterGrid";
import { ServiceRosterGrid } from "@/components/planner/ServiceRosterGrid";
import { StatsDashboard } from "@/components/planner/StatsDashboard";
import { ExplanationView } from "@/components/planner/ExplanationView";
import { RosterTabs } from "@/components/planner/RosterTabs";
import { PostSolveChat } from "@/components/planner/PostSolveChat";
import { AiBriefingChat } from "@/components/planner/AiBriefingChat";
import { JsonDataViewer } from "@/components/planner/JsonDataViewer";
import type { JsonScheduleData } from "@/components/planner/JsonDataViewer";
import { parseRawScheduleJson } from "@/lib/parseScheduleJson";
import { parseSolverResponse } from "@/lib/parseSolverResponse";
import type { RosterData, SolverResponse } from "@/lib/parseSolverResponse";
import { defaultAtw, defaultSoft, defaultSolver, buildSettingsPayload } from "@/lib/solverSettings";
import type { AtwConstraints, SoftConstraints, SolverSettings } from "@/lib/solverSettings";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Moon, Sun, MessageCircle, PanelRightClose } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
    <div className="relative bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-3xl px-6 py-4 w-[480px] animate-fade-in">
      <p className="text-sm font-medium text-foreground leading-relaxed tracking-wide">
        {typed}
        <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 animate-pulse align-middle rounded-full" />
      </p>
      <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 bg-card/95 backdrop-blur-md border-r border-b border-border rotate-45 rounded-sm" />
    </div>
  );
}

function SolvingOverlay() {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);

  const solvePhases = [
    { label: t("solving.loadConstraints"), icon: "📋", duration: 4 },
    { label: t("solving.assignEmployees"), icon: "👥", duration: 6 },
    { label: t("solving.checkAtw"), icon: "⚖️", duration: 8 },
    { label: t("solving.resolveConflicts"), icon: "🔧", duration: 10 },
    { label: t("solving.optimizeRoster"), icon: "✨", duration: 0 },
    { label: t("solving.finalChecks"), icon: "✅", duration: 0 },
  ];

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Advance phases: first few are timed, then "optimizing" stays until solved
  useEffect(() => {
    const thresholds = [4, 8, 14, 22]; // cumulative seconds for phases 0-3
    const newPhase = thresholds.filter((t) => elapsed >= t).length;
    if (newPhase <= 4) setPhase(Math.min(newPhase, 4));
  }, [elapsed]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-[fade-in_0.6s_ease-out]">
      {/* First ~3 seconds of login video, looped */}
      <video
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        ref={(el) => {
          if (el) {
            const handleTime = () => {
              if (el.currentTime >= 5) el.currentTime = 0;
            };
            el.addEventListener("timeupdate", handleTime);
          }
        }}
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-background/30" />
      <div className="animate-[fade-in_0.3s_ease-out] flex flex-col items-center gap-6">
        <div className="relative w-44 h-44">
          {/* Indeterminate spinning ring */}
          <svg className="w-full h-full animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" className="stroke-muted" />
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" className="stroke-primary" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42 * 0.3} ${2 * Math.PI * 42 * 0.7}`}
            />
          </svg>
          <img src={robotImg} alt="Solving..." className="absolute inset-4 object-contain drop-shadow-xl robot-float" />
        </div>

        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{t("solving.title")}</h2>

        <div className="flex items-center gap-2">
          {solvePhases.map((step, i) => {
            const status = i < phase ? "done" : i === phase ? "active" : "pending";
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 drop-shadow-md",
                  status === "done" ? "bg-white border-white text-black scale-90" :
                  status === "active" ? "border-white text-white animate-pulse bg-white/20 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]" :
                  "border-white/40 text-white/60 bg-black/30 scale-90 opacity-50"
                )} title={step.label}>
                  {status === "done" ? "✓" : step.icon}
                </div>
                {i < solvePhases.length - 1 && (
                  <div className={cn("w-6 h-0.5 rounded-full transition-all duration-500", status === "done" ? "bg-white" : "bg-white/30")} />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-lg text-white font-semibold animate-pulse drop-shadow-md">
          {solvePhases[phase]?.label}…
        </p>

        <span className="text-xl text-white font-mono drop-shadow font-bold">{formatTime(elapsed)}</span>
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
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [requestData, setRequestData] = useState<any>(null);
  const [requestRawJson, setRequestRawJson] = useState<string | null>(null);
  const [employeeConstraints, setEmployeeConstraints] = useState<import("@/components/planner/AiBriefingChat").EmployeeConstraint[]>([]);
  const [entranceVisible, setEntranceVisible] = useState(() => {
    return sessionStorage.getItem("just_logged_in") === "true";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const justLoggedIn = sessionStorage.getItem("just_logged_in");
    if (justLoggedIn) {
      sessionStorage.removeItem("just_logged_in");
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (entranceVisible) {
      const timer = setTimeout(() => setEntranceVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [entranceVisible]);
  const [solverExplanations, setSolverExplanations] = useState<any[]>([]);
  const [solverStatistics, setSolverStatistics] = useState<any>(null);
  const [solverAssignments, setSolverAssignments] = useState<any[]>([]);
  const [atw, setAtw] = useState<AtwConstraints>(defaultAtw);
  const [soft, setSoft] = useState<SoftConstraints>(defaultSoft);
  const [solver, setSolver] = useState<SolverSettings>(defaultSolver);

  const handleJsonLoaded = (rawJson?: string) => {
    setSolved(false);
    setRosterData(null);
    setSolveDurationMs(0);
    setJsonLoaded(true);
    if (rawJson) {
      try {
        const raw = JSON.parse(rawJson);
        setRequestData(raw);
        setRequestRawJson(rawJson);
        setScheduleData(parseRawScheduleJson(raw));
      } catch (e) {
        console.error("Invalid JSON:", e);
      }
    } else {
      fetch("/data/schedule-request.json")
        .then((r) => r.text())
        .then((text) => {
          const raw = JSON.parse(text);
          setRequestData(raw);
          setRequestRawJson(text);
          setScheduleData(parseRawScheduleJson(raw));
        })
        .catch(console.error);
    }
  };

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

  const [solveStartTime, setSolveStartTime] = useState<number>(0);
  const [solveDurationMs, setSolveDurationMs] = useState<number>(0);

  const handleSolve = async () => {
    if (!requestRawJson) {
      toast.error(t("planner.noJsonTitle", "Geen data geladen"), { description: t("planner.noJsonDesc", "Laad eerst een JSON-bestand via de sidebar voordat je oplost.") });
      return;
    }
    setSolving(true);
    const startTime = Date.now();
    try {
      // Merge sidebar settings into the request payload
      const basePayload = JSON.parse(requestRawJson);
      const settingsPayload = buildSettingsPayload(atw, soft, solver);
      const mergedPayload = { ...basePayload, ...settingsPayload };

      // Inject per-employee constraints from AI briefing chat
      if (employeeConstraints.length > 0 && Array.isArray(mergedPayload.Employees)) {
        // Group constraints by personId
        const constraintsByPerson = new Map<number, any[]>();
        for (const ec of employeeConstraints) {
          const list = constraintsByPerson.get(ec.personId) || [];
          list.push(ec.constraint);
          constraintsByPerson.set(ec.personId, list);
        }
        mergedPayload.Employees = mergedPayload.Employees.map((emp: any) => {
          const personConstraints = constraintsByPerson.get(emp.PersonId);
          if (personConstraints) {
            return { ...emp, Constraints: [...(emp.Constraints || []), ...personConstraints] };
          }
          return emp;
        });
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(mergedPayload),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Solver error ${res.status}: ${err}`);
      }
      const solverResponse: SolverResponse = await res.json();
      const roster = parseSolverResponse(requestData, solverResponse);
      setRosterData(roster);
      setSolverExplanations((solverResponse as any).Explanations || []);
      setSolverStatistics((solverResponse as any).Statistics || null);
      setSolverAssignments((solverResponse as any).Assignments || []);
      setSolverStatistics((solverResponse as any).Statistics || null);
      setSolveDurationMs(Date.now() - startTime);
      setSolved(true);
      setSidebarCollapsed(true);
    } catch (e) {
      console.error("Failed to solve:", e);
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="h-screen flex w-full">
      {solving && <SolvingOverlay />}
      {/* Smooth entrance overlay after login */}
      {entranceVisible && (
        <div className="fixed inset-0 z-[200] bg-background pointer-events-none animate-[fade-out_1.2s_ease-out_forwards]" />
      )}
      <PlannerSidebar 
        onSolve={handleSolve} 
        onJsonLoaded={handleJsonLoaded} 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        atw={atw}
        setAtw={setAtw}
        soft={soft}
        setSoft={setSoft}
        solver={solver}
        setSolver={setSolver}
      />

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
            <PushNotificationManager />
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
                <KpiCards solved data={rosterData ?? undefined} solveTime={solveDurationMs} />
                <RosterTabs value={activeTab} onChange={setActiveTab} />
                {activeTab === "roster" && <RosterGrid data={rosterData ?? undefined} employeeConstraints={employeeConstraints} />}
                {activeTab === "dienst" && <ServiceRosterGrid data={rosterData ?? undefined} />}
                {activeTab === "stats" && <StatsDashboard data={rosterData ?? undefined} />}
                {activeTab === "uitleg" && <ExplanationView data={rosterData ?? undefined} solverExplanations={solverExplanations} solverStatistics={solverStatistics} />}
              </main>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto roster-scroll p-5 space-y-5">
                  <KpiCards solved={false} data={undefined} />
                  {jsonLoaded && scheduleData && <JsonDataViewer data={scheduleData} />}
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
                          className="relative bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-3xl px-5 py-3 max-w-[240px] mb-2 animate-fade-in cursor-pointer pointer-events-auto"
                          onClick={() => setChatOpen(true)}
                        >
                          <p className="text-sm font-semibold leading-snug text-foreground tracking-wide">{t("robot.clickMe")}</p>
                          <div className="absolute -bottom-2.5 right-6 w-5 h-5 bg-card/95 backdrop-blur-md border-b border-r border-border rotate-45 rounded-sm" />
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
                  <div className="relative bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-3xl px-5 py-3 max-w-[240px] animate-[bounce_2s_ease-in-out_3] mr-4">
                    <p className="text-sm font-semibold leading-snug text-foreground tracking-wide">{t("robot.clickMePost")}</p>
                    <div className="absolute -bottom-2.5 right-6 w-5 h-5 bg-card/95 backdrop-blur-md border-b border-r border-border rotate-45 rounded-sm" />
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
                      {solved ? (
                        <PostSolveChat
                          requestData={requestData}
                          solverAssignments={solverAssignments}
                          onApplyAlternative={(alt) => {
                            // Re-parse the alternative's assignments into roster data
                            const newRoster = parseSolverResponse(requestData, { Assignments: alt.Assignments });
                            setRosterData(newRoster);
                            setSolverAssignments(alt.Assignments);
                            toast.success(`Alternatief #${alt.Rank} doorgevoerd`, {
                              description: `${alt.ChangesFromBaseline} wijziging${alt.ChangesFromBaseline !== 1 ? "en" : ""} toegepast`,
                            });
                          }}
                        />
                      ) : (
                        <AiBriefingChat
                          employees={requestData?.Employees || []}
                          schedulePeriod={requestData ? `${requestData.Start} - ${requestData.End}` : ""}
                          constraints={employeeConstraints}
                          onConstraintsChange={setEmployeeConstraints}
                        />
                      )}
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
