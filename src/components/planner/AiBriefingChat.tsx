import { useState } from "react";
import { SendHorizontal, Sparkles, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const mockMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hallo! Ik ben je AI-planningsassistent. Vertel me welke extra eisen of wensen je hebt voor het rooster, dan neem ik die mee bij het oplossen.\n\nBijvoorbeeld:\n- *\"Jan Bakker mag geen nachtdiensten draaien\"*\n- *\"Minimaal 3 medewerkers per shift op zaterdag\"*\n- *\"Probeer Marie en Thomas niet samen in te plannen\"*",
  },
  {
    id: 2,
    role: "user",
    content: "Franz-Xaver mag volgende week geen nachtdiensten draaien vanwege een medische afspraak op dinsdag.",
  },
  {
    id: 3,
    role: "assistant",
    content:
      "Begrepen! Ik heb genoteerd:\n\n✅ **Franz-Xaver Bachmann** — geen nachtdiensten in de planningsperiode\n\nDit wordt als harde constraint meegenomen bij het oplossen. Heb je nog meer aanpassingen?",
  },
  {
    id: 4,
    role: "user",
    content: "Zorg dat er op zaterdag en zondag minimaal 4 medewerkers ingepland staan per shift.",
  },
  {
    id: 5,
    role: "assistant",
    content:
      "Genoteerd!\n\n✅ **Weekend minimumbezetting** — ≥4 medewerkers per shift op za/zo\n\nJe hebt nu 2 extra constraints:\n1. Franz-Xaver: geen nachtdiensten\n2. Weekend: min. 4 per shift\n\nKlik op **▶ Oplossen** wanneer je klaar bent, dan worden deze meegenomen.",
  },
];

export function AiBriefingChat() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "✅ Begrepen, ik neem dit mee als extra constraint bij het oplossen.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-5 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Briefing</h2>
          <p className="text-xs text-muted-foreground">
            Geef instructies mee voor de solver voordat je op Oplossen klikt
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto roster-scroll space-y-4 px-2 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5",
                msg.role === "assistant"
                  ? "bg-primary/10"
                  : "bg-accent"
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
              {msg.content.split("\n").map((line, i) => (
                <p key={i} className={cn(i > 0 && "mt-1.5")}>
                  {line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**"))
                      return <strong key={j}>{part.slice(2, -2)}</strong>;
                    if (part.startsWith("*") && part.endsWith("*"))
                      return <em key={j}>{part.slice(1, -1)}</em>;
                    return <span key={j}>{part}</span>;
                  })}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Input - sticky bottom */}
      <div className="bg-background pt-4 pb-3 px-2 border-t border-border min-h-[108px]">
        <div className="flex items-center gap-1 mb-2">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Stuur een bericht naar de AI-assistent</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-card px-4 py-3 shadow-md focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Bijv. 'Jan mag geen nachtdiensten draaien volgende week...'"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <Button
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <SendHorizontal className="h-4 w-4" />
            Verstuur
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Klik op <strong>▶ Oplossen</strong> in de sidebar om het rooster te genereren met deze constraints
        </p>
      </div>
    </div>
  );
}
