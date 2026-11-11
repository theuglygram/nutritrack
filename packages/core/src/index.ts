export { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "./product.ts";
export {
  ACTIVITY_LEVEL_LABELS,
  CUSTOM_FOOD_LABEL,
  FOOD_LANGUAGE_LABELS,
  GOAL_TYPE_LABELS,
  HEALTH_DATA_CONSENT,
  NOT_MEDICAL_ADVICE,
  RATE_OPTIONS_KG_PER_WEEK,
  SEX_LABELS,
  TARGET_ADJUSTMENT_MESSAGES,
  VERIFICATION_LABELS,
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
export {
  MAX_WATER_ENTRY_ML,
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  WATER_PORTIONS,
  dailyTip,
  firstName,
  formatLitres,
  greetingFor,
  groupByMealSlot,
  isoDaysBefore,
  progressToward,
  sumLoggedNutrients,
  sumWaterMl,
  summariseWeights,
} from "./daily.ts";
export type {
  DailyTip,
  DailyTipInput,
  DailyTotals,
  LoggedNutrients,
  MealSlot,
  Progress,
  WaterPortionId,
  WeightPoint,
  WeightSummary,
} from "./daily.ts";
export { BRAND_COLORS, BRAND_FONTS, BRAND_RADIUS } from "./brand.ts";
export type { BrandColorName, BrandPalette } from "./brand.ts";
export { recipePer100g } from "./recipes.ts";
export type { RecipeIngredient } from "./recipes.ts";
