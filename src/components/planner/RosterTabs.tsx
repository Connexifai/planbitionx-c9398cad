import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, BarChart3, BookOpen, CalendarDays, MessageCircle } from "lucide-react";

interface RosterTabsProps {
  value: string;
  onChange: (value: string) => void;
}

export function RosterTabs({ value, onChange }: RosterTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
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
