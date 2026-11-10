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
