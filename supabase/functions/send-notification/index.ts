import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push requires signing with VAPID keys
// We use the Web Crypto API to sign JWT for VAPID

async function generateVapidJwt(
  endpoint: string,
  privateKeyBase64: string,
  publicKeyBase64: string,
  subject: string,
): Promise<{ authorization: string; cryptoKey: string }> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: expiration, sub: subject };

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64urlDecode(privateKeyBase64);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken),
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  const token = `${unsignedToken}.${base64urlEncode(sigBytes)}`;

  return {
    authorization: `vapid t=${token}, k=${publicKeyBase64}`,
    cryptoKey: `p256ecdsa=${publicKeyBase64}`,
  };
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  let padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  if (pad) padded += "=".repeat(4 - pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, url, targetUserIds } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

    if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    if (targetUserIds && targetUserIds.length > 0) {
      query = query.in("user_id", targetUserIds);
    }
    const { data: subscriptions, error: dbError } = await query;

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const notificationPayload = JSON.stringify({
      title: title || "Rooster Planner",
      body: body || "Er is een update beschikbaar",
      icon: "/favicon.ico",
      url: url || "/",
    });

    let sent = 0;
    let failed = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        const { authorization, cryptoKey } = await generateVapidJwt(
          sub.endpoint,
          VAPID_PRIVATE_KEY,
          VAPID_PUBLIC_KEY,
          VAPID_SUBJECT,
        );

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            Authorization: authorization,
            "Crypto-Key": cryptoKey,
            "Content-Type": "application/json",
            TTL: "86400",
          },
          body: notificationPayload,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired, mark for deletion
          expiredIds.push(sub.id);
          failed++;
        } else {
          console.error(`Push failed for ${sub.id}: ${response.status}`);
          failed++;
        }
      } catch (err) {
        console.error(`Push error for ${sub.id}:`, err);
        failed++;
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expiredIds);
    }

    return new Response(
      JSON.stringify({ sent, failed, expired: expiredIds.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
