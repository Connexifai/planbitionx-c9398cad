import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOLVER_URL = "https://planbition-ai-solver-production.up.railway.app/solve/alternatives";
const SOLVER_API_KEY = "test-2024";

// This edge function fetches the test JSON from the project's public URL and forwards it to the solver
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Fetch the test payload from the project's public files
    const testDataUrl = "https://isubyupzumsfvvegknfr.supabase.co/storage/v1/object/public/test/request.json";
    
    // Actually, let's just read from the request body which will contain the URL to fetch from
    const { sourceUrl } = await req.json();
    
    if (!sourceUrl) {
      return new Response(JSON.stringify({ error: "sourceUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Fetching test data from:", sourceUrl);
    const dataResp = await fetch(sourceUrl);
    if (!dataResp.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch: ${dataResp.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = await dataResp.text();
    console.log("Payload size:", payload.length, "chars");
    console.log("Sending to solver...");

    const response = await fetch(SOLVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": SOLVER_API_KEY,
      },
      body: payload,
    });

    const responseText = await response.text();
    console.log("Solver status:", response.status);
    console.log("Solver response (first 5000 chars):", responseText.slice(0, 5000));

    return new Response(JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      bodyLength: responseText.length,
      bodyPreview: responseText.slice(0, 10000),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
