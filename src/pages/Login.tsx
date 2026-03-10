import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus, ArrowRight } from "lucide-react";
import robotImg from "@/assets/robot-assistant.png";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account aangemaakt! Controleer je e-mail om te bevestigen.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message || "Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16 text-primary-foreground">
          <img
            src={robotImg}
            alt="Planbition X"
            className="w-64 h-64 object-contain drop-shadow-2xl animate-[orbit_40s_ease-in-out_infinite] hover:scale-110 transition-transform duration-500 cursor-pointer mb-8"
          />
          <h1 className="text-5xl font-black tracking-tight mb-3">Planbition X</h1>
          <p className="text-lg text-primary-foreground/80 text-center max-w-md leading-relaxed">
            AI-gestuurde roosterplanning. Slimmer plannen, minder conflicten, gelukkiger medewerkers.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">AI</div>
              <div className="text-xs text-primary-foreground/60 mt-1">Slimme planning</div>
            </div>
            <div>
              <div className="text-3xl font-bold">2min</div>
              <div className="text-xs text-primary-foreground/60 mt-1">Oplosstijd</div>
            </div>
            <div>
              <div className="text-3xl font-bold">0</div>
              <div className="text-xs text-primary-foreground/60 mt-1">ATW-overtredingen</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-4">
            <img
              src={robotImg}
              alt="Planbition X"
              className="w-32 h-32 object-contain drop-shadow-xl animate-[orbit_40s_ease-in-out_infinite] hover:scale-110 transition-transform duration-500 cursor-pointer mb-4"
            />
            <h1 className="text-3xl font-black tracking-tight">Planbition X</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isSignUp ? "Account aanmaken" : "Welkom terug"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {isSignUp
                ? "Maak een account aan om te beginnen met plannen"
                : "Log in om verder te gaan met je roosterplanning"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="h-11"
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
                  className="h-11 pr-10"
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
