import { Upload, ChevronDown, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface RuleRowProps {
  label: string;
  sublabel?: string;
  value?: number;
  unit?: string;
  enabled?: boolean;
}

function RuleRow({ label, sublabel, value, unit = "min", enabled = true }: RuleRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Switch defaultChecked={enabled} className="scale-75" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
        </div>
      </div>
      {value !== undefined && (
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            defaultValue={value}
            className="h-8 w-16 text-xs text-right"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-accent transition-colors">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PlannerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (collapsed) return (
    <Sidebar collapsible="icon">
      <SidebarContent />
    </Sidebar>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="p-4 gap-2">
        {/* JSON Input */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0">
            JSON Invoer
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-accent/50 px-4 py-6 text-center transition-colors hover:border-primary/30 hover:bg-accent cursor-pointer">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Sleep een JSON-bestand</p>
              <p className="text-xs text-muted-foreground">of klik om te bladeren</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                ✓ Valideer
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                {"{ } Format"}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* ATW Regels */}
        <CollapsibleSection title="ATW Regels" icon={<ShieldCheck className="h-4 w-4" />} defaultOpen>
          <div className="space-y-1">
            <RuleRow label="Max dienstduur" sublabel="Max minuten per dienst" value={720} />
            <RuleRow label="Max nachtdienst" sublabel="Max minuten nachtdienst" value={600} />
            <RuleRow label="Max weekuren" sublabel="Max minuten per week" value={3600} />
            <RuleRow label="Min rust tussen diensten" sublabel="Min minuten rust" value={660} />
            <RuleRow label="Verkorte rust" sublabel="Min verkorte rust (1x per week)" value={480} enabled={false} />
            <RuleRow label="Rust na nachtdienst" sublabel="Min minuten rust na nacht" value={840} />
          </div>
        </CollapsibleSection>

        <Separator />

        {/* Zachte Beperkingen */}
        <CollapsibleSection title="Zachte Beperkingen" icon={<Sparkles className="h-4 w-4" />}>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1.5">Minimaliseer dienstwisseling</p>
              <div className="flex gap-1">
                {["Uit", "Laag", "Middel", "Hoog"].map((level, i) => (
                  <Button
                    key={level}
                    variant={i === 2 ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs h-7"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Voorkeurste rotatie</p>
              <p className="text-xs text-muted-foreground">Vroeg → Dag → Laat → Nacht</p>
            </div>
          </div>
        </CollapsibleSection>

        <Separator />

        {/* Actions */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">
                    ▶ Oplossen
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Stuur naar API
                  </Button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
