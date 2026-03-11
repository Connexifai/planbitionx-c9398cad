import { useState } from "react";
import { SendHorizontal, Sparkles, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import robotImg from "@/assets/robot-assistant.png";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export function AiBriefingChat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: t("chat.initialMessage") },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: Date.now() + 1, role: "assistant", content: t("chat.constraintConfirm") },
    ]);
    setInput("");
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

        <div className="flex-1 overflow-y-auto roster-scroll space-y-4 px-2 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5", msg.role === "assistant" ? "bg-primary/10" : "bg-accent")}>
                {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className={cn("rounded-xl px-4 py-3 text-sm leading-relaxed", msg.role === "assistant" ? "bg-card border shadow-sm" : "bg-primary text-primary-foreground")}>
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={cn(i > 0 && "mt-1.5")}>
                    {line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, j) => {
                      if (part.startsWith("**") && part.endsWith("**")) return <strong key={j}>{part.slice(2, -2)}</strong>;
                      if (part.startsWith("*") && part.endsWith("*")) return <em key={j}>{part.slice(1, -1)}</em>;
                      return <span key={j}>{part}</span>;
                    })}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-background pt-4 pb-3 px-4 border-t border-border">
          <div className="flex items-center gap-1 mb-2">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{t("chat.sendMessage")}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-card px-4 py-3 shadow-md focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("chat.briefingPlaceholder")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <Button size="sm" className="shrink-0 gap-1.5" onClick={handleSend} disabled={!input.trim()}>
              <SendHorizontal className="h-4 w-4" />
              {t("chat.send")}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center" dangerouslySetInnerHTML={{ __html: t("chat.briefingFooter") }} />
        </div>
      </div>
    </div>
  );
}
