import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Battery, Wifi, Signal } from "lucide-react";
import type { Alternative, AlternativeChange } from "@/lib/buildAlternativesPayload";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface AffectedEmployee {
  id: string;
  name: string;
  changes: AlternativeChange[];
  status: "pending" | "approved" | "rejected";
}

interface EmployeeApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternative: Alternative | null;
  onAllApproved: (alt: Alternative) => void;
  onRejected: (rejectedByName: string, rejectedById: string) => void;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "EEEE d MMMM", { locale: nl });
  } catch {
    return iso.split("T")[0] || "";
  }
}

function formatTime(start?: string, end?: string) {
  const s = start?.split("T")[1]?.slice(0, 5) || "";
  const e = end?.split("T")[1]?.slice(0, 5) || "";
  return e ? `${s} – ${e}` : s;
}

function IPhone17({ employee, onApprove, onReject }: {
  employee: AffectedEmployee;
  onApprove: () => void;
  onReject: () => void;
}) {
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="relative mx-auto animate-fade-in" style={{ width: 407, height: 833 }}>
      {/* Outer titanium frame */}
      <div
        className="absolute inset-0 rounded-[3.6rem]"
        style={{
          background: "linear-gradient(145deg, hsl(220 10% 25%), hsl(220 8% 35%), hsl(220 10% 28%))",
          boxShadow: `
            0 0 0 1px hsl(220 10% 20%),
            0 25px 60px -10px rgba(0,0,0,0.5),
            0 10px 30px -5px rgba(0,0,0,0.3),
            inset 0 1px 0 hsl(220 10% 40%)
          `,
        }}
      >
        {/* Side buttons - volume */}
        <div className="absolute -left-[3px] top-[155px] w-[3px] h-[34px] rounded-l-sm" style={{ background: "hsl(220 10% 30%)" }} />
        <div className="absolute -left-[3px] top-[205px] w-[3px] h-[34px] rounded-l-sm" style={{ background: "hsl(220 10% 30%)" }} />
        {/* Side button - power */}
        <div className="absolute -right-[3px] top-[190px] w-[3px] h-[52px] rounded-r-sm" style={{ background: "hsl(220 10% 30%)" }} />

        {/* Screen bezel area */}
        <div className="absolute inset-[3px] rounded-[3rem] bg-black overflow-hidden">
          {/* Actual screen */}
          <div className="absolute inset-[1px] rounded-[2.9rem] overflow-hidden bg-background flex flex-col">

            {/* Dynamic Island */}
            <div className="relative flex justify-center pt-[10px] pb-[2px] z-20">
              <div
                className="w-[100px] h-[28px] bg-black rounded-full flex items-center justify-center gap-2"
                style={{ boxShadow: "0 0 0 0.5px hsl(0 0% 15%)" }}
              >
                {/* Camera dot */}
                <div className="w-[10px] h-[10px] rounded-full" style={{
                  background: "radial-gradient(circle at 35% 35%, hsl(220 20% 25%), hsl(220 20% 8%))",
                  boxShadow: "inset 0 0 2px rgba(255,255,255,0.1)",
                }} />
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-7 pt-[2px] pb-[6px]">
              <span className="text-[12px] font-semibold text-foreground tracking-tight">{timeStr}</span>
              <div className="flex items-center gap-[5px]">
                <Signal className="h-[13px] w-[13px] text-foreground" strokeWidth={2.5} />
                <Wifi className="h-[13px] w-[13px] text-foreground" strokeWidth={2.5} />
                <Battery className="h-[13px] w-[13px] text-foreground" strokeWidth={2.5} />
              </div>
            </div>

            {/* App content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* iOS notification banner style */}
              <div className="mx-3 mt-1 mb-2">
                <div className="rounded-2xl bg-card border border-border/60 shadow-lg overflow-hidden" style={{
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  {/* App header bar */}
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-primary/5 border-b border-border/40">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-[10px] font-black text-primary-foreground">PX</span>
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-foreground leading-tight">Planbition X</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Roosterwijziging</div>
                    </div>
                    <div className="ml-auto text-[10px] text-muted-foreground">nu</div>
                  </div>

                  {/* Message content */}
                  <div className="px-4 py-3 space-y-3">
                    <p className="text-[13px] font-medium text-foreground leading-snug">
                      Hoi {employee.name.split(" ")[0]} 👋
                    </p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      Er is een roosterwijziging waar jouw akkoord voor nodig is:
                    </p>

                    {/* Changes */}
                    <div className="space-y-1.5">
                      {employee.changes.map((change, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]",
                            change.Action === "added"
                              ? "bg-primary/8 border border-primary/15"
                              : "bg-destructive/8 border border-destructive/15"
                          )}
                        >
                          <span className={cn(
                            "text-[13px] font-bold w-4 text-center",
                            change.Action === "added" ? "text-primary" : "text-destructive"
                          )}>
                            {change.Action === "added" ? "+" : "−"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-foreground">{change.ShiftName}</span>
                            {change.Start && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {formatDate(change.Start)} · {formatTime(change.Start, change.End)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[12px] text-muted-foreground text-center pt-1">
                      Ga je akkoord met deze wijziging?
                    </p>
                  </div>

                  {/* iOS-style action buttons */}
                  <div className="border-t border-border/40">
                    {employee.status === "pending" ? (
                      <div className="flex divide-x divide-border/40">
                        <button
                          onClick={onReject}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-destructive text-[14px] font-medium active:bg-muted/50 transition-colors"
                        >
                          Afwijzen
                        </button>
                        <button
                          onClick={onApprove}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-primary text-[14px] font-semibold active:bg-muted/50 transition-colors"
                        >
                          Akkoord
                        </button>
                      </div>
                    ) : employee.status === "approved" ? (
                      <div className="flex items-center justify-center gap-2 py-3.5 text-primary text-[14px] font-semibold animate-fade-in">
                        <CheckCircle2 className="h-4 w-4" />
                        Akkoord gegeven
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3.5 text-destructive text-[14px] font-semibold animate-fade-in">
                        <XCircle className="h-4 w-4" />
                        Afgewezen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* iOS wallpaper-ish background fill */}
              <div className="flex-1" />
            </div>

            {/* Home indicator */}
            <div className="flex justify-center pb-[8px] pt-[4px]">
              <div className="w-[120px] h-[4px] rounded-full bg-foreground/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmployeeApprovalDialog({
  open,
  onOpenChange,
  alternative,
  onAllApproved,
  onRejected,
}: EmployeeApprovalDialogProps) {
  const [employees, setEmployees] = useState<AffectedEmployee[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"approving" | "done">("approving");

  useEffect(() => {
    if (!alternative || !open) return;
    const changes = alternative.Changes || [];
    const empMap = new Map<string, AffectedEmployee>();

    for (const change of changes) {
      const id = String(change.EmployeeId);
      if (!empMap.has(id)) {
        empMap.set(id, {
          id,
          name: change.EmployeeName || `Medewerker ${id}`,
          changes: [],
          status: "pending",
        });
      }
      empMap.get(id)!.changes.push(change);
    }

    setEmployees(Array.from(empMap.values()));
    setActiveIndex(0);
    setPhase("approving");
  }, [alternative, open]);

  const handleApprove = (index: number) => {
    setEmployees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: "approved" };
      return next;
    });

    if (index === employees.length - 1) {
      setPhase("done");
      setTimeout(() => {
        onOpenChange(false);
        if (alternative) onAllApproved(alternative);
      }, 1500);
    } else {
      setTimeout(() => setActiveIndex(index + 1), 800);
    }
  };

  const handleReject = (index: number) => {
    const emp = employees[index];
    setEmployees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: "rejected" };
      return next;
    });

    setTimeout(() => {
      onOpenChange(false);
      onRejected(emp.name, emp.id);
    }, 1200);
  };

  const activeEmployee = employees[activeIndex];
  const approvedCount = employees.filter((e) => e.status === "approved").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-0 border-none bg-transparent shadow-none [&>button]:hidden overflow-visible">
        <div className="flex flex-col items-center gap-5">
          {/* Header info above phone */}
          <div className="text-center space-y-1.5 animate-fade-in">
            <p className="text-sm font-semibold text-foreground">
              Goedkeuring vragen
            </p>
            <p className="text-xs text-muted-foreground">
              {activeEmployee?.name ?? ""} · {approvedCount}/{employees.length} akkoord
            </p>
            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 pt-1">
              {employees.map((emp, i) => (
                <div
                  key={emp.id}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-500",
                    emp.status === "approved" ? "bg-primary scale-100" :
                    emp.status === "rejected" ? "bg-destructive scale-100" :
                    i === activeIndex ? "bg-primary/60 scale-125" :
                    "bg-muted-foreground/30 scale-100"
                  )}
                />
              ))}
            </div>
          </div>

          {/* The iPhone */}
          {activeEmployee && (
            <IPhone17
              key={activeEmployee.id}
              employee={activeEmployee}
              onApprove={() => handleApprove(activeIndex)}
              onReject={() => handleReject(activeIndex)}
            />
          )}

          {/* All approved */}
          {phase === "done" && (
            <div className="flex items-center gap-2 text-primary font-semibold text-sm animate-fade-in">
              <CheckCircle2 className="h-5 w-5" />
              Alle medewerkers akkoord!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
