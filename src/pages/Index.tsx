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

export default function Index() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [solved, setSolved] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="h-screen flex w-full">
      <PlannerSidebar onSolve={() => setSolved(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">Planbition</h1>
            <span className="text-xs text-muted-foreground">AI Solver</span>
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
          <div className="flex-1 flex flex-col min-w-0">
            {solved ? (
              <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5">
                <KpiCards />
                <RosterTabs value={activeTab} onChange={setActiveTab} />
                {activeTab === "roster" && <RosterGrid />}
                {activeTab === "dienst" && <ServiceRosterGrid />}
                {activeTab === "stats" && <StatsDashboard />}
                {activeTab === "uitleg" && <ExplanationView />}
              </main>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-5 pb-0">
                  <KpiCards />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <AiBriefingChat />
                </div>
              </div>
            )}
          </div>

          {/* AI Chat side panel (only after solve) */}
          {solved && (
            <>
              {!chatOpen && (
                <div className="flex flex-col items-center py-3 px-1.5 border-l bg-muted/30">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setChatOpen(true)}
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">AI Assistent openen</TooltipContent>
                  </Tooltip>
                  <span className="text-[10px] text-muted-foreground mt-2 [writing-mode:vertical-lr] rotate-180">
                    AI Assistent
                  </span>
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
