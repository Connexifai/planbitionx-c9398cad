import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, BarChart3, BookOpen, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RosterTabsProps {
  value: string;
  onChange: (value: string) => void;
}

export function RosterTabs({ value, onChange }: RosterTabsProps) {
  const { t } = useTranslation();
  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
      <TabsList className="bg-card border border-border/50 shadow-sm h-10">
        <TabsTrigger value="roster" className="gap-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("tabs.employeeRoster")}
        </TabsTrigger>
        <TabsTrigger value="dienst" className="gap-1.5 text-xs">
          <LayoutGrid className="h-3.5 w-3.5" />
          {t("tabs.serviceRoster")}
        </TabsTrigger>
        <TabsTrigger value="stats" className="gap-1.5 text-xs">
          <BarChart3 className="h-3.5 w-3.5" />
          {t("tabs.statistics")}
        </TabsTrigger>
        <TabsTrigger value="uitleg" className="gap-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          {t("tabs.explanation")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
