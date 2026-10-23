import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  Flame,
  Wheat,
  Fish,
  Leaf,
  Apple,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  Utensils,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { MealIngredientItem, CompartmentType, FoodDensityProfile, UserProfile } from '../types';
import { soundFx } from '../utils/audio';

interface MenuDetailEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishNameThai: string;
  dishNameEn?: string;
  onSaveDetails: (data: {
    dishNameThai: string;
    dishNameEn?: string;
    notes?: string;
    ingredients: MealIngredientItem[];
    calorieRange?: string;
  }) => void;
  initialIngredients: MealIngredientItem[];
  initialNotes?: string;
  userProfile?: UserProfile;
}

// Quick ingredient presets to add with 1-click
const QUICK_INGREDIENT_PRESETS = [
  { name: 'ไข่ต้ม 1 ฟอง', category: 'protein' as const, weightG: 50, kcal: 75, protein: 6.5, carbs: 0.6, fat: 5.0 },
  { name: 'ไข่ดาว 1 ฟอง', category: 'protein' as const, weightG: 50, kcal: 120, protein: 6.0, carbs: 0.8, fat: 10.0 },
  { name: 'ข้าวสวย (1 ทัพพี)', category: 'carb' as const, weightG: 80, kcal: 80, protein: 1.5, carbs: 18.0, fat: 0.2 },
  { name: 'ข้าวไรซ์เบอร์รี่ (1 ทัพพี)', category: 'carb' as const, weightG: 80, kcal: 75, protein: 2.0, carbs: 16.0, fat: 0.5 },
  { name: 'อกไก่ต้ม/นึ่ง', category: 'protein' as const, weightG: 100, kcal: 120, protein: 26.0, carbs: 0.0, fat: 1.5 },
  { name: 'ผักลวก/ต้มรวม', category: 'vegetable' as const, weightG: 100, kcal: 30, protein: 2.0, carbs: 5.0, fat: 0.2 },
  { name: 'แตงกวาเคียง', category: 'vegetable' as const, weightG: 50, kcal: 8, protein: 0.4, carbs: 1.5, fat: 0.1 },
  { name: 'น้ำมันพืชสำหรับผัด (1 ชช.)', category: 'fat' as const, weightG: 5, kcal: 45, protein: 0.0, carbs: 0.0, fat: 5.0 },
  { name: 'ฝรั่งสด (1 กำมือ)', category: 'fruit' as const, weightG: 80, kcal: 35, protein: 0.8, carbs: 8.0, fat: 0.2 },
  { name: 'แอปเปิ้ลเขียว (ครึ่งผล)', category: 'fruit' as const, weightG: 70, kcal: 36, protein: 0.3, carbs: 9.5, fat: 0.1 },
];

export const MenuDetailEditorModal: React.FC<MenuDetailEditorModalProps> = ({
  isOpen,
  onClose,
  dishNameThai,
  dishNameEn = '',
  onSaveDetails,
  initialIngredients,
  initialNotes = '',
  userProfile,
}) => {
  const [nameThai, setNameThai] = useState<string>(dishNameThai);
  const [nameEn, setNameEn] = useState<string>(dishNameEn);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [ingredients, setIngredients] = useState<MealIngredientItem[]>(initialIngredients);

  // New Custom Ingredient Form
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<CompartmentType | 'condiment' | 'fat'>('protein');
  const [customWeightG, setCustomWeightG] = useState<number>(80);
  const [customKcal, setCustomKcal] = useState<number>(100);
  const [customCarbs, setCustomCarbs] = useState<number>(5);
  const [customProtein, setCustomProtein] = useState<number>(15);
  const [customFat, setCustomFat] = useState<number>(3);

  // Calculate live nutrition summary
  const totals = useMemo(() => {
    let weight = 0;
    let kcal = 0;
    let carbs = 0;
    let protein = 0;
    let fat = 0;
    let fiber = 0;
    let sodium = 0;

    ingredients.forEach((ing) => {
      if (ing.isSelected === false) return;
      const ingWeight = ing.weightGrams || Math.round(ing.density.kcalPer100g > 0 ? (ing.ratioPercent || 50) : 50);
      const factor = ingWeight / 100;

      weight += ingWeight;
      kcal += (ing.density.kcalPer100g || 0) * factor;
      carbs += (ing.density.carbsPer100g || 0) * factor;
      protein += (ing.density.proteinPer100g || 0) * factor;
      fat += (ing.density.fatPer100g || 0) * factor;
      fiber += (ing.density.fiberPer100g || 0) * factor;
      sodium += (ing.density.sodiumPer100g || 0) * factor;
    });

    const totalKcalRounded = Math.round(kcal);
    // Calculate Calorie Range (+/- 8% for unvisible seasonings/fats)
    const minKcal = Math.max(10, Math.round(totalKcalRounded * 0.93));
    const maxKcal = Math.round(totalKcalRounded * 1.08);
    const calorieRange = `${minKcal} - ${maxKcal} kcal`;

    return {
      totalWeightG: Math.round(weight),
      totalKcal: totalKcalRounded,
      calorieRange,
      totalCarbsG: parseFloat(carbs.toFixed(1)),
      totalProteinG: parseFloat(protein.toFixed(1)),
      totalFatG: parseFloat(fat.toFixed(1)),
      totalFiberG: parseFloat(fiber.toFixed(1)),
      totalSodiumMg: Math.round(sodium),
    };
  }, [ingredients]);

  if (!isOpen) return null;

  // Add quick preset item
  const handleAddQuickPreset = (preset: typeof QUICK_INGREDIENT_PRESETS[0]) => {
    soundFx.playClickBeep();
    const factor = 100 / preset.weightG;
    const newId = `ing_quick_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newIng: MealIngredientItem = {
      id: newId,
      name: preset.name,
      category: preset.category,
      ratioPercent: 20,
      weightGrams: preset.weightG,
      density: {
        kcalPer100g: Math.round(preset.kcal * factor),
        carbsPer100g: parseFloat((preset.carbs * factor).toFixed(1)),
        sugarPer100g: 0.5,
        proteinPer100g: parseFloat((preset.protein * factor).toFixed(1)),
        fatPer100g: parseFloat((preset.fat * factor).toFixed(1)),
        fiberPer100g: 0.5,
        sodiumPer100g: 60,
        glycemicIndex: 'low',
      },
      gi: 'low',
      isSelected: true,
      isCustom: true,
    };

    setIngredients((prev) => [...prev, newIng]);
  };

  // Add custom ingredient
  const handleAddCustomIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    soundFx.playSuccessBeep();

    const factor = 100 / (customWeightG || 100);
    const newId = `ing_custom_${Date.now()}`;
    const newIng: MealIngredientItem = {
      id: newId,
      name: customName.trim(),
      category: customCategory,
      ratioPercent: 20,
      weightGrams: Number(customWeightG) || 80,
      density: {
        kcalPer100g: Math.round((Number(customKcal) || 0) * factor),
        carbsPer100g: parseFloat(((Number(customCarbs) || 0) * factor).toFixed(1)),
        sugarPer100g: 0.5,
        proteinPer100g: parseFloat(((Number(customProtein) || 0) * factor).toFixed(1)),
        fatPer100g: parseFloat(((Number(customFat) || 0) * factor).toFixed(1)),
        fiberPer100g: 1.0,
        sodiumPer100g: 50,
        glycemicIndex: 'low',
      },
      gi: 'low',
      isSelected: true,
      isCustom: true,
    };

    setIngredients((prev) => [...prev, newIng]);
    setCustomName('');
    setShowAddForm(false);
  };

  // Delete ingredient
  const handleDeleteIngredient = (id: string) => {
    soundFx.playClickBeep();
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  // Update ingredient weight
  const handleUpdateWeight = (id: string, weightG: number) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, weightGrams: Math.max(0, weightG) } : ing))
    );
  };

  // Toggle ingredient selection
  const handleToggleSelect = (id: string) => {
    soundFx.playClickBeep();
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, isSelected: !ing.isSelected } : ing))
    );
  };

  const handleSave = () => {
    soundFx.playSuccessChime();
    onSaveDetails({
      dishNameThai: nameThai.trim() || 'เมนูอาหาร',
      dishNameEn: nameEn.trim() || undefined,
      notes: notes.trim() || undefined,
      ingredients,
      calorieRange: totals.calorieRange,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="menu-detail-editor-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                เพิ่ม & แก้ไขรายละเอียดเมนู (Menu Details & Ingredients)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ปรับแต่งวัตถุดิบ น้ำหนัก แคลอรี และบันทึกหมายเหตุการปรุงอาหาร
              </p>
            </div>
          </div>
          <button
            id="close-menu-detail-modal-btn"
            onClick={() => {
              soundFx.playClickBeep();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Menu Names (Thai & English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่อเมนู (ภาษาไทย) <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-dish-name-thai"
                type="text"
                value={nameThai}
                onChange={(e) => setNameThai(e.target.value)}
                placeholder="เช่น ผัดกะเพราไก่ไข่ดาว"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่อเมนูภาษาอังกฤษ (English Name)
              </label>
              <input
                id="edit-dish-name-en"
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Stir-Fried Holy Basil with Chicken & Fried Egg"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Calorie Range & Totals Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg border border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>การประเมินพลังงานรวม (Calorie Range)</span>
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {totals.calorieRange}
                  <span className="text-sm font-normal text-slate-300 ml-2">
                    (เฉลี่ย ≈ {totals.totalKcal} kcal)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  *รวมช่วงพลังงานเนื่องจากปัจจัยที่มองไม่เห็นด้วยตาเปล่า เช่น น้ำมันปรุงอาหาร หรือซอสปรุงรส
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
                <div className="text-center">
                  <span className="text-slate-400 block">คาร์บ</span>
                  <span className="font-bold text-sm text-emerald-300">{totals.totalCarbsG}g</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="text-center">
                  <span className="text-slate-400 block">โปรตีน</span>
                  <span className="font-bold text-sm text-blue-300">{totals.totalProteinG}g</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="text-center">
                  <span className="text-slate-400 block">ไขมัน</span>
                  <span className="font-bold text-sm text-amber-300">{totals.totalFatG}g</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="text-center">
                  <span className="text-slate-400 block">น้ำหนัก</span>
                  <span className="font-bold text-sm text-white">{totals.totalWeightG}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Add Presets (1-Click) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>กดเพิ่มวัตถุดิบ/เครื่องเคียงยอดนิยมอย่างรวดเร็ว (Quick Add):</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_INGREDIENT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddQuickPreset(preset)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-slate-400">({preset.kcal} kcal)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>รายการวัตถุดิบในจานนี้ ({ingredients.length} รายการ)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 border border-emerald-200/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'ซ่อนฟอร์มเพิ่ม' : 'กำหนดวัตถุดิบเอง'}</span>
              </button>
            </div>

            {/* Custom Add Form Drawer */}
            {showAddForm && (
              <form
                onSubmit={handleAddCustomIngredient}
                className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3 animate-in fade-in duration-150"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ชื่อวัตถุดิบ/ชิ้นส่วน
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="เช่น อกไก่ฉีก, ผักกาดขาว, น้ำมันรำข้าว"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">หมวดหมู่อาหาร</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      <option value="carb">🍚 ข้าว / แป้ง</option>
                      <option value="protein">🍗 เนื้อสัตว์ / โปรตีน</option>
                      <option value="vegetable">🥦 ผัก / ใยอาหาร</option>
                      <option value="fruit">🍎 ผลไม้</option>
                      <option value="fat">🧈 ไขมัน / น้ำมัน</option>
                      <option value="condiment">🧂 เครื่องปรุงรส</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">น้ำหนัก (g)</label>
                    <input
                      type="number"
                      value={customWeightG}
                      onChange={(e) => setCustomWeightG(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">แคลอรี (kcal)</label>
                    <input
                      type="number"
                      value={customKcal}
                      onChange={(e) => setCustomKcal(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">คาร์บ (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">โปรตีน (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">ไขมัน (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFat}
                      onChange={(e) => setCustomFat(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-amber-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    + บันทึกเพิ่มวัตถุดิบนี้
                  </button>
                </div>
              </form>
            )}

            {/* List of Ingredients */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
              {ingredients.map((ing) => {
                const ingWeight = ing.weightGrams || Math.round(ing.density.kcalPer100g > 0 ? (ing.ratioPercent || 50) : 50);
                const factor = ingWeight / 100;
                const calcKcal = Math.round((ing.density.kcalPer100g || 0) * factor);
                const calcCarbs = parseFloat(((ing.density.carbsPer100g || 0) * factor).toFixed(1));
                const calcProtein = parseFloat(((ing.density.proteinPer100g || 0) * factor).toFixed(1));
                const calcFat = parseFloat(((ing.density.fatPer100g || 0) * factor).toFixed(1));

                return (
                  <div
                    key={ing.id}
                    className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                      ing.isSelected === false ? 'bg-slate-50/80 opacity-50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={ing.isSelected !== false}
                        onChange={() => handleToggleSelect(ing.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{ing.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {ing.category === 'carb'
                              ? 'ข้าว/แป้ง'
                              : ing.category === 'protein'
                              ? 'โปรตีน'
                              : ing.category === 'vegetable'
                              ? 'ผัก'
                              : ing.category === 'fruit'
                              ? 'ผลไม้'
                              : ing.category === 'fat'
                              ? 'ไขมัน'
                              : 'เครื่องปรุง'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>
                            แคลอรี: <strong className="text-slate-700">{calcKcal} kcal</strong>
                          </span>
                          <span>
                            คาร์บ: <strong className="text-slate-700">{calcCarbs}g</strong>
                          </span>
                          <span>
                            โปรตีน: <strong className="text-slate-700">{calcProtein}g</strong>
                          </span>
                          <span>
                            ไขมัน: <strong className="text-slate-700">{calcFat}g</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-slate-500 font-medium">น้ำหนัก:</label>
                        <input
                          type="number"
                          value={ingWeight}
                          onChange={(e) => handleUpdateWeight(ing.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-400">g</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient(ing.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบวัตถุดิบนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dish Preparation Notes / Customization */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              หมายเหตุการปรุง / รายละเอียดพิเศษ (Preparation Notes)
            </label>
            <textarea
              id="edit-dish-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ไม่ใส่น้ำตาล, ใช้น้ำมันมะกอก 1 ช้อนชา, ซับน้ำมันจากไข่ดาว, ทานคู่กับผักต้ม 1 ถ้วย, ลดเค็ม..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              soundFx.playClickBeep();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-xs transition-all"
          >
            ยกเลิก
          </button>

          <button
            id="save-menu-details-btn"
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกรายละเอียดเมนู</span>
          </button>
        </div>
      </div>
    </div>
  );
};
