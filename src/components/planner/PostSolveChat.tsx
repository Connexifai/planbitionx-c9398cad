import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Bot, User, ArrowRightLeft, Lightbulb, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import robotImg from "@/assets/robot-assistant.png";
import { buildAlternativesPayload, normalizeAlternativeShiftIds } from "@/lib/buildAlternativesPayload";
import type { AlternativeConstraint, Alternative, AlternativesResponse } from "@/lib/buildAlternativesPayload";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  alternatives?: Alternative[];
  baseline?: AlternativesResponse["Baseline"];
}

export interface PostSolveChatProps {
  requestData: any;
  solverAssignments: any[];
  onApplyAlternative?: (alternative: Alternative) => void;
}

export function PostSolveChat({ requestData, solverAssignments, onApplyAlternative }: PostSolveChatProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: t("chat.postSolveInitial"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Step 1: Parse intent via AI
      const parseRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-chat-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: msg,
            employees: requestData?.Employees || [],
            schedulePeriod: requestData ? `${requestData.Start} - ${requestData.End}` : "",
          }),
        }
      );

      if (!parseRes.ok) throw new Error("Intent parsing failed");
      const intent = await parseRes.json();

      if (!intent.understood) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: `⚠️ ${intent.reason || "Ik kon je verzoek niet begrijpen. Kun je het anders formuleren?"}`,
          },
        ]);
        setIsTyping(false);
        return;
      }

      // Show understanding message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `✅ **Begrepen:** ${intent.summary}\n\n⏳ Ik zoek nu de beste alternatieven...`,
        },
      ]);

      // Step 2: Build constraint
      const constraint: AlternativeConstraint = {
        employeeId: String(intent.employeeId),
        employeeName: intent.employeeName,
        type: intent.constraintType,
        dayOfWeek: intent.dayOfWeek ?? undefined,
        date: intent.date ?? undefined,
        shiftKind: intent.shiftKind ?? undefined,
        strength: "hard",
      };

      // Step 3: Build payload and call alternatives endpoint
      const payload = buildAlternativesPayload(requestData, solverAssignments, constraint, 5);
      console.log("Alternatives payload:", JSON.stringify(payload, null, 2).slice(0, 3000));

      const altRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solve-alternatives`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!altRes.ok) {
        const errText = await altRes.text();
        throw new Error(`Alternatives API error: ${errText}`);
      }

      const altResponse: AlternativesResponse = await altRes.json();

      if (!altResponse.Alternatives || altResponse.Alternatives.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            role: "assistant",
            content: "❌ Helaas heb ik geen geldige alternatieven kunnen vinden die aan alle ATW-regels en kwalificatie-eisen voldoen. Probeer een andere dag of medewerker.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            role: "assistant",
            content: `Ik heb **${altResponse.Alternatives.length} alternatieve${altResponse.Alternatives.length === 1 ? "" : "n"}** gevonden, gerankt op het minste aantal wijzigingen:`,
            alternatives: altResponse.Alternatives,
            baseline: altResponse.Baseline,
          },
        ]);
      }
    } catch (error) {
      console.error("PostSolveChat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `❌ Er ging iets mis: ${error instanceof Error ? error.message : "Onbekende fout"}. Probeer het opnieuw.`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApplyAlternative = (alt: Alternative) => {
    onApplyAlternative?.(alt);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        content: `✅ **Alternatief ${alt.Rank} is doorgevoerd!** Het rooster is bijgewerkt met ${alt.ChangesFromBaseline} wijziging${alt.ChangesFromBaseline === 1 ? "" : "en"}.`,
      },
    ]);
  };

  const dayNames = ["ma", "di", "wo", "do", "vr", "za", "zo"];

  const examplePrompts = [
    {
      icon: ArrowRightLeft,
      label: t("chat.shiftSwap"),
      prompt: t("chat.shiftSwapPrompt"),
    },
    {
      icon: Lightbulb,
      label: t("chat.findAlternative"),
      prompt: t("chat.findAlternativePrompt"),
    },
  ];

  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full flex-1 min-w-0 max-w-3xl">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto roster-scroll space-y-4 px-5 pt-4 min-h-0"
        >
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5",
                    msg.role === "assistant" ? "bg-primary/10" : "bg-accent"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "assistant"
                      ? "bg-card border shadow-sm"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Alternatives cards */}
              {msg.alternatives && msg.alternatives.length > 0 && (
                <div className="mt-3 space-y-3 ml-11">
                  {msg.baseline && (
                    <div className="text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-lg inline-block">
                      Huidig rooster: {msg.baseline.TotalAssignments} toewijzingen · {msg.baseline.FillRatePercentage.toFixed(1)}% bezetting
                    </div>
                  )}
                  {msg.alternatives.map((alt) => (
                    <div
                      key={alt.Rank}
                      className={cn(
                        "border rounded-xl p-4 bg-card shadow-sm transition-all hover:shadow-md",
                        alt.Rank === 1 && "border-primary/40 ring-1 ring-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={alt.Rank === 1 ? "default" : "secondary"} className="text-xs">
                            #{alt.Rank}
                          </Badge>
                          {alt.Rank === 1 && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30">
                              ✅ Aanbevolen
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {alt.ChangesFromBaseline} wijziging{alt.ChangesFromBaseline !== 1 && "en"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {alt.Score.FillRatePercentage.toFixed(0)}% bezetting
                          </span>
                          <Button
                            size="sm"
                            variant={alt.Rank === 1 ? "default" : "outline"}
                            className="text-xs h-7"
                            onClick={() => handleApplyAlternative(alt)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Doorvoeren
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {alt.Changes.map((change, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md",
                              change.Action === "added"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                            )}
                          >
                            <span className="font-mono text-[10px]">
                              {change.Action === "added" ? "+" : "−"}
                            </span>
                            <span className="font-medium">{change.EmployeeName}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>{change.ShiftName}</span>
                            {change.Start && (
                              <span className="text-muted-foreground text-[10px]">
                                ({change.Start.split("T")[1]?.slice(0, 5)}–{change.End?.split("T")[1]?.slice(0, 5)})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-xl px-4 py-3 text-sm bg-card border shadow-sm">
                <div className="flex gap-1.5 items-center text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="ml-2 text-xs">{t("chat.analyzing")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Example prompts */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {examplePrompts.map((ep) => (
                <button
                  key={ep.label}
                  onClick={() => handleSend(ep.prompt)}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm hover:bg-accent hover:border-primary/30 transition-all shadow-sm"
                >
                  <ep.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{ep.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-background pt-4 pb-3 px-5 border-t border-border">
          <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-card px-4 py-3 shadow-md focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSend()}
              placeholder={t("chat.postSolvePlaceholder")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              disabled={isTyping}
            />
            <Button
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
            >
              <SendHorizontal className="h-4 w-4" />
              {t("chat.send")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
