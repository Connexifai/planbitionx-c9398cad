import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, BarChart3, BookOpen, CalendarDays } from "lucide-react";

export function RosterTabs() {
  return (
    <Tabs defaultValue="roster" className="w-full">
      <TabsList className="bg-card border border-border/50 shadow-sm h-10">
        <TabsTrigger value="roster" className="gap-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5" />
          Medewerker Rooster
        </TabsTrigger>
        <TabsTrigger value="dienst" className="gap-1.5 text-xs">
          <LayoutGrid className="h-3.5 w-3.5" />
          Dienstrooster
        </TabsTrigger>
        <TabsTrigger value="stats" className="gap-1.5 text-xs">
          <BarChart3 className="h-3.5 w-3.5" />
          Statistieken
        </TabsTrigger>
        <TabsTrigger value="uitleg" className="gap-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          Uitleg
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
