export type CompartmentType = 'carb' | 'protein' | 'vegetable' | 'fruit';

export type DiabetesCondition =
  | 'general' // คนทั่วไป
  | 'diabetes' // เบาหวาน
  | 'hypertension' // ความดันโลหิตสูง
  | 'hyperlipidemia' // ไขมันในเลือดสูง
  | 'other' // อื่นๆ
  | 'type2_diabetes' // เบาหวานชนิดที่ 2
  | 'type1_diabetes' // เบาหวานชนิดที่ 1
  | 'gestational_diabetes' // เบาหวานขณะตั้งครรภ์ (GDM)
  | 'pre_diabetes' // ภาวะก่อนเบาหวาน
  | 'hypertension_ncd' // ความดันโลหิตสูงและเบาหวาน
  | 'weight_management'; // ควบคุมน้ำหนักเพื่อสุขภาพ

export type AlertStatus = 'optimal' | 'warning' | 'danger';

export interface FoodItem {
  id: string;
  name: string;
  category: CompartmentType;
  categoryThai: string;
  standardUnit: string;
  baseWeightG: number;
  kcalPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sodiumPer100g: number;
  glycemicIndex: 'low' | 'medium' | 'high';
  giValue: number;
  badge: string;
  clinicalNote: string;
}

export interface FoodDensityProfile {
  kcalPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sodiumPer100g: number;
  glycemicIndex?: 'low' | 'medium' | 'high';
}

export interface CompartmentState {
  id: CompartmentType;
  label: string;
  subLabel: string;
  foodName: string;
  foodPlaceholder: string;
  iconName: string;
  accentColor: string;
  lightBg: string;
  borderColor: string;
  selectedFood: FoodItem | null;
  density: FoodDensityProfile;
  weightGrams: number;
  tareWeightGrams: number;
  targetMaxGrams: number;
  targetMinGrams: number;
  plateRatio: string; // e.g. "1/4", "2/4 (1/2)", "1/4" ตามหลัก 2:1:1
}

export interface SmartMealBoxMetrics {
  totalWeightG: number;
  totalKcal: number;
  totalCarbsG: number;
  totalSugarG: number;
  totalProteinG: number;
  totalFatG: number;
  totalFiberG: number;
  totalSodiumMg: number;
  status: AlertStatus;
  alertTitle: string;
  alertDescription: string;
  carbQuotaPercent: number;
  sugarQuotaPercent: number;
  calorieQuotaPercent: number;
  isBuzzerActive: boolean;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy';

export interface UserProfile {
  nickname: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  weightKg: number | null;
  heightCm: number | null;
  activityLevel?: ActivityLevel;
  condition: DiabetesCondition;
  targetDailyKcal: number;
  targetCarbsPerMealG?: number;
  targetSugarPerMealG?: number;
  targetSodiumPerMealMg?: number;
  bloodSugarFastingMgDl?: number;
  hba1cPercent?: number;
}

export interface MealDishItem {
  id: string;
  name: string;
  categoryType?: PresetCategoryType;
  categoryThai?: string;
  servingQty: number; // e.g. 1, 0.5, 2
  servingDesc?: string; // e.g. "1 จาน (300g)", "1 ชิ้น (100g)"
  baseWeightG?: number;
  kcal: number;
  carbsG: number;
  sugarG: number;
  proteinG: number;
  fatG: number;
  sodiumMg: number;
  fiberG: number;
  gi?: 'low' | 'medium' | 'high';
  healthNote?: string;
  diabetesSuitability?: 'good' | 'moderate' | 'caution';
  ingredients?: MealIngredientItem[];
}

export interface ExtraFoodItem {
  id: string;
  name: string;
  weightG?: number;
  category?: string;
}

export interface MealLog {
  id: string;
  timestamp: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealName: string;
  dishes?: MealDishItem[];
  additionalFoods?: ExtraFoodItem[];
  beverages?: {
    id: string | number;
    name: string;
    nameEn?: string;
    volumeMl: number;
    kcal: number;
    sugarG: number;
    carbsG: number;
  }[];
  compartments: {
    type: CompartmentType;
    foodName: string;
    weightG: number;
    kcal: number;
    carbsG: number;
  }[];
  totalKcal: number;
  totalCarbsG: number;
  totalSugarG: number;
  totalFiberG: number;
  status: AlertStatus;
  clinicalFeedback: string;
}

export interface HardwareComponentItem {
  name: string;
  model: string;
  approxPriceThb: number;
  quantity: string;
  role: string;
  specNotes: string;
}

export interface MealIngredientItem {
  id: string;
  name: string;
  category: CompartmentType | 'condiment' | 'fat';
  ratioPercent: number; // Percentage proportion of the meal by weight (e.g., 40%)
  weightGrams?: number; // Optional user-specified weight for this ingredient
  density: FoodDensityProfile;
  gi?: 'low' | 'medium' | 'high';
  isCustom?: boolean;
  isSelected?: boolean; // Checkbox state for user to tick/untick
}

export interface DailyRecord14 {
  id: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. วันที่ 1 (14 วันก่อน), วันนี้
  dayOffset: number; // 0 = today, -1 = yesterday, ..., -13 = 14 days ago
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiCategory: string;
  meals: {
    id: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    mealName: string;
    weightG: number;
    kcal: number;
    carbsG: number;
    sugarG: number;
    status: AlertStatus;
  }[];
  totalKcal: number;
  totalCarbsG: number;
  totalSugarG: number;
  totalSodiumMg: number;
  complianceStatus: AlertStatus;
  fastingGlucoseMgDl?: number;
  notes?: string;
}

export type PresetCategoryType = 'savory' | 'dessert' | 'snack' | 'fruit' | 'beverage';

export interface DishPreset {
  id: string;
  name: string;
  nameEn?: string;
  categoryType?: PresetCategoryType;
  categoryThai: string;
  defaultTotalWeightG: number;
  calorieRange?: string;
  description: string;
  ingredients: MealIngredientItem[];
  healthNote: string;
  diabetesSuitability: 'good' | 'moderate' | 'caution';
}

export type FoodConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type FoodIdentificationStatus = 'confirmed' | 'ambiguous' | 'not_found' | 'unclear_image';

export interface IngredientSummaryRow {
  name: string;
  nameEn?: string;
  estimatedWeightG: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  note?: string;
  notes?: string;
}

export interface CompartmentAnalysisItem {
  slot: CompartmentType;
  slotTitleThai: string;
  foodName: string;
  foodNameEn?: string;
  identificationStatus?: FoodIdentificationStatus;
  confidence?: FoodConfidenceLevel;
  description: string;
  estimatedWeightG: number;
  measuredWeightG?: number;
  glycemicIndex: 'low' | 'medium' | 'high';
  kcalPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sodiumPer100g: number;
  adviceForDiabetes: string;
  note?: string;
}

export interface MealPhotoAnalysisResult {
  overview: string;
  dishNameThai?: string;
  dishNameEn?: string;
  calorieRange?: string; // e.g. "450-500 kcal"
  ingredientsTable?: IngredientSummaryRow[];
  identifiedCompartments: CompartmentAnalysisItem[];
  diabetesSafetyScore: number; // 0 - 100
  clinicalSummary: string;
  recommendations: string[];
  overallConfidence?: FoodConfidenceLevel;
  isImageUnclear?: boolean;
  unclearImageMessage?: string;
  formattedSummary?: string;
  notes?: string;
}
