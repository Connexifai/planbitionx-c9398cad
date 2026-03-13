import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import robotImg from "@/assets/robot-assistant.png";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-background/30" />
    </div>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast.error(t("login.error", "Ongeldige inloggegevens"));
      return;
    }

    setExiting(true);
    sessionStorage.setItem("just_logged_in", "true");
    setTimeout(() => navigate("/"), 800);
  };

  return (
    <div ref={containerRef} className={`min-h-screen flex items-center justify-center bg-background relative transition-all duration-700 ease-in-out ${exiting ? "scale-110 opacity-0 blur-sm" : ""}`}>
      <AnimatedBackground />
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-background/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-7 space-y-5">
          <div className="flex flex-col items-center">
            <img src={robotImg} alt="Planbition X" className="w-28 h-28 object-contain drop-shadow-2xl robot-float hover:scale-110 transition-transform duration-500 cursor-pointer mb-4" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">{t("app.title")}</h1>
            <span className="text-xl font-bold text-black tracking-wide mt-1">Chapter One</span>
            <p className="text-muted-foreground text-sm mt-2">{t("app.subtitle")}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center py-3 border-y border-border/50">
            <div><div className="text-lg font-bold text-primary">AI</div><div className="text-[10px] text-muted-foreground">{t("login.smartPlanning")}</div></div>
            <div><div className="text-lg font-bold text-primary">2min</div><div className="text-[10px] text-muted-foreground">{t("login.solveTime")}</div></div>
            <div><div className="text-lg font-bold text-primary">0</div><div className="text-[10px] text-muted-foreground">{t("login.atwViolations")}</div></div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{t("login.welcome")}</h2>
            <p className="text-muted-foreground mt-1 text-xs">{t("login.loginSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input id="email" type="email" placeholder={t("login.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-11 bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="current-password" className="h-11 pr-10 bg-background/50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 gap-2 text-sm font-semibold" disabled={loading}>
              {loading ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : (<><LogIn className="h-4 w-4" />{t("login.login")}</>)}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
