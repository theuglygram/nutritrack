export { createNutriTrackClient } from "./client.ts";
export type { NutriTrackClient } from "./client.ts";
export { ApiError, fromAuthError, fromPostgrestError, toUserMessage } from "./errors.ts";
export type { ApiErrorCode } from "./errors.ts";
export {
  requestPasswordReset,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifySignUpCode,
} from "./auth.ts";
export {
  completeOnboarding,
  getActiveGoal,
  getMyProfile,
  isOnboarded,
  loadAccount,
  previewTargets,
  resetToCalculatedTargets,
  saveTargetOverride,
  updateProfile,
} from "./profile.ts";
export type { Goal, Profile } from "./profile.ts";
export { localIsoDate } from "./dates.ts";
export {
  DASHBOARD_WEIGHT_DAYS,
  addWater,
  deleteLogEntry,
  deleteWater,
  deleteWeight,
  getDayLog,
  getLatestWeight,
  getWaterForDay,
  getWeightHistory,
  loadDashboard,
  logWeight,
} from "./tracking.ts";
export type { DashboardData, LogEntry, Section, WaterEntry, WeightEntry } from "./tracking.ts";
