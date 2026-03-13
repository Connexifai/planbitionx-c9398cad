import { useState, useRef, useEffect, useCallback } from "react";
import { SendHorizontal, Bot, User, CheckCircle2, UserPlus, Repeat2, GitBranch, Search, AlertCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { buildAlternativesPayload, getRemovedAssignments } from "@/lib/buildAlternativesPayload";
import type { AlternativeConstraint, Alternative, AlternativesResponse, AlternativeChange, SearchScope } from "@/lib/buildAlternativesPayload";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { EmployeeApprovalDialog } from "./EmployeeApprovalDialog";

interface CandidateEmployee {
  id: string;
  name: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  alternatives?: Alternative[];
  baseline?: AlternativesResponse["Baseline"];
  constraintSummary?: string;
  showSearchFull?: boolean;
  pendingConstraint?: AlternativeConstraint;
  /** Disambiguation candidates */
  candidates?: CandidateEmployee[];
  /** Original user message to retry after disambiguation */
  originalMessage?: string;
}

export interface PostSolveChatProps {
  requestData: any;
  solverAssignments: any[];
  onApplyAlternative?: (alternative: Alternative) => void;
}

// ─── Helpers to classify and explain alternatives ──────────────

type ChangeType = "direct_replacement" | "swap" | "chain";

interface ClassifiedAlternative {
  type: ChangeType;
  icon: typeof UserPlus;
  label: string;
  explanation: string;
}

function formatShiftDate(isoDate?: string): string {
  if (!isoDate) return "";
  try {
    return format(parseISO(isoDate), "EEEE d MMM", { locale: nl });
  } catch {
    return isoDate.split("T")[0] || "";
  }
}

function formatShiftTime(start?: string, end?: string): string {
  if (!start) return "";
  const s = start.split("T")[1]?.slice(0, 5) || "";
  const e = end?.split("T")[1]?.slice(0, 5) || "";
  return e ? `${s}–${e}` : s;
}

interface PreparedAlternatives {
  filledAlts: Alternative[];
  openAlt?: Alternative;
  visibleAlts: Alternative[];
}

function prepareAlternatives(alternatives: Alternative[]): PreparedAlternatives {
  const filledAlts = alternatives.filter((a) => a.ConflictShiftFilled !== false).slice(0, 5);
  const openAlt = alternatives.find((a) => a.ConflictShiftFilled === false);
  return {
    filledAlts,
    openAlt,
    visibleAlts: openAlt ? [...filledAlts, openAlt] : filledAlts,
  };
}

function formatAlternativeCount(prepared: PreparedAlternatives): string {
  if (prepared.filledAlts.length > 0) {
    return `${prepared.filledAlts.length} oplossing${prepared.filledAlts.length === 1 ? "" : "en"}`;
  }
  return prepared.openAlt ? "1 optie" : "0 oplossingen";
}

function classifyAlternative(alt: Alternative, constraintEmployee?: string): ClassifiedAlternative {
  // "Dienst open laten" option
  if (alt.ConflictShiftFilled === false) {
    return {
      type: "direct_replacement",
      icon: AlertCircle,
      label: "Dienst open laten",
      explanation: alt.Summary || "De dienst wordt niet opgevuld en blijft open.",
    };
  }

  const changes = alt.Changes || [];
  const added = changes.filter((c) => c.Action === "added");
  const removed = changes.filter((c) => c.Action === "removed");

  if (removed.length <= 1 && added.length >= 1 && added.length <= 2) {
    const replacers = [...new Set(added.map((c) => c.EmployeeName))];
    return {
      type: "direct_replacement",
      icon: UserPlus,
      label: "Directe vervanging",
      explanation: alt.Summary || (
        added.length === 1
          ? `${replacers[0]} neemt de dienst over op ${formatShiftDate(added[0].Start)}. Geen andere wijzigingen nodig.`
          : `${replacers.join(" en ")} nemen de dienst${added.length > 1 ? "en" : ""} over. Geen verdere impact op het rooster.`
      ),
    };
  }

  if (removed.length === 1 && added.length === 1 && removed[0].ShiftId === added[0].ShiftId) {
    return {
      type: "swap",
      icon: Repeat2,
      label: "Dienstruil",
      explanation: alt.Summary || `${removed[0].EmployeeName} en ${added[0].EmployeeName} wisselen van dienst op ${formatShiftDate(added[0].Start)}.`,
    };
  }

  const uniqueEmployees = [...new Set(changes.map((c) => c.EmployeeName))];
  const uniqueDays = [...new Set(changes.filter((c) => c.Start).map((c) => formatShiftDate(c.Start)))];

  return {
    type: "chain",
    icon: GitBranch,
    label: "Ketenaanpassing",
    explanation: alt.Summary || (
      uniqueDays.length > 1
        ? `Herschikking over ${uniqueDays.length} dagen met ${uniqueEmployees.length} medewerker${uniqueEmployees.length > 1 ? "s" : ""}: ${uniqueEmployees.join(", ")}.`
        : `Meervoudige aanpassing met ${uniqueEmployees.length} medewerker${uniqueEmployees.length > 1 ? "s" : ""}: ${uniqueEmployees.join(", ")}.`
    ),
  };
}

// ─── Main component ────────────────────────────────────────────

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
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAlternative, setApprovalAlternative] = useState<Alternative | null>(null);
  const [lastConstraint, setLastConstraint] = useState<AlternativeConstraint | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /** Shared function to call the alternatives endpoint and enrich results */
  const fetchAlternatives = useCallback(async (
    constraint: AlternativeConstraint,
    scope: SearchScope
  ): Promise<AlternativesResponse> => {
    console.log("[PostSolveChat] solverAssignments count:", solverAssignments?.length, "sample:", JSON.stringify(solverAssignments?.slice(0, 2)));
    const payload = buildAlternativesPayload(requestData, solverAssignments, constraint, 10, scope);
    console.log("[PostSolveChat] payload employee sample AssignedShifts:", payload?.Employees?.slice(0, 3)?.map((e: any) => ({ name: e.Name, assigned: e.AssignedShifts?.length })));

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

    const response: AlternativesResponse = await altRes.json();
    return response;
  }, [requestData, solverAssignments]);

  /** Handle "Zoek verder" — re-search with full scope */
  const handleSearchFull = useCallback(async (constraint: AlternativeConstraint, messageId: number) => {
    // Remove the "zoek verder" button from the message
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, showSearchFull: false } : m)
    );
    setIsTyping(true);

    try {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content: "🔍 Breder zoeken met alle medewerkers en diensten...",
        },
      ]);

      const altResponse = await fetchAlternatives(constraint, "full");
      const prepared = prepareAlternatives(altResponse.Alternatives || []);

      if (prepared.visibleAlts.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: "❌ Ook met een breder zoekbereik zijn er geen extra alternatieven gevonden.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: `🔎 Met een breder zoekbereik heb ik **${formatAlternativeCount(prepared)}** gevonden:`,
            alternatives: prepared.visibleAlts,
            baseline: altResponse.Baseline,
          },
        ]);
      }
    } catch (error) {
      console.error("Full search error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `❌ Er ging iets mis bij het uitgebreid zoeken: ${error instanceof Error ? error.message : "Onbekende fout"}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [fetchAlternatives]);

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
        if (intent.ambiguous && intent.candidates?.length > 0) {
          // Ambiguous — ask user to pick
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: `🤔 Er zijn meerdere medewerkers met die naam. Wie bedoel je?`,
              candidates: intent.candidates,
              originalMessage: msg,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: `⚠️ ${intent.reason || "Ik kon je verzoek niet begrijpen. Kun je het anders formuleren?"}`,
            },
          ]);
        }
        setIsTyping(false);
        return;
      }

      // Show understanding message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `✅ **Begrepen:** ${intent.summary}\n\n⏳ Ik zoek nu snel de beste lokale alternatieven...`,
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
      setLastConstraint(constraint);

      // Pre-check: does the employee actually have conflicting shifts?
      const removedShifts = getRemovedAssignments(
        solverAssignments,
        constraint,
        requestData?.Shifts || []
      );

      if (removedShifts.length === 0) {
        const dayNames = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
        let detail = "";
        if (constraint.type === "avoid_day" && constraint.dayOfWeek !== undefined) {
          detail = `op ${dayNames[constraint.dayOfWeek]}`;
        } else if (constraint.type === "avoid_date" && constraint.date) {
          detail = `op ${constraint.date}`;
        } else if (constraint.type === "avoid_shift_kind" && constraint.shiftKind) {
          detail = `in een ${constraint.shiftKind}-dienst`;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            role: "assistant",
            content: `ℹ️ **${constraint.employeeName}** is in het huidige rooster niet ingepland ${detail}. Er is dus geen conflict om op te lossen.\n\nProbeer een andere medewerker of dag.`,
          },
        ]);
        setIsTyping(false);
        return;
      }

      // Step 3: First search with "narrow" scope (fast, local solutions)
      const altResponse = await fetchAlternatives(constraint, "narrow");
      const narrowPrepared = prepareAlternatives(altResponse.Alternatives || []);
      const resultMsgId = Date.now() + 2;

      if (narrowPrepared.visibleAlts.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: resultMsgId,
            role: "assistant",
            content: "⚠️ Geen directe alternatieven gevonden in de directe omgeving. Wil je breder zoeken?",
            showSearchFull: true,
            pendingConstraint: constraint,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: resultMsgId,
            role: "assistant",
            content: `Ik heb **${formatAlternativeCount(narrowPrepared)}** gevonden in de directe omgeving:`,
            alternatives: narrowPrepared.visibleAlts,
            baseline: altResponse.Baseline,
            constraintSummary: intent.summary,
            showSearchFull: true,
            pendingConstraint: constraint,
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
        content: `✅ **Alternatief #${alt.Rank} wordt doorgevoerd!** Bekijk het rooster voor de stapsgewijze animatie van ${alt.ChangesFromBaseline} wijziging${alt.ChangesFromBaseline === 1 ? "" : "en"}.`,
      },
    ]);
  };

  const handleSolveForMe = (alt: Alternative) => {
    setApprovalAlternative(alt);
    setApprovalDialogOpen(true);
  };

  const handleAllApproved = (alt: Alternative) => {
    onApplyAlternative?.(alt);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        content: `✅ **Alle medewerkers akkoord!** Alternatief #${alt.Rank} wordt doorgevoerd met ${alt.ChangesFromBaseline} wijziging${alt.ChangesFromBaseline === 1 ? "" : "en"}. Bekijk het rooster voor de animatie.`,
      },
    ]);
  };

  const handleRejected = async (rejectedByName: string, _rejectedById: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        content: `❌ **${rejectedByName}** heeft de wijziging afgewezen. Ik zoek automatisch een nieuw alternatief zonder ${rejectedByName}...`,
      },
    ]);
    setIsTyping(true);

    try {
      if (!lastConstraint) throw new Error("Geen constraint beschikbaar voor opnieuw zoeken.");

      // Search with full scope to find more options
      const altResponse = await fetchAlternatives(lastConstraint, "full");
      const allAlts = altResponse.Alternatives || [];
      // Filter out alternatives that involve the rejecting employee
      const filteredAlts = allAlts.filter((a) => {
        const changes = a.Changes || [];
        return !changes.some((c) => c.EmployeeName === rejectedByName);
      });
      const prepared = prepareAlternatives(filteredAlts);

      if (prepared.visibleAlts.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: `⚠️ Geen alternatieven gevonden zonder ${rejectedByName}. Probeer een andere aanpassing of laat de dienst open.`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: `🔎 **${formatAlternativeCount(prepared)}** gevonden zonder ${rejectedByName}:`,
            alternatives: prepared.visibleAlts,
            baseline: altResponse.Baseline,
          },
        ]);
      }
    } catch (error) {
      console.error("Re-search after rejection error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `❌ Er ging iets mis bij het opnieuw zoeken: ${error instanceof Error ? error.message : "Onbekende fout"}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };




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
                    <div className="text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-lg inline-flex items-center gap-2">
                      <span>📊 Huidig rooster: {msg.baseline.TotalAssignments} toewijzingen · {msg.baseline.FillRatePercentage.toFixed(1)}% bezetting</span>
                    </div>
                  )}
                  {msg.alternatives.map((alt) => {
                    const classified = classifyAlternative(alt, msg.constraintSummary);
                    const TypeIcon = classified.icon;
                    const isOpenShift = alt.ConflictShiftFilled === false;

                    return (
                      <div
                        key={alt.Rank}
                        className={cn(
                          "border rounded-xl overflow-hidden bg-card shadow-sm transition-all hover:shadow-md",
                          alt.Rank === 1 && !isOpenShift && "border-primary/40 ring-1 ring-primary/20",
                          isOpenShift && "border-dashed border-muted-foreground/30 opacity-80"
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pt-3 pb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={alt.Rank === 1 && !isOpenShift ? "default" : "secondary"} className="text-xs">
                              #{alt.Rank}
                            </Badge>
                            <div className={cn(
                              "flex items-center gap-1.5 text-xs font-medium",
                              isOpenShift ? "text-muted-foreground" : "text-foreground"
                            )}>
                              <TypeIcon className={cn("h-3.5 w-3.5", isOpenShift ? "text-muted-foreground" : "text-primary")} />
                              {classified.label}
                            </div>
                            {alt.Rank === 1 && !isOpenShift && (
                              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                                Aanbevolen
                              </Badge>
                            )}
                            {isOpenShift && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">
                                Geen vervanging
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span>{alt.ChangesFromBaseline} wijziging{alt.ChangesFromBaseline !== 1 && "en"}</span>
                              {alt.Score && (
                                <>
                                  <span>·</span>
                                  <span>{alt.Score.FillRatePercentage.toFixed(0)}% bezetting</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="px-4 pb-2">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {isOpenShift ? "⚠️" : "💡"} {classified.explanation}
                          </p>
                        </div>

                        {/* Changes detail */}
                        {alt.Changes && alt.Changes.length > 0 && (
                          <div className="px-4 pb-3 space-y-1">
                            {alt.Changes.map((change, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md",
                                  change.Action === "added"
                                    ? "bg-primary/5 text-primary dark:text-primary"
                                    : "bg-destructive/5 text-destructive dark:text-destructive"
                                )}
                              >
                                <span className="font-mono text-[10px] font-bold w-3">
                                  {change.Action === "added" ? "+" : "−"}
                                </span>
                                {change.EmployeeName && <span className="font-medium">{change.EmployeeName}</span>}
                                {change.EmployeeName && change.ShiftName && <span className="text-muted-foreground">→</span>}
                                {change.ShiftName && <span>{change.ShiftName}</span>}
                                {change.Start && (
                                  <span className="text-muted-foreground text-[10px] ml-auto">
                                    {formatShiftDate(change.Start)} ({formatShiftTime(change.Start, change.End)})
                                  </span>
                                )}
                              </div>
                            ))}
                            {/* Show Reason from solver if available */}
                            {alt.Changes.some((c) => c.Reason) && (
                              <div className="mt-1 px-2.5 py-1 text-[10px] text-muted-foreground italic">
                                {alt.Changes.filter((c) => c.Reason).map((c, i) => (
                                  <div key={i}>📝 {c.Reason}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="border-t px-4 py-2.5 bg-muted/30 flex justify-end gap-2">
                          {!isOpenShift && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1.5"
                              onClick={() => handleSolveForMe(alt)}
                            >
                              <Smartphone className="h-3 w-3" />
                              Los het op voor mij
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={isOpenShift ? "outline" : alt.Rank === 1 ? "default" : "outline"}
                            className="text-xs h-7 gap-1.5"
                            onClick={() => handleApplyAlternative(alt)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {isOpenShift ? "Dienst open laten" : "Doorvoeren"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disambiguation candidates */}
              {msg.candidates && msg.candidates.length > 0 && (
                <div className="mt-3 ml-11 flex flex-wrap gap-2">
                  {msg.candidates.map((c) => (
                    <Button
                      key={c.id}
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      disabled={isTyping}
                      onClick={() => {
                        // Replace the original message with the full name and re-send
                        const original = msg.originalMessage || "";
                        // Build a clarified message using the full name
                        const clarified = original.replace(
                          /\b\w+\b/i,
                          (match) => {
                            // Replace the first word that partially matches the candidate name
                            if (c.name.toLowerCase().includes(match.toLowerCase())) return c.name;
                            return match;
                          }
                        );
                        // If no replacement happened, just prepend the full name
                        const finalMsg = clarified === original
                          ? `${c.name}: ${original}`
                          : clarified;
                        // Remove candidates from this message
                        setMessages((prev) =>
                          prev.map((m) => m.id === msg.id ? { ...m, candidates: undefined } : m)
                        );
                        handleSend(finalMsg);
                      }}
                    >
                      👤 {c.name}
                    </Button>
                  ))}
                </div>
              )}

              {/* "Zoek verder" button */}
              {msg.showSearchFull && msg.pendingConstraint && (
                <div className="mt-3 ml-11">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    disabled={isTyping}
                    onClick={() => handleSearchFull(msg.pendingConstraint!, msg.id)}
                  >
                    <Search className="h-3.5 w-3.5" />
                    🔍 Zoek verder (breder zoekbereik)
                  </Button>
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

      <EmployeeApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        alternative={approvalAlternative}
        onAllApproved={handleAllApproved}
        onRejected={handleRejected}
      />
    </div>
  );
}
