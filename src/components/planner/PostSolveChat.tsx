import { useState, useRef, useEffect } from "react";
import { SendHorizontal, User, ArrowRightLeft, Lightbulb } from "lucide-react";
import robotImg from "@/assets/robot-assistant.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const examplePrompts = [
  {
    icon: ArrowRightLeft,
    label: "Dienstruiling",
    prompt: "Franz-Xaver heeft gevraagd of hij woensdag vrij kan zijn. Hoe kan ik zijn dienst het beste opvangen?",
  },
  {
    icon: Lightbulb,
    label: "Alternatief zoeken",
    prompt: "Wie kan de nachtdienst van donderdag overnemen van Marie als zij ziek is?",
  },
];

const mockResponses: Record<string, string> = {
  default: `Ik heb het rooster geanalyseerd. Hier zijn mijn voorstellen:

**Optie 1 — Directe ruil met Petra Schneider** ✅ Aanbevolen
- Petra heeft woensdag vrij en is gekwalificeerd voor dezelfde dienst
- Haar uren blijven binnen de contractnorm (32u → 38.5u)
- Geen ATW-conflicten

**Optie 2 — Verschuiving via Mehmet Yılmaz**
- Mehmet kan woensdag overnemen als zijn dinsdag naar donderdag verplaatst wordt
- Vereist 2 wijzigingen in het rooster
- ⚠️ Let op: Mehmet komt hiermee op 39u (contract: 36u)

**Optie 3 — Open dienst uitschrijven**
- Zet de dienst open voor vrijwillige aanmelding
- Risico: mogelijk geen tijdige invulling

Wil je dat ik een van deze opties doorvoer?`,
  nacht: `Voor de nachtdienstvervanging heb ik de volgende opties:

**Optie 1 — Jan Bakker** ✅ Aanbevolen
- Heeft ervaring met nachtdiensten en is beschikbaar op donderdag
- Rust na laatste dienst: 16u (voldoet aan ATW minimum van 11u)
- Contracturen: 28u/36u — ruimte beschikbaar

**Optie 2 — Anna de Vries**
- Kan de nachtdienst overnemen, maar heeft al 2 nachtdiensten deze week
- ⚠️ Na 3 aaneengesloten nachtdiensten is 46u rust vereist (ATW art. 5:5)

**Optie 3 — Splitsen over 2 medewerkers**
- Eerste helft (22:00-02:00): Thomas Müller
- Tweede helft (02:00-06:00): Lisa van Dijk
- Complexer maar geen ATW-issues

Welke optie heeft je voorkeur?`,
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("nacht")) return mockResponses.nacht;
  return mockResponses.default;
}

export function PostSolveChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Het rooster is opgelost! 🎉\n\nIk kan je helpen met:\n- **Dienstruilingen** — als een medewerker vrij wil zijn\n- **Vervanging zoeken** — bij ziekte of onverwachte afwezigheid\n- **Impact-analyse** — wat gebeurt er als je een wijziging doorvoert?\n\nStel je vraag en ik geef je concrete alternatieven op basis van het huidige rooster, contracturen en ATW-regels.",
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

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(msg);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto roster-scroll space-y-4 px-5 pt-4 min-h-0"
      >
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
                msg.role === "assistant" ? "bg-primary/10" : "bg-accent"
              )}
            >
              {msg.role === "assistant" ? (
                <img src={robotImg} alt="AI" className="w-5 h-5 object-contain" />
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

        {isTyping && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 bg-primary/10">
              <img src={robotImg} alt="AI" className="w-5 h-5 object-contain" />
            </div>
            <div className="rounded-xl px-4 py-3 text-sm bg-card border shadow-sm">
              <div className="flex gap-1.5 items-center text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="ml-2 text-xs">Rooster analyseren…</span>
              </div>
            </div>
          </div>
        )}

        {/* Example prompts - only show when no user messages yet */}
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
            placeholder="Bijv. 'Wie kan de dienst van woensdag overnemen van Franz-Xaver?'"
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
            Verstuur
          </Button>
        </div>
      </div>
    </div>
  );
}
