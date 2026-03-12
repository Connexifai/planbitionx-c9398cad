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
const levelValues = [0, 0.3, 0.6, 1.0];

/** Build the API payload fields from UI settings */
export function buildSettingsPayload(atw: AtwConstraints, soft: SoftConstraints, solver: SolverSettings) {
  const Settings: Record<string, unknown> = {
    TimeLimitSeconds: timeLimitValues[solver.timeLimitIndex] ?? 30,
    Seed: solver.seed,
  };
  if (plateauStopValues[solver.plateauStopIndex] > 0) {
    Settings.PlateauStopSeconds = plateauStopValues[solver.plateauStopIndex];
  }

  const HardConstraints: Record<string, unknown> = {};
  if (atw.maxShiftDurationEnabled) HardConstraints.MaxShiftDurationMinutes = atw.maxShiftDurationMinutes;
  if (atw.maxNightShiftEnabled) HardConstraints.MaxNightShiftDurationMinutes = atw.maxNightShiftMinutes;
  if (atw.maxWeekHoursEnabled) HardConstraints.MaxWeekHoursMinutes = atw.maxWeekHoursMinutes;
  if (atw.minRestBetweenEnabled) HardConstraints.MinRestBetweenShiftsMinutes = atw.minRestBetweenMinutes;
  if (atw.shortenedRestEnabled) HardConstraints.ShortenedRestMinutes = atw.shortenedRestMinutes;
  if (atw.restAfterNightEnabled) HardConstraints.RestAfterNightMinutes = atw.restAfterNightMinutes;
  if (atw.rest36hEnabled) HardConstraints.Rest36hMinutes = atw.rest36hMinutes;
  if (atw.rest46hEnabled) HardConstraints.Rest46hMinutes = atw.rest46hMinutes;

  const SoftConstraints: Record<string, unknown> = {};
  if (soft.forwardRotation > 0) SoftConstraints.ForwardRotationWeight = levelValues[soft.forwardRotation];
  if (soft.minimizeShiftChange > 0) SoftConstraints.MinimizeShiftChangeWeight = levelValues[soft.minimizeShiftChange];
  if (soft.crossWeekRotation > 0) SoftConstraints.CrossWeekRotationWeight = levelValues[soft.crossWeekRotation];
  if (soft.shiftConsistency > 0) SoftConstraints.ShiftConsistencyWeight = levelValues[soft.shiftConsistency];
  if (soft.rest14hPreference > 0) SoftConstraints.Rest14hPreferenceWeight = levelValues[soft.rest14hPreference];
  if (soft.singleNightShifts > 0) SoftConstraints.SingleNightShiftsWeight = levelValues[soft.singleNightShifts];
  SoftConstraints.MinRotationBlock = soft.minRotationBlock;
  SoftConstraints.MaxRotationBlock = soft.maxRotationBlock;
  SoftConstraints.DistributeOpenShifts = soft.distributeOpen;

  return { Settings, HardConstraints, SoftConstraints };
}
