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
import { Download, Settings, Key, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Index() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [solved, setSolved] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");

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

        {/* Main content */}
        {solved ? (
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5">
            <KpiCards />
            <RosterTabs value={activeTab} onChange={setActiveTab} />
            {activeTab === "roster" && <RosterGrid />}
            {activeTab === "dienst" && <ServiceRosterGrid />}
            {activeTab === "stats" && <StatsDashboard />}
            {activeTab === "uitleg" && <ExplanationView />}
            {activeTab === "chat" && (
              <div className="flex-1 min-h-0 -mt-5 -mx-5 h-[calc(100vh-180px)]">
                <PostSolveChat />
              </div>
            )}
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
    </div>
  );
}
