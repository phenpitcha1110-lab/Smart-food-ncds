import { DishPreset, MealIngredientItem } from '../types';
import { RAW_POPULAR_MENU_LIST, convertRawMenuToPreset } from './popularMenuData';

// Generate all popular presets from the newly structured user-requested list
export const POPULAR_DISH_PRESETS: DishPreset[] = RAW_POPULAR_MENU_LIST.map(convertRawMenuToPreset);

// Helper to calculate total nutrition from a meal weight and its ingredient list (Client calculation / fallback)
export function calculateMealNutrition(
  totalMealWeightG: number,
  ingredients: MealIngredientItem[],
  useIndividualWeights: boolean = false,
  calculationMode: 'proportional_ingredients' | 'direct_dish' = 'proportional_ingredients'
) {
  let totalCalculatedWeight = 0;
  let totalKcal = 0;
  let totalCarbsG = 0;
  let totalSugarG = 0;
  let totalProteinG = 0;
  let totalFatG = 0;
  let totalFiberG = 0;
  let totalSodiumMg = 0;

  // Filter only selected ingredients (or all if none specified)
  const activeIngredients = ingredients.filter((ing) => ing.isSelected !== false);

  if (totalMealWeightG <= 0 && activeIngredients.length === 0) {
    return {
      finalWeightG: 0,
      totalKcal: 0,
      totalCarbsG: 0,
      totalSugarG: 0,
      totalProteinG: 0,
      totalFatG: 0,
      totalFiberG: 0,
      totalSodiumMg: 0,
      resolvedIngredients: [],
    };
  }

  if (calculationMode === 'direct_dish' || activeIngredients.length === 0) {
    if (totalMealWeightG <= 0) {
      return {
        finalWeightG: 0,
        totalKcal: 0,
        totalCarbsG: 0,
        totalSugarG: 0,
        totalProteinG: 0,
        totalFatG: 0,
        totalFiberG: 0,
        totalSodiumMg: 0,
        resolvedIngredients: [],
      };
    }
    const factor = totalMealWeightG / 100;
    return {
      finalWeightG: totalMealWeightG,
      totalKcal: Math.round(135 * factor),
      totalCarbsG: parseFloat((16.5 * factor).toFixed(1)),
      totalSugarG: parseFloat((1.5 * factor).toFixed(1)),
      totalProteinG: parseFloat((7.0 * factor).toFixed(1)),
      totalFatG: parseFloat((4.5 * factor).toFixed(1)),
      totalFiberG: parseFloat((1.8 * factor).toFixed(1)),
      totalSodiumMg: Math.round(350 * factor),
      resolvedIngredients: [],
    };
  }

  // Calculate sum of ratios for normalization if using total weight
  const totalRatio = activeIngredients.reduce((sum, ing) => sum + (ing.ratioPercent || 0), 0) || 100;

  const resolvedIngredients = activeIngredients.map((ing) => {
    let ingWeightG = 0;
    if (useIndividualWeights && ing.weightGrams !== undefined && ing.weightGrams > 0) {
      ingWeightG = ing.weightGrams;
    } else {
      const normalizedRatio = (ing.ratioPercent || 0) / totalRatio;
      ingWeightG = Math.round(totalMealWeightG * normalizedRatio);
    }

    totalCalculatedWeight += ingWeightG;
    const factor = ingWeightG / 100;

    const ingKcal = Math.round((ing.density?.kcalPer100g || 0) * factor);
    const ingCarbs = parseFloat(((ing.density?.carbsPer100g || 0) * factor).toFixed(1));
    const ingSugar = parseFloat(((ing.density?.sugarPer100g || 0) * factor).toFixed(1));
    const ingProtein = parseFloat(((ing.density?.proteinPer100g || 0) * factor).toFixed(1));
    const ingFat = parseFloat(((ing.density?.fatPer100g || 0) * factor).toFixed(1));
    const ingFiber = parseFloat(((ing.density?.fiberPer100g || 0) * factor).toFixed(1));
    const ingSodium = Math.round((ing.density?.sodiumPer100g || 0) * factor);

    totalKcal += ingKcal;
    totalCarbsG += ingCarbs;
    totalSugarG += ingSugar;
    totalProteinG += ingProtein;
    totalFatG += ingFat;
    totalFiberG += ingFiber;
    totalSodiumMg += ingSodium;

    return {
      ...ing,
      resolvedWeightG: ingWeightG,
      calculatedKcal: ingKcal,
      calculatedCarbsG: ingCarbs,
      calculatedSugarG: ingSugar,
      calculatedProteinG: ingProtein,
      calculatedFatG: ingFat,
      calculatedFiberG: ingFiber,
      calculatedSodiumMg: ingSodium,
    };
  });

  const finalWeightG = useIndividualWeights ? totalCalculatedWeight : totalMealWeightG;

  return {
    finalWeightG,
    totalKcal: Math.round(totalKcal),
    totalCarbsG: parseFloat(totalCarbsG.toFixed(1)),
    totalSugarG: parseFloat(totalSugarG.toFixed(1)),
    totalProteinG: parseFloat(totalProteinG.toFixed(1)),
    totalFatG: parseFloat(totalFatG.toFixed(1)),
    totalFiberG: parseFloat(totalFiberG.toFixed(1)),
    totalSodiumMg: Math.round(totalSodiumMg),
    resolvedIngredients,
  };
}
