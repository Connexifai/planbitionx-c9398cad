import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOLVER_URL = "https://planbition-ai-solver-production.up.railway.app/solve";
const SOLVER_API_KEY = "test-2024";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure all Shifts have a Name field (required by solver)
    const shifts = Array.isArray(payload.Shifts) ? payload.Shifts : [];
    payload.Shifts = shifts.map((shift: any) => {
      if (!shift || typeof shift !== "object") return shift;
      if (!shift.Name) {
        return { ...shift, Name: `Shift ${shift.Id ?? "unknown"}` };
      }
      return shift;
    });

    // Ensure all Employees have a Name field (required by solver)
    const employees = Array.isArray(payload.Employees) ? payload.Employees : [];
    payload.Employees = employees.map((employee) => {
      if (!employee || typeof employee !== "object") return employee;

      const typedEmployee = employee as Record<string, unknown>;
      
      // Add Name fallback if missing
      if (!typedEmployee.Name) {
        typedEmployee.Name = `Employee ${typedEmployee.PersonId ?? typedEmployee.Id ?? "unknown"}`;
      }

      const historical = Array.isArray(typedEmployee.HistoricalShifts)
        ? typedEmployee.HistoricalShifts
        : [];

      const normalizedHistorical = historical.map((item) => {
        if (!item || typeof item !== "object") return item;
        const shift = item as Record<string, unknown>;

        const start = (shift.Start as string | undefined) ?? (shift.StartTime as string | undefined);
        const end = (shift.End as string | undefined) ?? (shift.EndTime as string | undefined);
        const rest = { ...shift };
        delete rest.StartTime;
        delete rest.EndTime;

        return {
          ...rest,
          ...(start ? { Start: start } : {}),
          ...(end ? { End: end } : {}),
        };
      });

      return {
        ...typedEmployee,
        HistoricalShifts: normalizedHistorical,
      };
    });

    console.log("Settings in payload:", JSON.stringify(payload.Settings));
    console.log("HardConstraints in payload:", JSON.stringify(payload.HardConstraints));
    console.log("SoftConstraints in payload:", JSON.stringify(payload.SoftConstraints));
    console.log("Sending solve request to external API...");

    const response = await fetch(SOLVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": SOLVER_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Solver API error [${response.status}]:`, errorText);
      return new Response(
        JSON.stringify({ error: `Solver API returned ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Solver response received successfully");

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in solve function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
