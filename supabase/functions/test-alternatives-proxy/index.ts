import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOLVER_URL = "https://planbition-ai-solver-production.up.railway.app/solve/alternatives";
const SOLVER_API_KEY = "test-2024";
const TEST_DATA_URL = "https://isubyupzumsfvvegknfr.supabase.co/storage/v1/object/public/test-data/request.json";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Fetching test data from storage...");
    const dataResp = await fetch(TEST_DATA_URL);
    const payload = await dataResp.text();
    console.log("Payload size:", payload.length, "chars");
    
    // Verify it's valid JSON
    try {
      JSON.parse(payload);
      console.log("Valid JSON confirmed");
    } catch {
      console.error("NOT valid JSON! First 200 chars:", payload.slice(0, 200));
      return new Response(JSON.stringify({ error: "Fetched data is not valid JSON", preview: payload.slice(0, 500) }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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
    console.log("Response:", responseText.slice(0, 8000));

    return new Response(JSON.stringify({
      solverStatus: response.status,
      responseLength: responseText.length,
      response: responseText.slice(0, 15000),
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
