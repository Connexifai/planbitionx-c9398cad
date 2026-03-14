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

    const empList = (employees || []).map((e: any) => 
      `- ${e.Name} (Id: ${e.PersonId ?? e.Id})`
    ).join("\n");

    const systemPrompt = `You are a scheduling assistant that parses user requests about shift changes.

Available employees:
${empList}

Schedule period: ${schedulePeriod}

Day mapping (dayOfWeek) — uses ISO/solver convention: 0=maandag, 1=dinsdag, 2=woensdag, 3=donderdag, 4=vrijdag, 5=zaterdag, 6=zondag

Constraint types:
- "avoid_day": employee wants a specific weekday off. Use dayOfWeek (0-6).
- "avoid_date": employee wants a specific date off. Use date as "YYYY-MM-DD".
- "avoid_shift_kind": employee wants to avoid a shift type. Use shiftKind: "early", "day", "late", or "night".

SWAP support (dienstwissel / ruilen):
- When the user wants to SWAP or EXCHANGE a day (e.g. "ruil dinsdag met donderdag", "wissel maandag met woensdag", "ruil dinsdag met een andere dag"), detect the swap intent.
- Use the same constraintType ("avoid_day" or "avoid_date") for the day they want OFF.
- If a SPECIFIC target day is mentioned: set swapDayOfWeek (0-6) or swapDate ("YYYY-MM-DD") for the day they OFFER to work instead.
- If NO specific target day is mentioned (e.g. "ruil dinsdag met een andere dag", "wil dinsdag ruilen"): still set isSwap=true but leave swapDayOfWeek and swapDate empty/undefined. This is an "open swap" — the employee wants the day off but is willing to work on another (unspecified) free day.
- IMPORTANT: "ruilen" (swap/exchange) is NOT the same as "vervanging" (replacement). A swap means the employee trades one working day for a free day. A replacement means someone else covers the shift.
- Example: "Ruil dinsdag met donderdag" → constraintType="avoid_day", dayOfWeek=1 (dinsdag=off), swapDayOfWeek=3 (donderdag=work instead), isSwap=true
- Example: "Ruil 8 april met 10 april" → constraintType="avoid_date", date="2026-04-08" (off), swapDate="2026-04-10" (work instead), isSwap=true
- Example: "Wil dinsdag ruilen met een andere dag" → constraintType="avoid_day", dayOfWeek=1 (dinsdag=off), isSwap=true (NO swapDayOfWeek)
- isSwap should be true whenever the user mentions ruilen/wisselen/swap/exchange.

IMPORTANT - Ambiguity check:
- Before returning a result, check if the employee name mentioned by the user matches MULTIPLE employees in the list (e.g. multiple people named "Sarah" or "Jan").
- Compare using first names, last names, or partial matches.
- If there are multiple matches, set understood=false, set ambiguous=true, and return the list of matching candidates in the "candidates" array with their full names and IDs.
- Only return understood=true when exactly ONE employee matches.

Use the parse_scheduling_intent function to return the structured result.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        tools: [
          {
            type: "function",
            function: {
              name: "parse_scheduling_intent",
              description: "Parse a user's scheduling request into structured data",
              parameters: {
                type: "object",
                properties: {
                  understood: { type: "boolean", description: "Whether the request was understood AND unambiguous" },
                  ambiguous: { type: "boolean", description: "True if multiple employees match the given name" },
                  candidates: { 
                    type: "array", 
                    description: "List of matching employees when ambiguous",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "PersonId" },
                        name: { type: "string", description: "Full name" },
                      },
                    },
                  },
                  employeeId: { type: "string", description: "PersonId of the employee (only when unambiguous)" },
                  employeeName: { type: "string", description: "Full name of the employee" },
                  constraintType: { type: "string", enum: ["avoid_day", "avoid_date", "avoid_shift_kind"] },
                  dayOfWeek: { type: "number", description: "ISO/solver convention: 0=maandag,1=dinsdag,2=woensdag,3=donderdag,4=vrijdag,5=zaterdag,6=zondag" },
                  date: { type: "string", description: "YYYY-MM-DD format" },
                  shiftKind: { type: "string", enum: ["early", "day", "late", "night"] },
                  isSwap: { type: "boolean", description: "True if this is a swap/exchange request (ruilen/wisselen)" },
                  swapDayOfWeek: { type: "number", description: "The day the employee offers to work instead (0=ma,...,6=zo)" },
                  swapDate: { type: "string", description: "The date the employee offers to work instead (YYYY-MM-DD)" },
                  summary: { type: "string", description: "Brief Dutch description of what was understood" },
                  reason: { type: "string", description: "If not understood or ambiguous, explanation in Dutch" },
                },
                required: ["understood"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_scheduling_intent" } },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI gateway error:", response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Onvoldoende credits. Voeg credits toe in je workspace instellingen." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error [${response.status}]: ${err}`);
    }

    const aiResult = await response.json();
    
    // Try tool call first, then fallback to content
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let parsed;
    
    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        parsed = { understood: false, reason: "Kon het antwoord niet verwerken" };
      }
    } else {
      // Fallback: parse from content
      const content = aiResult.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        parsed = { understood: false, reason: "Kon het antwoord niet verwerken" };
      }
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
