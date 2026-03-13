import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ArrowRight, Clock, Smartphone } from "lucide-react";
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
    return format(parseISO(iso), "EEE d MMM", { locale: nl });
  } catch {
    return iso.split("T")[0] || "";
  }
}

function formatTime(start?: string, end?: string) {
  const s = start?.split("T")[1]?.slice(0, 5) || "";
  const e = end?.split("T")[1]?.slice(0, 5) || "";
  return e ? `${s} – ${e}` : s;
}

function IPhoneFrame({ employee, onApprove, onReject, isActive }: {
  employee: AffectedEmployee;
  onApprove: () => void;
  onReject: () => void;
  isActive: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-3 transition-all duration-500",
      isActive ? "scale-100 opacity-100" : "scale-95 opacity-60"
    )}>
      {/* Employee name label */}
      <div className="flex items-center gap-2">
        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{employee.name}</span>
      </div>

      {/* iPhone frame */}
      <div className="relative w-[220px] h-[440px] rounded-[2.5rem] border-[3px] border-foreground/20 bg-background shadow-2xl overflow-hidden">
        {/* Notch / Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground/90 rounded-full z-10" />
        
        {/* Screen content */}
        <div className="absolute inset-[3px] rounded-[2.2rem] overflow-hidden bg-card flex flex-col">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2 text-[9px] text-muted-foreground">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 rounded-sm bg-foreground/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
            </div>
          </div>

          {/* App header */}
          <div className="px-4 py-2 border-b border-border/50">
            <div className="text-[10px] font-bold text-primary">Planbition X</div>
            <div className="text-[8px] text-muted-foreground">Roosterwijziging</div>
          </div>

          {/* Notification content */}
          <div className="flex-1 px-3 py-3 flex flex-col gap-2 overflow-y-auto">
            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
              <p className="text-[10px] font-semibold text-foreground mb-2">
                Er is een roosterwijziging voor jou:
              </p>
              {employee.changes.map((change, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-md mb-1",
                    change.Action === "added"
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  <span className="font-bold w-2">{change.Action === "added" ? "+" : "−"}</span>
                  <span className="font-medium">{change.ShiftName}</span>
                  {change.Start && (
                    <span className="ml-auto text-[8px] opacity-70">
                      {formatDate(change.Start)} {formatTime(change.Start, change.End)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[9px] text-muted-foreground text-center px-2">
              Ga je akkoord met deze wijziging?
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-3 pb-4 pt-2 border-t border-border/50">
            {employee.status === "pending" && isActive ? (
              <div className="flex gap-2">
                <button
                  onClick={onReject}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-destructive/10 text-destructive text-[10px] font-semibold hover:bg-destructive/20 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Afwijzen
                </button>
                <button
                  onClick={onApprove}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Akkoord
                </button>
              </div>
            ) : employee.status === "approved" ? (
              <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Akkoord gegeven ✓
              </div>
            ) : employee.status === "rejected" ? (
              <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/10 text-destructive text-[10px] font-semibold">
                <XCircle className="h-3.5 w-3.5" />
                Afgewezen ✗
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-muted-foreground text-[10px]">
                <Clock className="h-3 w-3" />
                Wacht op beurt...
              </div>
            )}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2">
            <div className="w-16 h-1 rounded-full bg-foreground/20" />
          </div>
        </div>
      </div>

      {/* Status badge below phone */}
      <Badge
        variant={
          employee.status === "approved" ? "default" :
          employee.status === "rejected" ? "destructive" :
          "secondary"
        }
        className="text-[10px]"
      >
        {employee.status === "approved" ? "✓ Akkoord" :
         employee.status === "rejected" ? "✗ Afgewezen" :
         "Wachtend"}
      </Badge>
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

  // Build affected employees from alternative changes
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

    // Check if this was the last one
    if (index === employees.length - 1) {
      // All approved
      setPhase("done");
      setTimeout(() => {
        onOpenChange(false);
        if (alternative) onAllApproved(alternative);
      }, 1500);
    } else {
      // Move to next
      setTimeout(() => setActiveIndex(index + 1), 600);
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

  const approvedCount = employees.filter((e) => e.status === "approved").length;
  const totalCount = employees.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-fit max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Goedkeuring medewerkers
          </DialogTitle>
          <DialogDescription>
            Elke betrokken medewerker moet akkoord geven op de wijziging. ({approvedCount}/{totalCount} akkoord)
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${totalCount > 0 ? (approvedCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        {/* iPhone mockups grid */}
        <div className="flex flex-wrap justify-center gap-6 py-4">
          {employees.map((emp, i) => (
            <IPhoneFrame
              key={emp.id}
              employee={emp}
              isActive={i === activeIndex && phase === "approving"}
              onApprove={() => handleApprove(i)}
              onReject={() => handleReject(i)}
            />
          ))}
        </div>

        {/* All approved celebration */}
        {phase === "done" && (
          <div className="flex items-center justify-center gap-2 py-3 text-primary font-semibold animate-fade-in">
            <CheckCircle2 className="h-5 w-5" />
            Alle medewerkers akkoord! Wijziging wordt doorgevoerd...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
