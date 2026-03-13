/** Types and defaults for solver configuration sent to the API */

export interface AtwConstraints {
  maxShiftDurationMinutes: number;
  maxShiftDurationEnabled: boolean;
  maxNightShiftMinutes: number;
  maxNightShiftEnabled: boolean;
  nightShiftExceptionEnabled: boolean;
  maxWeekHoursMinutes: number;
  maxWeekHoursEnabled: boolean;
  minRestBetweenMinutes: number;
  minRestBetweenEnabled: boolean;
  shortenedRestMinutes: number;
  shortenedRestEnabled: boolean;
  restAfterNightMinutes: number;
  restAfterNightEnabled: boolean;
  breakRulesMinutes1: number;
  breakRulesMinutes2: number;
  breakRulesEnabled: boolean;
  rest36hMinutes: number;
  rest36hEnabled: boolean;
  rest46hMinutes: number;
  rest46hEnabled: boolean;
}

export interface SoftConstraints {
  minimizeShiftChange: number; // 0=off, 1=L, 2=M, 3=H
  forwardRotation: number;
  crossWeekRotation: number;
  shiftConsistency: number;
  minRotationBlock: number;
  maxRotationBlock: number;
  rest14hPreference: number;
  singleNightShifts: number;
  distributeOpen: boolean;
}

export interface SolverSettings {
  timeLimitIndex: number; // 0=30s, 1=1m, 2=2m, 3=5m
  plateauStopIndex: number; // 0=off, 1=15s, 2=30s, 3=1m
  aiExplanation: boolean;
  seed: number;
  callbackUrl: string;
}

export const defaultAtw: AtwConstraints = {
  maxShiftDurationMinutes: 720,
  maxShiftDurationEnabled: true,
  maxNightShiftMinutes: 600,
  maxNightShiftEnabled: true,
  nightShiftExceptionEnabled: false,
  maxWeekHoursMinutes: 3600,
  maxWeekHoursEnabled: true,
  minRestBetweenMinutes: 660,
  minRestBetweenEnabled: true,
  shortenedRestMinutes: 480,
  shortenedRestEnabled: false,
  restAfterNightMinutes: 840,
  restAfterNightEnabled: true,
  breakRulesMinutes1: 330,
  breakRulesMinutes2: 600,
  breakRulesEnabled: false,
  rest36hMinutes: 2160,
  rest36hEnabled: true,
  rest46hMinutes: 2760,
  rest46hEnabled: true,
};

export const defaultSoft: SoftConstraints = {
  minimizeShiftChange: 0,
  forwardRotation: 3,
  crossWeekRotation: 0,
  shiftConsistency: 3,
  minRotationBlock: 2,
  maxRotationBlock: 5,
  rest14hPreference: 2,
  singleNightShifts: 3,
  distributeOpen: true,
};

export const defaultSolver: SolverSettings = {
  timeLimitIndex: 0,
  plateauStopIndex: 0,
  aiExplanation: false,
  seed: 42,
  callbackUrl: "https://jouw-server.nl/webhook",
};

const timeLimitValues = [30, 60, 120, 300];
const plateauStopValues = [0, 15, 30, 60];

/** Map UI level index (0-3) to API integer level */
const levelMap = [0, 1, 2, 3];

/** Build the SchedulingOptions object matching the API's expected format */
export function buildSettingsPayload(atw: AtwConstraints, soft: SoftConstraints, solver: SolverSettings) {
  const SchedulingOptions: Record<string, unknown> = {
    // Solver settings
    TimeLimitSeconds: timeLimitValues[solver.timeLimitIndex] ?? 30,
    PlateauTimeoutSeconds: plateauStopValues[solver.plateauStopIndex] ?? 0,
    Seed: solver.seed,
    EnrichExplanationsWithAI: solver.aiExplanation,

    // Hard constraints (ATW) – values
    MaxShiftMinutes: atw.maxShiftDurationMinutes,
    MaxNightShiftMinutes: atw.maxNightShiftMinutes,
    MaxWeeklyMinutes: atw.maxWeekHoursMinutes,
    MinRestMinutes: atw.minRestBetweenMinutes,
    NightRestMinutes: atw.restAfterNightMinutes,
    ReducedRestMinutes: atw.shortenedRestMinutes,
    Break1ThresholdMinutes: atw.breakRulesMinutes1,
    Break2ThresholdMinutes: atw.breakRulesMinutes2,
    WeeklyRestMinutes: atw.rest36hMinutes,
    AfterNightSeriesRestMinutes: atw.rest46hMinutes,

    // Hard constraints – disable toggles (inverted: enabled in UI = not disabled)
    DisableMaxShift: !atw.maxShiftDurationEnabled,
    DisableMaxWeekly: !atw.maxWeekHoursEnabled,
    DisableMinRest: !atw.minRestBetweenEnabled,
    DisableNightRest: !atw.restAfterNightEnabled,
    DisableBreaks: !atw.breakRulesEnabled,
    DisableWeeklyRest: !atw.rest36hEnabled,
    DisableAfterNightSeriesRest: !atw.rest46hEnabled,

    // ATW extras
    NightExceptionActive: atw.nightShiftExceptionEnabled,
    AllowOneReducedRestPerWeek: atw.shortenedRestEnabled,
    Prefer14HRest: soft.rest14hPreference > 0,

    // Soft constraints – level integers
    SwitchLevel: levelMap[soft.minimizeShiftChange] ?? 0,
    RotationLevel: levelMap[soft.forwardRotation] ?? 0,
    CrossWeekRotationLevel: levelMap[soft.crossWeekRotation] ?? 0,
    ShiftConsistencyLevel: levelMap[soft.shiftConsistency] ?? 0,
    ShortRestLevel: levelMap[soft.rest14hPreference] ?? 0,
    IsolatedNightLevel: levelMap[soft.singleNightShifts] ?? 0,

    // Rotation block sizes
    ForwardRotationBlockSizeMin: soft.minRotationBlock,
    ForwardRotationBlockSizeMax: soft.maxRotationBlock,
    EnableForwardRotation: soft.forwardRotation > 0,
    MinimizeShiftTypeSwitching: soft.minimizeShiftChange > 0,

    // Distribution
    BalanceDailyFillRate: soft.distributeOpen,
  };

  return { SchedulingOptions };
}
