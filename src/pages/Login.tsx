import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus, ArrowRight } from "lucide-react";
import robotImg from "@/assets/robot-assistant.png";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <img
        src="/images/login-bg.gif"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-background/60" />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setExiting(true);
    setTimeout(() => navigate("/"), 800);
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex items-center justify-center bg-background relative transition-all duration-700 ease-in-out ${exiting ? "scale-110 opacity-0 blur-sm" : ""}`}
    >
      <AnimatedBackground />

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo & branding */}
          <div className="flex flex-col items-center">
            <img
              src={robotImg}
              alt="Planbition X"
              className="w-28 h-28 object-contain drop-shadow-2xl animate-[orbit_180s_ease-in-out_infinite] hover:scale-110 transition-transform duration-500 cursor-pointer mb-4"
            />
            <h1 className="text-3xl font-black tracking-tight text-foreground">Planbition X</h1>
            <p className="text-muted-foreground text-sm mt-1">AI-gestuurde roosterplanning</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center py-3 border-y border-border/50">
            <div>
              <div className="text-lg font-bold text-primary">AI</div>
              <div className="text-[10px] text-muted-foreground">Slimme planning</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">2min</div>
              <div className="text-[10px] text-muted-foreground">Oplosstijd</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">0</div>
              <div className="text-[10px] text-muted-foreground">ATW-overtredingen</div>
            </div>
          </div>

          {/* Form header */}
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Account aanmaken" : "Welkom terug"}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {isSignUp
                ? "Maak een account aan om te beginnen met plannen"
                : "Log in om verder te gaan met je roosterplanning"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="naam@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="h-11 pr-10 bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 gap-2 text-sm font-semibold" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Account aanmaken
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Inloggen
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              {isSignUp ? "Heb je al een account? Inloggen" : "Nog geen account? Registreren"}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
