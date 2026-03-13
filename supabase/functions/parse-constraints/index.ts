import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Je bent een AI-planningsassistent voor een rooster-solver. Je taak is om voorkeuren/constraints van gebruikers te begrijpen en om te zetten naar gestructureerde constraint JSON.

## Beschikbare constraint types

1. **avoid_day** — Vermijd een weekdag
   - Extra veld: "dayOfWeek": 0-6 (0=Maandag, 1=Dinsdag, 2=Woensdag, 3=Donderdag, 4=Vrijdag, 5=Zaterdag, 6=Zondag)
   
2. **avoid_shift_kind** — Vermijd een dienstsoort
   - Extra veld: "shiftKind": "early" | "day" | "late" | "night"
   
3. **avoid_date** — Vermijd een specifieke datum
   - Extra veld: "date": "YYYY-MM-DD"

## Strength
- "soft" = "Liever niet" — solver probeert het te vermijden maar KAN de medewerker nog inplannen
- "hard" = "Zeker niet" / "Kan niet" — absolute blokkade

Taalgebruik:
- "liever niet", "bij voorkeur niet", "prefers not" → soft
- "kan niet", "mag niet", "absoluut niet", "cannot", "must not" → hard

## Instructies

1. Analyseer het bericht van de gebruiker
2. Controleer of genoemde medewerkers bestaan in de medewerkerlijst
3. Als een naam ambigu is (meerdere matches), vraag om verduidelijking
4. Als een naam niet gevonden wordt, meld dit en geef suggesties
5. Als alles duidelijk is, bevestig de constraints

## Response format

Antwoord ALTIJD in valid JSON met dit formaat:
{
  "message": "Je bevestiging/vraag aan de gebruiker in markdown (Nederlands)",
  "constraints": [
    {
      "employeeName": "Exacte naam uit de medewerkerlijst",
      "personId": 123,
      "constraint": { "type": "avoid_day", "dayOfWeek": 6, "strength": "soft" }
    }
  ],
  "needsClarification": false
}

Als je verduidelijking nodig hebt, zet needsClarification op true en geef een lege constraints array.
Als de gebruiker gewoon chat zonder constraints te benoemen, geef dan een behulpzaam antwoord in message met lege constraints.

## BELANGRIJK: Conversatiecontext

Je ontvangt de VOLLEDIGE gesprekshistorie. Als jij eerder om verduidelijking hebt gevraagd (bijv. "Wie bedoel je?" bij een ambigue naam), dan is het volgende bericht van de gebruiker een ANTWOORD op die vraag. 
Combineer het antwoord met het OORSPRONKELIJKE verzoek uit de eerdere berichten. 
Voorbeeld:
- Gebruiker: "camille wil woensdag vrij"
- Jij: "Er zijn meerdere medewerkers met de naam Camille. Wie bedoel je?"
- Gebruiker: "Camille Dupont"
→ Verwerk dit als: Camille Dupont wil woensdag vrij (avoid_day, dayOfWeek=2)

Verlies NOOIT de oorspronkelijke constraint-informatie uit eerdere berichten wanneer je een verduidelijkingsantwoord verwerkt.

Antwoord altijd in het Nederlands tenzij de gebruiker Engels spreekt.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, employees, schedulePeriod } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build employee context for the AI
    const employeeList = (employees || []).map((e: any) => ({
      name: e.Name,
      personId: e.PersonId,
      qualifications: (e.Qualifications || [])
        .filter((q: any) => q.Type === "Qualification")
        .map((q: any) => q.Value),
    }));

    // Check for duplicate names
    const nameCount = new Map<string, number>();
    for (const emp of employeeList) {
      const normalized = emp.name.toLowerCase().trim();
      nameCount.set(normalized, (nameCount.get(normalized) || 0) + 1);
    }
    const duplicates = Array.from(nameCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);

    const contextMessage = `## Medewerkerlijst (${employeeList.length} medewerkers)
${employeeList.map((e: any) => `- "${e.name}" (PersonId: ${e.personId}, Kwalificaties: ${e.qualifications.join(", ") || "geen"})`).join("\n")}

${duplicates.length > 0 ? `\n⚠️ Let op: Er zijn medewerkers met dezelfde naam: ${duplicates.join(", ")}. Vraag om verduidelijking als een van deze namen wordt genoemd.\n` : ""}

## Planningsperiode
${schedulePeriod || "Niet opgegeven"}

## Belangrijk
- Match namen flexibel: "Franz-Xaver" of "Bachmann" of "Franz-Xaver Bachmann" moeten allemaal matchen met "Franz-Xaver, AABachmann"
- Achternaam staat ACHTER de komma in het format "Voornaam, Achternaam"
- Wees case-insensitive bij het matchen
- Als een naam niet exact matcht maar wel dichtbij komt, stel de juiste naam voor`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: contextMessage },
            ...messages,
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Tegoed onvoldoende, voeg credits toe." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI-fout opgetreden" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { message: content, constraints: [], needsClarification: false };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in parse-constraints:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
