import React, { useState, useMemo, useEffect } from 'react';
import {
  Utensils,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Save,
  Coffee,
  X,
  RefreshCw,
  Flame,
  Wheat,
  Candy,
  Fish,
  Activity,
  CalendarDays,
  Camera,
  Layers,
  Info,
  TrendingDown,
  TrendingUp,
  Sliders,
  ChevronRight,
  ArrowRight,
  Square,
  CheckSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  UserProfile,
  MealLog,
  AlertStatus,
  MealIngredientItem,
  ExtraFoodItem,
  DishPreset,
  FoodItem,
  MealDishItem,
} from '../types';
import { soundFx } from '../utils/audio';
import { POPULAR_DISH_PRESETS, calculateMealNutrition } from '../data/dishPresets';
import { RAW_POPULAR_MENU_LIST, RawMenuItem } from '../data/popularMenuData';
import { BEVERAGE_MASTER_LIST, BeverageItem } from '../data/beverageData';
import { calculateBmr } from '../utils/bmiHelper';
import { BeverageSelectorModal } from './BeverageSelectorModal';
import { PopularMenuSelectorModal } from './PopularMenuSelectorModal';
import { MenuDetailEditorModal } from './MenuDetailEditorModal';

interface AIMealEstimatorViewProps {
  userProfile: UserProfile;
  initialMealName?: string;
  initialIngredients?: MealIngredientItem[];
  onSaveMeal: (mealLog: MealLog) => void;
  onOpenFourteenDayStats: () => void;
  onOpenPhotoScanner: () => void;
}

export const AIMealEstimatorView: React.FC<AIMealEstimatorViewProps> = ({
  userProfile,
  initialMealName = '',
  initialIngredients = [],
  onSaveMeal,
  onOpenFourteenDayStats,
  onOpenPhotoScanner,
}) => {
  // Meal Type selection with auto-detection by hour
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'snack';
  });

  // Multiple Dishes in this meal (รองรับการเพิ่มเมนูได้ไม่จำกัด)
  const [dishes, setDishes] = useState<MealDishItem[]>(() => {
    if (initialMealName) {
      return [
        {
          id: `dish_init_${Date.now()}`,
          name: initialMealName,
          categoryThai: 'อาหารจานหลัก',
          servingQty: 1,
          servingDesc: '1 จาน/ชุด',
          kcal: 380,
          carbsG: 45,
          sugarG: 2,
          proteinG: 18,
          fatG: 10,
          sodiumMg: 450,
          fiberG: 2,
          gi: 'medium',
          ingredients: initialIngredients || [],
        },
      ];
    }
    return [];
  });

  // Custom Dish Input text
  const [customDishInput, setCustomDishInput] = useState<string>('');

  // Selected Beverages State
  const [selectedBeverages, setSelectedBeverages] = useState<BeverageItem[]>([]);

  // Additional Side Foods State
  const [additionalFoods, setAdditionalFoods] = useState<ExtraFoodItem[]>([]);
  const [newExtraFoodName, setNewExtraFoodName] = useState('');

  // Modals & UI Controls
  const [showBeverageModal, setShowBeverageModal] = useState<boolean>(false);
  const [showPopularMenuModal, setShowPopularMenuModal] = useState<boolean>(false);
  const [showDetailEditorModal, setShowDetailEditorModal] = useState<boolean>(false);
  const [activeEditingDishIndex, setActiveEditingDishIndex] = useState<number>(0);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState<boolean>(false);

  // New Ingredient Input State
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<'carb' | 'protein' | 'vegetable' | 'fruit' | 'fat' | 'condiment'>('protein');
  const [newIngWeightG, setNewIngWeightG] = useState<number>(100);
  const [isLookingUpIng, setIsLookingUpIng] = useState(false);

  // Expanded Dish IDs
  const [expandedDishIds, setExpandedDishIds] = useState<{ [id: string]: boolean }>({});

  // Active Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Update if initial props change
  useEffect(() => {
    if (initialMealName && dishes.length === 0) {
      setDishes([
        {
          id: `dish_init_${Date.now()}`,
          name: initialMealName,
          categoryThai: 'อาหารจานหลัก',
          servingQty: 1,
          servingDesc: '1 จาน/ชุด',
          kcal: 380,
          carbsG: 45,
          sugarG: 2,
          proteinG: 18,
          fatG: 10,
          sodiumMg: 450,
          fiberG: 2,
          gi: 'medium',
          ingredients: initialIngredients || [],
        },
      ]);
    }
  }, [initialMealName, initialIngredients]);

  // BMI and TDEE Target Calculations
  const bmiInfo = useMemo(() => {
    const hasBmi = Boolean(
      userProfile.weightKg &&
      userProfile.heightCm &&
      userProfile.weightKg > 0 &&
      userProfile.heightCm > 0
    );
    const w = userProfile.weightKg || 0;
    const h = userProfile.heightCm || 0;
    const age = userProfile.age || 45;
    const isMale = userProfile.gender === 'male';

    const bmiVal = hasBmi ? parseFloat((w / Math.pow(h / 100, 2)).toFixed(1)) : 0;

    // BMR (Mifflin-St Jeor)
    const bmr = hasBmi
      ? isMale
        ? 10 * w + 6.25 * h - 5 * age + 5
        : 10 * w + 6.25 * h - 5 * age - 161
      : 1400;

    // Daily Calorie Target based on BMR formula (Mifflin-St Jeor)
    // ผู้ชาย: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) + 5
    // ผู้หญิง: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) − 161
    let dailyTargetKcal = userProfile.targetDailyKcal || 1600;
    if (hasBmi) {
      const bmrResult = calculateBmr(
        userProfile.gender,
        age,
        w,
        h
      );
      dailyTargetKcal = bmrResult.bmr;
    }

    // Recommended Meal Target
    let mealRatio = 0.35;
    let mealLabel = 'มื้อกลางวัน';
    if (mealType === 'breakfast') {
      mealRatio = 0.28;
      mealLabel = 'มื้อเช้า';
    } else if (mealType === 'lunch') {
      mealRatio = 0.38;
      mealLabel = 'มื้อกลางวัน';
    } else if (mealType === 'dinner') {
      mealRatio = 0.28;
      mealLabel = 'มื้อเย็น';
    } else {
      mealRatio = 0.10;
      mealLabel = 'ของว่าง';
    }

    const targetMealKcal = Math.round(dailyTargetKcal * mealRatio);
    const minOptimalMealKcal = Math.round(targetMealKcal * 0.85);
    const maxOptimalMealKcal = Math.round(targetMealKcal * 1.15);

    let bmiCategoryText = '';
    let bmiCategoryColor = '';
    if (hasBmi) {
      if (bmiVal < 18.5) {
        bmiCategoryText = 'น้ำหนักน้อยกว่าเกณฑ์';
        bmiCategoryColor = 'text-blue-700 bg-blue-50 border-blue-200';
      } else if (bmiVal < 23.0) {
        bmiCategoryText = 'สมส่วน / เกณฑ์ปกติ (Asian Standard)';
        bmiCategoryColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      } else if (bmiVal < 25.0) {
        bmiCategoryText = 'น้ำหนักเกิน (ท้วม)';
        bmiCategoryColor = 'text-amber-700 bg-amber-50 border-amber-200';
      } else {
        bmiCategoryText = 'ภาวะอ้วน (เสี่ยงเบาหวานสูง)';
        bmiCategoryColor = 'text-rose-700 bg-rose-50 border-rose-200';
      }
    }

    return {
      hasBmi,
      bmi: bmiVal,
      bmiCategoryText,
      bmiCategoryColor,
      dailyTargetKcal,
      targetMealKcal,
      minOptimalMealKcal,
      maxOptimalMealKcal,
      mealLabel,
      mealRatioPercent: Math.round(mealRatio * 100),
    };
  }, [userProfile, mealType]);

  // Beverage Totals
  const beverageTotals = useMemo(() => {
    return selectedBeverages.reduce(
      (acc, bev) => {
        acc.kcal += bev.kcal;
        acc.sugarG += bev.sugarG;
        acc.carbsG += bev.carbsG;
        acc.proteinG += bev.proteinG;
        acc.fatG += bev.fatG;
        acc.sodiumMg += bev.sodiumMg;
        acc.fiberG += bev.fiberG || 0;
        return acc;
      },
      { kcal: 0, sugarG: 0, carbsG: 0, proteinG: 0, fatG: 0, sodiumMg: 0, fiberG: 0 }
    );
  }, [selectedBeverages]);

  // Check if any meal item exists
  const hasActiveMeal = useMemo(() => {
    const hasDishes = dishes.length > 0;
    const hasExtraFoods = additionalFoods.some((f) => f.name && f.name.trim().length > 0);
    const hasBeverages = selectedBeverages.length > 0;
    return hasDishes || hasExtraFoods || hasBeverages;
  }, [dishes, additionalFoods, selectedBeverages]);

  // Calculated Aggregate Meal Nutrition from all dishes + drinks + extras
  const nutrition = useMemo(() => {
    let totalKcal = 0;
    let totalCarbsG = 0;
    let totalSugarG = 0;
    let totalProteinG = 0;
    let totalFatG = 0;
    let totalFiberG = 0;
    let totalSodiumMg = 0;

    // Sum from all dishes
    dishes.forEach((d) => {
      const qty = d.servingQty || 1;
      totalKcal += d.kcal;
      totalCarbsG += d.carbsG;
      totalSugarG += d.sugarG;
      totalProteinG += d.proteinG;
      totalFatG += d.fatG;
      totalSodiumMg += d.sodiumMg;
      totalFiberG += d.fiberG;
    });

    // Sum from beverages
    totalKcal += beverageTotals.kcal;
    totalCarbsG += beverageTotals.carbsG;
    totalSugarG += beverageTotals.sugarG;
    totalProteinG += beverageTotals.proteinG;
    totalFatG += beverageTotals.fatG;
    totalSodiumMg += beverageTotals.sodiumMg;
    totalFiberG += beverageTotals.fiberG;

    // Sum from extras (~80 kcal per generic extra item if not specified)
    additionalFoods.forEach(() => {
      totalKcal += 80;
      totalProteinG += 4;
      totalCarbsG += 2;
      totalFatG += 5;
    });

    return {
      totalKcal: Math.round(totalKcal),
      totalCarbsG: parseFloat(totalCarbsG.toFixed(1)),
      totalSugarG: parseFloat(totalSugarG.toFixed(1)),
      totalProteinG: parseFloat(totalProteinG.toFixed(1)),
      totalFatG: parseFloat(totalFatG.toFixed(1)),
      totalFiberG: parseFloat(totalFiberG.toFixed(1)),
      totalSodiumMg: Math.round(totalSodiumMg),
    };
  }, [dishes, beverageTotals, additionalFoods]);

  // Meal Evaluation & Appropriateness Engine (การประเมินความเหมาะสมของมื้ออาหารตาม BMI)
  const mealEvaluation = useMemo(() => {
    if (!hasActiveMeal || nutrition.totalKcal === 0) {
      return {
        status: 'optimal' as AlertStatus,
        title: 'พร้อมประเมินโภชนาการ (ยังไม่ได้เลือกเมนู)',
        badgeText: 'รอเลือกเมนู',
        badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
        calorieRatioPercent: 0,
        diffKcal: 0,
        evaluationSummary:
          'เลือกเมนูยอดนิยม พิมพ์ชื่ออาหาร หรือถ่ายภาพ เพื่อเริ่มการประเมินความเหมาะสมของมื้ออาหารและรับคำแนะนำสำหรับมื้อต่อไปตามเกณฑ์ BMI',
        nextMealAdvice:
          'เลือกอาหารที่มีประโยชน์ สัดส่วนจาน 2:1:1 (ผัก 2 ส่วน : ข้าวแป้ง 1 ส่วน : โปรตีน 1 ส่วน)',
        glycemicRisk: 'low',
        sugarWarning: null,
      };
    }

    const { targetMealKcal, minOptimalMealKcal, maxOptimalMealKcal, mealLabel } = bmiInfo;
    const currentKcal = nutrition.totalKcal;
    const diffKcal = currentKcal - targetMealKcal;
    const calorieRatioPercent = Math.round((currentKcal / targetMealKcal) * 100);

    const maxCarbQuota = userProfile.targetCarbsPerMealG || 35;
    const maxSugarQuota = userProfile.targetSugarPerMealG || 10;
    const isCarbHigh = nutrition.totalCarbsG > maxCarbQuota;
    const isSugarHigh = nutrition.totalSugarG > maxSugarQuota;

    let status: AlertStatus = 'optimal';
    let title = `มื้อนี้ได้รับพลังงานเหมาะสมดีเยี่ยม (${currentKcal} kcal)`;
    let badgeText = 'เหมาะสมดีเยี่ยม';
    let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let evaluationSummary = '';
    let nextMealAdvice = '';

    if (currentKcal > maxOptimalMealKcal) {
      const excessKcal = currentKcal - targetMealKcal;
      status = currentKcal > targetMealKcal * 1.35 ? 'danger' : 'warning';
      title = `มื้อนี้ได้รับพลังงานเกินเกณฑ์แนะนำ (+${excessKcal} kcal)`;
      badgeText = status === 'danger' ? 'แคลอรีเกินเกณฑ์สูง' : 'ค่อนข้างเกินเกณฑ์';
      badgeColor =
        status === 'danger'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-amber-50 text-amber-800 border-amber-200';

      evaluationSummary = `มื้อนี้ได้รับพลังงาน ${currentKcal} kcal คิดเป็น ${calorieRatioPercent}% ของโควต้า${mealLabel}ที่แนะนำตามค่า BMI (${targetMealKcal} kcal) และมีคาร์โบไฮเดรต ${nutrition.totalCarbsG}g (น้ำตาล ${nutrition.totalSugarG}g)`;

      nextMealAdvice = `คำแนะนำสำหรับมื้อถัดไป: ควรปรับลดพลังงานลงประมาณ ${Math.min(
        excessKcal,
        250
      )} kcal โดยลดข้าวหรือแป้งลง 1 ทัพพี หลีกเลี่ยงของทอด แกงกะทิ และเครื่องดื่มหวาน เน้นรับประทานผักใบเขียวต้ม/นึ่ง และโปรตีนไขมันต่ำ (เช่น อกไก่ หรือเต้าหู้) เพื่อช่วยชดเชยพลังงานส่วนเกินและรักษาระดับน้ำตาลให้คงที่`;
    } else if (currentKcal < minOptimalMealKcal) {
      const deficitKcal = targetMealKcal - currentKcal;
      status = 'warning';
      title = `มื้อนี้ได้รับพลังงานต่ำกว่าเกณฑ์ (-${deficitKcal} kcal)`;
      badgeText = 'แคลอรีน้อยเกินไป';
      badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';

      evaluationSummary = `มื้อนี้ได้รับพลังงาน ${currentKcal} kcal คิดเป็น ${calorieRatioPercent}% ของโควต้า${mealLabel} (${targetMealKcal} kcal) ซึ่งอาจทำให้พลังงานไม่เพียงพอ หิวเร็ว หรือเสี่ยงต่อภาวะน้ำตาลในเลือดตกได้`;

      nextMealAdvice = `คำแนะนำสำหรับมื้อถัดไป: ควรเสริมพลังงานและสารอาหารคุณภาพดีเพิ่มประมาณ ${deficitKcal} kcal เช่น เพิ่มไข่ต้ม นมจืดไขมันต่ำ ถั่วเปลือกแข็ง หรือข้าวกล้องไม่ขัดสี เพื่อให้ร่างกายได้รับพลังงานครบตามเกณฑ์ BMI`;
    } else {
      status = 'optimal';
      title = `มื้อนี้ได้รับพลังงานเหมาะสมดีเยี่ยม (${currentKcal} kcal)`;
      badgeText = 'ปริมาณเหมาะสม';
      badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

      evaluationSummary = `มื้อนี้ได้รับพลังงาน ${currentKcal} kcal คิดเป็น ${calorieRatioPercent}% ของโควต้า${mealLabel} (${targetMealKcal} kcal) อยู่ในช่วงสมดุลที่เหมาะสมตามเกณฑ์ BMI สารอาหารอยู่ในระดับปลอดภัย`;

      nextMealAdvice = `คำแนะนำสำหรับมื้อถัดไป: รักษามาตรฐานการรับประทานตามสัดส่วน 2:1:1 ต่อไป ดื่มน้ำเปล่าให้เพียงพอ และแนะนำให้เดินย่อยเบาๆ 10-15 นาทีหลังอาหารเพื่อช่วยชะลอการดูดซึมน้ำตาล`;
    }

    return {
      status,
      title,
      badgeText,
      badgeColor,
      calorieRatioPercent,
      diffKcal,
      evaluationSummary,
      nextMealAdvice,
      glycemicRisk: isSugarHigh || isCarbHigh ? 'high' : 'normal',
      sugarWarning: isSugarHigh ? `น้ำตาลมื้อนี้ ${nutrition.totalSugarG}g เกินเกณฑ์ควบคุม (${maxSugarQuota}g)` : null,
    };
  }, [hasActiveMeal, nutrition, bmiInfo, userProfile]);

  // Add a Dish to the Meal (เพิ่มเมนูเข้ามื้ออาหาร)
  const handleAddDish = (dish: MealDishItem) => {
    soundFx.playSuccessChime();
    setDishes((prev) => [...prev, dish]);
    showToast(`✅ เพิ่ม "${dish.name}" เข้ามื้ออาหารแล้ว (+${dish.kcal} kcal)`);
  };

  // Add Multiple Dishes
  const handleAddMultipleDishes = (newDishes: MealDishItem[]) => {
    soundFx.playSuccessChime();
    setDishes((prev) => [...prev, ...newDishes]);
    showToast(`✅ เพิ่ม ${newDishes.length} เมนูเข้ามื้ออาหารเรียบร้อยแล้ว`);
  };

  // Add Custom Dish by name
  const handleAddCustomDishByName = async () => {
    if (!customDishInput.trim()) return;
    const name = customDishInput.trim();
    soundFx.playClickBeep();

    // Check if it matches any RAW_POPULAR_MENU_LIST
    const match = RAW_POPULAR_MENU_LIST.find((m) => m.name.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      handleAddDish({
        id: `dish_raw_${match.id}_${Date.now()}`,
        name: match.name,
        categoryType: match.categoryType,
        categoryThai: match.categoryThai,
        servingQty: 1,
        servingDesc: match.servingDesc,
        baseWeightG: match.defaultWeightG,
        kcal: match.kcal,
        carbsG: match.carbsG,
        sugarG: match.sugarG,
        proteinG: match.proteinG,
        fatG: match.fatG,
        sodiumMg: match.sodiumMg,
        fiberG: match.fiberG,
        gi: match.gi,
        healthNote: match.healthNote,
        diabetesSuitability: match.diabetesSuitability,
      });
      setCustomDishInput('');
      return;
    }

    // Default estimate for custom dish
    const newDish: MealDishItem = {
      id: `dish_custom_${Date.now()}`,
      name: name,
      categoryThai: 'อาหารปรุงสด/ตามสั่ง',
      servingQty: 1,
      servingDesc: '1 จาน/ชุด (~300g)',
      kcal: 350,
      carbsG: 40,
      sugarG: 2,
      proteinG: 16,
      fatG: 12,
      sodiumMg: 420,
      fiberG: 2,
      gi: 'medium',
      ingredients: [
        {
          id: `ing_${Date.now()}_carb`,
          name: 'ข้าวสวย / แป้งหลัก',
          category: 'carb',
          ratioPercent: 45,
          weightGrams: 135,
          density: {
            kcalPer100g: 130,
            carbsPer100g: 28,
            sugarPer100g: 0.1,
            proteinPer100g: 2.7,
            fatPer100g: 0.3,
            fiberPer100g: 0.4,
            sodiumPer100g: 1,
            glycemicIndex: 'medium',
          },
          gi: 'medium',
          isSelected: true,
        },
        {
          id: `ing_${Date.now()}_protein`,
          name: 'เนื้อสัตว์ / โปรตีน',
          category: 'protein',
          ratioPercent: 35,
          weightGrams: 105,
          density: {
            kcalPer100g: 140,
            carbsPer100g: 2,
            sugarPer100g: 0.5,
            proteinPer100g: 18,
            fatPer100g: 7,
            fiberPer100g: 0.1,
            sodiumPer100g: 150,
            glycemicIndex: 'low',
          },
          gi: 'low',
          isSelected: true,
        },
        {
          id: `ing_${Date.now()}_veg`,
          name: 'ผักเคียง / สมุนไพร',
          category: 'vegetable',
          ratioPercent: 20,
          weightGrams: 60,
          density: {
            kcalPer100g: 25,
            carbsPer100g: 4,
            sugarPer100g: 1.5,
            proteinPer100g: 1.5,
            fatPer100g: 0.2,
            fiberPer100g: 2.5,
            sodiumPer100g: 15,
            glycemicIndex: 'low',
          },
          gi: 'low',
          isSelected: true,
        },
      ],
    };

    handleAddDish(newDish);
    setCustomDishInput('');
  };

  // Change Dish Serving Quantity
  const handleUpdateDishQty = (dishId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveDish(dishId);
      return;
    }
    soundFx.playClickBeep();
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id !== dishId) return d;
        const baseKcal = d.kcal / (d.servingQty || 1);
        const baseCarbs = d.carbsG / (d.servingQty || 1);
        const baseSugar = d.sugarG / (d.servingQty || 1);
        const baseProtein = d.proteinG / (d.servingQty || 1);
        const baseFat = d.fatG / (d.servingQty || 1);
        const baseSodium = d.sodiumMg / (d.servingQty || 1);
        const baseFiber = d.fiberG / (d.servingQty || 1);

        return {
          ...d,
          servingQty: newQty,
          kcal: Math.round(baseKcal * newQty),
          carbsG: Math.round(baseCarbs * newQty),
          sugarG: parseFloat((baseSugar * newQty).toFixed(1)),
          proteinG: Math.round(baseProtein * newQty),
          fatG: Math.round(baseFat * newQty),
          sodiumMg: Math.round(baseSodium * newQty),
          fiberG: Math.round(baseFiber * newQty),
        };
      })
    );
  };

  // Remove Dish
  const handleRemoveDish = (dishId: string) => {
    soundFx.playClickBeep();
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
    showToast('ลบรายการเมนูออกแล้ว');
  };

  // Toggle Dish Ingredients Accordion
  const toggleExpandDish = (dishId: string) => {
    setExpandedDishIds((prev) => ({
      ...prev,
      [dishId]: !prev[dishId],
    }));
  };

  // Clear All Meal Items
  const handleClearAll = () => {
    soundFx.playClickBeep();
    setDishes([]);
    setSelectedBeverages([]);
    setAdditionalFoods([]);
    showToast('ล้างรายการอาหารทั้งหมดเรียบร้อย');
  };

  // Add Extra Side Food
  const handleAddExtraFood = (name: string) => {
    if (!name.trim()) return;
    soundFx.playSuccessChime();
    setAdditionalFoods((prev) => [
      ...prev,
      { id: `extra_${Date.now()}`, name: name.trim(), weightG: 80 },
    ]);
    setNewExtraFoodName('');
    showToast(`✅ เพิ่ม "${name.trim()}" เข้ามื้ออาหารแล้ว`);
  };

  // Remove Extra Side Food
  const handleRemoveExtraFood = (id: string) => {
    soundFx.playClickBeep();
    setAdditionalFoods((prev) => prev.filter((item) => item.id !== id));
  };

  // Beverage Management
  const handleToggleBeverage = (bev: BeverageItem) => {
    soundFx.playSuccessChime();
    setSelectedBeverages((prev) => {
      const exists = prev.some((b) => b.id === bev.id || b.name === bev.name);
      if (exists) {
        showToast(`ลบ "${bev.name}" ออกจากเครื่องดื่มแล้ว`);
        return prev.filter((b) => b.id !== bev.id && b.name !== bev.name);
      }
      showToast(`✅ เพิ่มเครื่องดื่ม "${bev.name}" (${bev.kcal} kcal) แล้ว`);
      return [...prev, bev];
    });
  };

  const handleRemoveBeverage = (bevId: string) => {
    soundFx.playClickBeep();
    setSelectedBeverages((prev) => prev.filter((b) => b.id !== bevId));
    showToast('ลบรายการเครื่องดื่มออกแล้ว');
  };

  // Save Meal Log
  const handleSaveToHistory = () => {
    if (!hasActiveMeal) return;
    soundFx.playSuccessChime();

    const mealNamesList = dishes.map((d) => d.name).join(', ') || 'มื้ออาหารสุขภาพ';

    const newLog: MealLog = {
      id: `meal_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      mealType,
      mealName: mealNamesList,
      dishes: dishes,
      additionalFoods: additionalFoods.length > 0 ? additionalFoods : undefined,
      beverages: selectedBeverages.map((bev) => ({
        id: bev.id,
        name: bev.name,
        nameEn: bev.nameEn,
        volumeMl: bev.volumeMl,
        kcal: bev.kcal,
        sugarG: bev.sugarG,
        carbsG: bev.carbsG,
      })),
      compartments: dishes.flatMap((d) =>
        (d.ingredients || []).map((ing) => ({
          type: (ing.category === 'condiment' || ing.category === 'fat' ? 'protein' : ing.category) as any,
          foodName: `${d.name} - ${ing.name}`,
          weightG: ing.weightGrams || 100,
          kcal: Math.round(((ing.weightGrams || 100) * ing.density.kcalPer100g) / 100),
          carbsG: Math.round(((ing.weightGrams || 100) * ing.density.carbsPer100g) / 100),
        }))
      ),
      totalKcal: nutrition.totalKcal,
      totalCarbsG: nutrition.totalCarbsG,
      totalSugarG: nutrition.totalSugarG,
      totalFiberG: nutrition.totalFiberG,
      status: mealEvaluation.status,
      clinicalFeedback: mealEvaluation.nextMealAdvice,
    };

    onSaveMeal(newLog);
    setSaveSuccessMessage(`บันทึก${bmiInfo.mealLabel}สำเร็จ (${nutrition.totalKcal} kcal) พร้อมอัปเดตสถิติ 14 วัน`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-black px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500/40 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / User Target Summary */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shrink-0 border border-emerald-100">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  AI Nutrition Estimator • ระบบประเมินแคลอรีมื้ออาหาร
                </span>
                {bmiInfo.hasBmi && (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${bmiInfo.bmiCategoryColor}`}>
                    BMI: {bmiInfo.bmi} ({bmiInfo.bmiCategoryText})
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                ประเมินแคลอรีมื้ออาหาร & วิเคราะห์ความเหมาะสม
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                เพิ่มเมนูอาหารได้ไม่จำกัด เลือกจากคลัง 100+ เมนูยอดนิยม และประเมินสารอาหารตามเกณฑ์ BMI ทันที
              </p>
            </div>
          </div>

          {/* Meal Type Quick Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
              const labels = {
                breakfast: 'มื้อเช้า',
                lunch: 'มื้อกลางวัน',
                dinner: 'มื้อเย็น',
                snack: 'ของว่าง',
              };
              const isSelected = mealType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    soundFx.playClickBeep();
                    setMealType(type);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Target & This Meal Quota Pill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <span className="text-xs font-bold text-slate-600 block">🎯 พลังงานพื้นฐานของร่างกาย (BMR)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{bmiInfo.dailyTargetKcal.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-bold">kcal/วัน</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">คำนวณอัตโนมัติจากสูตร BMR</span>
          </div>

          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/70">
            <span className="text-xs font-bold text-emerald-900 block">โควต้าแนะนำสำหรับ{bmiInfo.mealLabel}</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                {bmiInfo.minOptimalMealKcal} - {bmiInfo.maxOptimalMealKcal}
              </span>
              <span className="text-xs text-emerald-700 font-bold">kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Food Input & Composition, Right = Clinical Nutrition & Next Meal Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Menu Selector & Ingredients Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Menu Name Input & Quick Selectors */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  เพิ่มเมนูอาหารในมื้อนี้ (ไม่จำกัดจำนวน)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenPhotoScanner}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-all border border-blue-200/60"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ถ่ายภาพ AI</span>
                </button>
                {hasActiveMeal && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>ล้างทั้งหมด</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dish Name Search/Input Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customDishInput}
                  onChange={(e) => setCustomDishInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDishByName()}
                  placeholder="พิมพ์ชื่อเมนูอาหารเพื่อเพิ่ม เช่น ข้าวมันไก่, แกงส้ม, ส้มตำ..."
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
                {customDishInput && (
                  <button
                    type="button"
                    onClick={() => setCustomDishInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddCustomDishByName}
                disabled={!customDishInput.trim()}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-all disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มเมนู</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPopularMenuModal(true)}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">คลังเมนูยอดนิยม (100+)</span>
                <span className="sm:hidden">คลังเมนู</span>
              </button>
            </div>

            {/* Popular Dish Quick Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-2">เมนูยอดนิยมกดเพิ่มได้ทันที:</span>
              <div className="flex flex-wrap gap-1.5">
                {RAW_POPULAR_MENU_LIST.slice(0, 10).map((rawItem) => {
                  const isAdded = dishes.some((d) => d.name === rawItem.name);
                  return (
                    <button
                      key={rawItem.id}
                      type="button"
                      onClick={() => {
                        handleAddDish({
                          id: `dish_raw_${rawItem.id}_${Date.now()}`,
                          name: rawItem.name,
                          categoryType: rawItem.categoryType,
                          categoryThai: rawItem.categoryThai,
                          servingQty: 1,
                          servingDesc: rawItem.servingDesc,
                          baseWeightG: rawItem.defaultWeightG,
                          kcal: rawItem.kcal,
                          carbsG: rawItem.carbsG,
                          sugarG: rawItem.sugarG,
                          proteinG: rawItem.proteinG,
                          fatG: rawItem.fatG,
                          sodiumMg: rawItem.sodiumMg,
                          fiberG: rawItem.fiberG,
                          gi: rawItem.gi,
                          healthNote: rawItem.healthNote,
                          diabetesSuitability: rawItem.diabetesSuitability,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200/80 hover:border-emerald-300'
                      }`}
                    >
                      {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{rawItem.name}</span>
                      <span className={`text-[10px] ${isAdded ? 'text-emerald-100' : 'text-slate-400'}`}>
                        ({rawItem.kcal}k)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* List of Selected Dishes in This Meal (รายการเมนูอาหารในมื้อนี้) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  รายการเมนูอาหารในมื้อนี้ ({dishes.length} เมนู)
                </span>
                <span className="text-[11px] text-slate-400">
                  ปรับจำนวนจาน/ขนาดบริโภค หรือกดเพิ่มเมนูอื่นได้อย่างอิสระ
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPopularMenuModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-all border border-emerald-200/80 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>เพิ่มเมนูจากคลัง</span>
              </button>
            </div>

            {/* Zero State if empty */}
            {dishes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-2.5">
                <Utensils className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">ยังไม่มีรายการเมนูอาหารในมื้อนี้</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  คุณสามารถเพิ่มเมนูได้ไม่จำกัด โดยกดเลือกจากคลังเมนูยอดนิยม หรือพิมพ์ชื่อเมนูอาหารด้านบน
                </p>
                <button
                  type="button"
                  onClick={() => setShowPopularMenuModal(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>เปิดคลังเมนูยอดนิยม (100+ เมนู)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dishes.map((dish, idx) => {
                  const isExpanded = Boolean(expandedDishIds[dish.id]);

                  return (
                    <div
                      key={dish.id}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-emerald-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900">{dish.name}</span>
                            {dish.categoryThai && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                                {dish.categoryThai}
                              </span>
                            )}
                            {dish.gi && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  dish.gi === 'low'
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : dish.gi === 'medium'
                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                GI: {dish.gi.toUpperCase()}
                              </span>
                            )}
                          </div>

                          {dish.healthNote && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{dish.healthNote}</p>
                          )}

                          <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="font-extrabold text-emerald-700">{dish.kcal} kcal</span>
                            <span>•</span>
                            <span>คาร์บ {dish.carbsG}g</span>
                            <span>•</span>
                            <span>นต. {dish.sugarG}g</span>
                            <span>•</span>
                            <span>โปรตีน {dish.proteinG}g</span>
                            <span>•</span>
                            <span>ไขมัน {dish.fatG}g</span>
                          </div>
                        </div>

                        {/* Serving Qty Adjuster & Delete Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateDishQty(dish.id, Math.max(0.5, (dish.servingQty || 1) - 0.5))}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-slate-900 px-1.5 min-w-9 text-center font-mono">
                              {dish.servingQty || 1} จาน
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateDishQty(dish.id, (dish.servingQty || 1) + 0.5)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDish(dish.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                            title="ลบเมนูนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Extra Food Items & Side Dishes (ปุ่มกดบวกเพิ่มอาหารอื่น) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  อาหารเสริม / กับข้าวเคียง / ของทานเล่น
                </span>
                <span className="text-[11px] text-slate-400">
                  เพิ่มอาหารที่รับประทานร่วมในมื้อ เช่น ไข่ดาว, ไข่ต้ม, ผลไม้เคียง
                </span>
              </div>
            </div>

            {/* Quick Add Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['ไข่ต้ม 1 ฟอง', 'ไข่ดาว 1 ฟอง', 'ข้าวสวยเพิ่ม 1 ทัพพี', 'ฝรั่ง 4 ชิ้น', 'แก้วมังกร 1 ถ้วย'].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleAddExtraFood(item)}
                    className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-semibold border border-slate-200/80 transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>{item}</span>
                  </button>
                )
              )}
            </div>

            {/* Extra Foods Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newExtraFoodName}
                onChange={(e) => setNewExtraFoodName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExtraFood(newExtraFoodName)}
                placeholder="พิมพ์ชื่ออาหารอื่นที่ทานเพิ่ม..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddExtraFood(newExtraFoodName)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shrink-0"
              >
                + เพิ่ม
              </button>
            </div>

            {/* Added Extra Foods List */}
            {additionalFoods.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {additionalFoods.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold"
                  >
                    <span>{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraFood(item.id)}
                      className="text-emerald-700 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Beverage Selector Component */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    เครื่องดื่มประจำมื้อ ({selectedBeverages.length} รายการ)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    เลือกเครื่องดื่มร่วมมื้อเพื่อประเมินแคลอรีและระดับน้ำตาลอย่างแม่นยำ
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBeverageModal(true)}
                className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200/80 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>เปิดคลังเครื่องดื่ม (74 ชนิด)</span>
              </button>
            </div>

            {/* Quick-add popular drinks chips */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">เครื่องดื่มยอดนิยมกดเลือกได้ทันที:</span>
              <div className="flex flex-wrap gap-1.5">
                {BEVERAGE_MASTER_LIST.slice(0, 10).map((bev) => {
                  const isSelected = selectedBeverages.some((b) => b.id === bev.id || b.name === bev.name);
                  return (
                    <button
                      key={bev.id}
                      type="button"
                      onClick={() => handleToggleBeverage(bev)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-teal-50 text-slate-700 border-slate-200/80 hover:border-teal-300'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-teal-600" />}
                      <span>{bev.name}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                        ({bev.kcal}k)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Beverages Detailed List */}
            {selectedBeverages.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-400">
                  ยังไม่ได้เลือกเครื่องดื่ม (หากดื่มน้ำเปล่า 0 kcal หรือไม่ทานเครื่องดื่มเพิ่ม สามารถข้ามได้ครับ)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {selectedBeverages.map((bev) => (
                  <div
                    key={bev.id}
                    className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-start justify-between gap-2 shadow-2xs animate-in fade-in"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-teal-950 truncate">{bev.name}</span>
                        <span className="text-[10px] text-teal-700 font-medium">({bev.servingDesc})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-teal-800 flex-wrap">
                        <span className="font-extrabold text-teal-900">{bev.kcal} kcal</span>
                        <span>•</span>
                        <span>น้ำตาล {bev.sugarG}g</span>
                        <span>•</span>
                        <span>คาร์บ {bev.carbsG}g</span>
                      </div>
                      {bev.healthNote && (
                        <p className="text-[10px] text-teal-700 line-clamp-1">{bev.healthNote}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBeverage(bev.id)}
                      className="p-1.5 text-teal-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="ลบเครื่องดื่มนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Clinical Evaluation & Next Meal Guidance */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Calorie & Nutrition Summary Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                ผลการคำนวณแคลอรีรวมมื้อนี้
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {dishes.length} เมนู • {selectedBeverages.length} เครื่องดื่ม
              </span>
            </div>

            {/* Big Calorie Display */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
                  พลังงานรวมมื้อนี้
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
                    {nutrition.totalKcal}
                  </span>
                  <span className="text-sm font-medium text-slate-400">kcal</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-400 block">
                  เทียบโควต้า{bmiInfo.mealLabel}
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {mealEvaluation.calorieRatioPercent}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  เป้าหมาย: {bmiInfo.targetMealKcal} kcal
                </span>
              </div>
            </div>

            {/* Nutrient Pillars (Carb, Sugar, Protein, Fat, Sodium) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">คาร์โบไฮเดรต</span>
                <span className="text-base font-black font-mono text-blue-900">{nutrition.totalCarbsG}g</span>
                <span className="text-[10px] text-blue-600 block mt-0.5">เป้า ≤{userProfile.targetCarbsPerMealG || 35}g</span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">น้ำตาล</span>
                <span className="text-base font-black font-mono text-rose-900">{nutrition.totalSugarG}g</span>
                <span className="text-[10px] text-rose-600 block mt-0.5">เป้า ≤{userProfile.targetSugarPerMealG || 10}g</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">โปรตีน</span>
                <span className="text-base font-black font-mono text-emerald-900">{nutrition.totalProteinG}g</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">ไขมัน {nutrition.totalFatG}g</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">โซเดียม / ใยอาหาร</span>
                <span className="text-base font-black font-mono text-amber-900">{nutrition.totalSodiumMg}mg</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">ใยอาหาร {nutrition.totalFiberG}g</span>
              </div>
            </div>
          </div>

          {/* Meal Appropriateness Evaluation Card (การประเมินความเหมาะสมของมื้ออาหาร) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  การประเมินความเหมาะสมของมื้ออาหาร
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${mealEvaluation.badgeColor}`}>
                {mealEvaluation.badgeText}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                {mealEvaluation.status === 'optimal' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : mealEvaluation.status === 'danger' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{mealEvaluation.title}</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{mealEvaluation.evaluationSummary}</p>
            </div>
          </div>

          {/* Next Meal Strategic Guidance Card (คำแนะนำการปรับอาหารและแคลอรีสำหรับมื้อถัดไป) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl p-5 sm:p-6 shadow-xs border border-emerald-200/80 space-y-4">
            <div className="flex items-center gap-2 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-wider">
                คำแนะนำการปรับอาหาร & แคลอรีสำหรับมื้อถัดไป
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/60 shadow-2xs space-y-2.5">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {mealEvaluation.nextMealAdvice}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>เกณฑ์โภชนาการทางการแพทย์สำหรับเบาหวาน & NCDs</span>
                <span className="font-bold text-emerald-700">จานสุขภาพ 2:1:1</span>
              </div>
            </div>

            {/* Action Buttons: Save Meal Log & View 14-Day Stats */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={!hasActiveMeal}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกมื้ออาหารนี้ลงในสถิติ 14 วัน</span>
              </button>

              {saveSuccessMessage && (
                <div className="p-3 bg-emerald-100/90 text-emerald-900 rounded-xl text-xs font-bold text-center border border-emerald-300 animate-in fade-in">
                  {saveSuccessMessage}
                </div>
              )}

              <button
                type="button"
                onClick={onOpenFourteenDayStats}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <span>ดูประวัติ & สถิติ 14 วัน (14-Day Health Log)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popular 100+ Menu Selector Modal */}
      {showPopularMenuModal && (
        <PopularMenuSelectorModal
          isOpen={showPopularMenuModal}
          onClose={() => setShowPopularMenuModal(false)}
          onAddDish={(dish) => {
            handleAddDish(dish);
          }}
          onAddMultipleDishes={(multiDishes) => {
            handleAddMultipleDishes(multiDishes);
          }}
          onSelectRawMenu={(rawItem) => {
            handleAddDish({
              id: `dish_raw_${rawItem.id}_${Date.now()}`,
              name: rawItem.name,
              categoryType: rawItem.categoryType,
              categoryThai: rawItem.categoryThai,
              servingQty: 1,
              servingDesc: rawItem.servingDesc,
              baseWeightG: rawItem.defaultWeightG,
              kcal: rawItem.kcal,
              carbsG: rawItem.carbsG,
              sugarG: rawItem.sugarG,
              proteinG: rawItem.proteinG,
              fatG: rawItem.fatG,
              sodiumMg: rawItem.sodiumMg,
              fiberG: rawItem.fiberG,
              gi: rawItem.gi,
              healthNote: rawItem.healthNote,
              diabetesSuitability: rawItem.diabetesSuitability,
            });
          }}
          selectedDishNames={dishes.map((d) => d.name)}
        />
      )}

      {/* Beverage Selector Modal (74 Drink varieties) */}
      {showBeverageModal && (
        <BeverageSelectorModal
          isOpen={showBeverageModal}
          onClose={() => setShowBeverageModal(false)}
          selectedBeverages={selectedBeverages}
          selectedBeverageNames={selectedBeverages.map((b) => b.name)}
          onSelectBeverage={handleToggleBeverage}
          onToggleBeverage={handleToggleBeverage}
        />
      )}
    </div>
  );
};
