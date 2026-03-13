import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, employees, schedulePeriod } = await req.json();

    // Build employee list for the prompt
    const empList = (employees || []).map((e: any) => 
      `- ${e.Name} (Id: ${e.PersonId ?? e.Id})`
    ).join("\n");

    const systemPrompt = `You are a scheduling assistant that parses user requests about shift changes into structured JSON.

Available employees:
${empList}

Schedule period: ${schedulePeriod}

Day mapping (dayOfWeek): 0=maandag, 1=dinsdag, 2=woensdag, 3=donderdag, 4=vrijdag, 5=zaterdag, 6=zondag

Constraint types:
- "avoid_day": employee wants a specific weekday off. Use dayOfWeek (0-6).
- "avoid_date": employee wants a specific date off. Use date as "YYYY-MM-DD".
- "avoid_shift_kind": employee wants to avoid a shift type. Use shiftKind: "early", "day", "late", or "night".

ALWAYS respond with valid JSON only. No markdown, no explanation. Format:
{
  "understood": true,
  "employeeId": "<PersonId as string>",
  "employeeName": "<full name>",
  "constraintType": "avoid_day" | "avoid_date" | "avoid_shift_kind",
  "dayOfWeek": <number 0-6 or null>,
  "date": "<YYYY-MM-DD or null>",
  "shiftKind": "<early|day|late|night or null>",
  "summary": "<brief Dutch description of what was understood>"
}

If you cannot determine the employee or the request, respond:
{"understood": false, "reason": "<explanation in Dutch>"}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error [${response.status}]: ${err}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle possible markdown wrapping)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = { understood: false, reason: "Kon het antwoord niet verwerken" };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in parse-chat-intent:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
