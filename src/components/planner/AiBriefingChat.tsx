import { useState, useRef, useEffect } from "react";
import { SendHorizontal, User, Loader2, AlertTriangle, CheckCircle2, X } from "lucide-react";
import robotImg from "@/assets/robot-assistant.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

export interface EmployeeConstraint {
  employeeName: string;
  personId: number;
  constraint: {
    type: "avoid_day" | "avoid_shift_kind" | "avoid_date";
    dayOfWeek?: number;
    shiftKind?: string;
    date?: string;
    strength?: "soft" | "hard";
  };
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface AiBriefingChatProps {
  employees: any[];
  schedulePeriod: string;
  constraints: EmployeeConstraint[];
  onConstraintsChange: (constraints: EmployeeConstraint[]) => void;
}

const dayNames = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const shiftKindNames: Record<string, string> = { early: "Vroeg", day: "Dag", late: "Laat", night: "Nacht" };

function ConstraintTag({ c, onRemove }: { c: EmployeeConstraint; onRemove: () => void }) {
  const nameParts = c.employeeName.split(",");
  const shortName = nameParts.length > 1 ? `${nameParts[0].trim()}` : c.employeeName;

  let detail = "";
  if (c.constraint.type === "avoid_day") detail = dayNames[c.constraint.dayOfWeek ?? 0];
  if (c.constraint.type === "avoid_shift_kind") detail = shiftKindNames[c.constraint.shiftKind ?? ""] || c.constraint.shiftKind || "";
  if (c.constraint.type === "avoid_date") detail = c.constraint.date ?? "";

  const isHard = c.constraint.strength === "hard";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 text-xs py-1 px-2",
        isHard ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"
      )}
    >
      <span className="font-semibold">{shortName}</span>
      <span className="opacity-70">·</span>
      <span>{detail}</span>
      <span className="opacity-50">({isHard ? "hard" : "soft"})</span>
      <button onClick={onRemove} className="ml-0.5 hover:opacity-100 opacity-60">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

export function AiBriefingChat({ employees, schedulePeriod, constraints, onConstraintsChange }: AiBriefingChatProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: t("chat.initialMessage") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history for AI
      const chatHistory = [...messages, userMsg]
        .filter((m) => m.id !== 1) // skip initial system message
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-constraints`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: chatHistory,
            employees,
            schedulePeriod,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Fout" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      // Add AI response
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.message || t("chat.constraintConfirm"),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Add new constraints
      if (data.constraints && data.constraints.length > 0) {
        onConstraintsChange([...constraints, ...data.constraints]);
      }
    } catch (error) {
      console.error("Parse constraints error:", error);
      const errMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: `⚠️ Er ging iets mis: ${error instanceof Error ? error.message : "Onbekende fout"}. Probeer het opnieuw.`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const removeConstraint = (index: number) => {
    onConstraintsChange(constraints.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex justify-center">
      <div className="flex flex-col h-full min-w-0 max-w-3xl w-full px-5 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">{t("chat.briefingTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("chat.briefingSubtitle")}</p>
          </div>
        </div>

        {/* Active constraints bar */}
        {constraints.length > 0 && (
          <div className="mb-3 p-3 rounded-xl border border-border/50 bg-card shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">
                {constraints.length} constraint{constraints.length > 1 ? "s" : ""} actief
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {constraints.map((c, i) => (
                <ConstraintTag key={i} c={c} onRemove={() => removeConstraint(i)} />
              ))}
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto roster-scroll space-y-4 px-2 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 overflow-hidden", msg.role === "assistant" ? "bg-primary/10" : "bg-accent")}>
                {msg.role === "assistant" ? <img src={robotImg} alt="AI" className="h-10 w-10 object-cover object-top scale-[2.2] -translate-y-3" /> : <User className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className={cn("rounded-xl px-4 py-3 text-sm leading-relaxed", msg.role === "assistant" ? "bg-card border shadow-sm" : "bg-primary text-primary-foreground")}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 bg-primary/10 overflow-hidden">
                <img src={robotImg} alt="AI" className="h-10 w-10 object-cover object-top scale-[2.2] -translate-y-3" />
              </div>
              <div className="rounded-xl px-4 py-3 text-sm bg-card border shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-background pt-4 pb-3 px-4 border-t border-border">
          <div className="flex items-center gap-1 mb-2">
            <img src={robotImg} alt="AI" className="h-6 w-6 object-cover object-top scale-[1.8] -translate-y-0.5" />
            <span className="text-xs font-medium text-muted-foreground">{t("chat.sendMessage")}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-card px-4 py-3 shadow-md focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={t("chat.briefingPlaceholder")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              disabled={loading}
            />
            <Button size="sm" className="shrink-0 gap-1.5" onClick={handleSend} disabled={!input.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              {t("chat.send")}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center" dangerouslySetInnerHTML={{ __html: t("chat.briefingFooter") }} />
        </div>
      </div>
    </div>
  );
}
