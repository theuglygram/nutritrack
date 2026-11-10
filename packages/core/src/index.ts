export { APP_NAME, APP_TAGLINE } from "./product.ts";
export {
  ACTIVITY_LEVEL_LABELS,
  GOAL_TYPE_LABELS,
  HEALTH_DATA_CONSENT,
  NOT_MEDICAL_ADVICE,
  RATE_OPTIONS_KG_PER_WEEK,
  SEX_LABELS,
  TARGET_ADJUSTMENT_MESSAGES,
} from "./labels.ts";
export {
  NUTRIENT_DECIMALS,
  NUTRIENT_KEYS,
  NutritionInputError,
  gramsForServing,
  roundTo,
  scaleNutrients,
} from "./nutrition.ts";
export type { NutrientKey, NutrientProfile } from "./nutrition.ts";
export {
  ACTIVITY_FACTORS,
  CALORIE_FLOOR_KCAL,
  DEFAULT_WATER_ML,
  GAIN_RATE_KG_PER_WEEK,
  MAX_LOSS_FRACTION_PER_WEEK,
  MIN_AGE_YEARS,
  TargetInputError,
  ageInYears,
  basalMetabolicRate,
  calculateDailyTargets,
  calorieFloorViolation,
  isAdult,
} from "./targets.ts";
export type {
  ActivityLevel,
  DailyTargets,
  GoalType,
  Sex,
  TargetAdjustment,
  TargetInput,
} from "./targets.ts";
