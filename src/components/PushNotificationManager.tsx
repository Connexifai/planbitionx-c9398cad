import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// This key should match VAPID_PUBLIC_KEY secret (set via edge function secrets)
const VAPID_PUBLIC_KEY = "BEkdTDffyKaG7Rcm5LyjCQgECBwdO60uFhtfpbvamY5SUo6M4qA-gn4fU939-XVYd8H742ZxpO2Hu1uc9e4kANI";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check PWA support
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check existing subscription
    if (supported) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") {
        setIsInstalled(true);
        toast.success("App geïnstalleerd!");
      }
      setInstallPrompt(null);
    }
  };

  const subscribeToPush = async () => {
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Push notificaties zijn nog niet geconfigureerd");
      return;
    }

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const subJson = subscription.toJSON();

      // Save subscription to database via raw fetch to bypass type checking
      const { error } = await supabase.from("push_subscriptions" as any).upsert(
        {
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
          user_agent: navigator.userAgent,
        } as any,
        { onConflict: "endpoint" },
      );

      if (error) {
        console.error("Failed to save subscription:", error);
        toast.error("Kon abonnement niet opslaan");
        return;
      }

      setIsSubscribed(true);
      toast.success("Push notificaties ingeschakeld! 🔔");
    } catch (err) {
      console.error("Push subscription failed:", err);
      if (Notification.permission === "denied") {
        toast.error("Notificaties zijn geblokkeerd in je browser. Sta ze toe in je instellingen.");
      } else {
        toast.error("Kon push notificaties niet inschakelen");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Remove from database
        await supabase.from("push_subscriptions" as any).delete().eq("endpoint", endpoint);
      }

      setIsSubscribed(false);
      toast.success("Push notificaties uitgeschakeld");
    } catch (err) {
      console.error("Unsubscribe failed:", err);
      toast.error("Kon push notificaties niet uitschakelen");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-1">
      {installPrompt && !isInstalled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleInstall} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>App installeren</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
            disabled={isLoading}
            className="h-8 w-8"
          >
            {isSubscribed ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isSubscribed ? "Push notificaties uitschakelen" : "Push notificaties inschakelen"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
