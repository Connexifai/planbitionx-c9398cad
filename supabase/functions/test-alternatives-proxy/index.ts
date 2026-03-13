import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOLVER_URL = "https://planbition-ai-solver-production.up.railway.app/solve/alternatives";
const SOLVER_API_KEY = "test-2024";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Forward the raw body directly to the solver
    const payload = await req.text();
    console.log("Payload size:", payload.length, "chars");
    console.log("Sending to solver alternatives...");

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
    console.log("Response size:", responseText.length, "chars");
    console.log("Response preview:", responseText.slice(0, 5000));

    return new Response(JSON.stringify({
      solverStatus: response.status,
      solverStatusText: response.statusText,
      responseLength: responseText.length,
      response: responseText.slice(0, 10000),
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
