import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOLVER_URL = "https://planbition-ai-solver-production.up.railway.app/solve/alternatives";
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

    // Normalize HistoricalShifts (same as /solve)
    const employees = Array.isArray(payload.Employees) ? payload.Employees : [];
    payload.Employees = employees.map((employee) => {
      if (!employee || typeof employee !== "object") return employee;

      const typedEmployee = employee as Record<string, unknown>;
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

    // Log first employee's AssignedShifts and Constraints for debugging
    const firstEmpWithShifts = employees.find((e: any) => e.AssignedShifts?.length > 0);
    if (firstEmpWithShifts) {
      console.log("Sample employee AssignedShifts:", JSON.stringify({
        name: firstEmpWithShifts.Name,
        assignedShifts: firstEmpWithShifts.AssignedShifts,
        constraints: firstEmpWithShifts.Constraints,
      }));
    }
    // Log employee with constraints (target employee)
    const targetEmp = employees.find((e: any) => e.Constraints?.length > 0);
    if (targetEmp) {
      console.log("Target employee:", JSON.stringify({
        name: targetEmp.Name,
        id: targetEmp.PersonId ?? targetEmp.Id,
        assignedShifts: targetEmp.AssignedShifts,
        constraints: targetEmp.Constraints,
      }));
    }
    console.log("Sending solve/alternatives request...");
    console.log("MaxAlternatives:", (payload.SchedulingOptions as any)?.MaxAlternatives);
    console.log("Employee count:", employees.length);
    console.log("Shift count:", Array.isArray(payload.Shifts) ? payload.Shifts.length : 0);

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
      console.error(`Solver alternatives API error [${response.status}]:`, errorText);
      return new Response(
        JSON.stringify({ error: `Solver API returned ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Solver alternatives response received successfully");
    console.log("Full solver response:", JSON.stringify(data).slice(0, 10000));

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in solve-alternatives function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
