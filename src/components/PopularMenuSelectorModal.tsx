import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Flame,
  Wheat,
  Fish,
  Leaf,
  Apple,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Utensils,
  Droplets,
  Tag,
  Filter,
  Plus,
  Check,
  CheckSquare,
} from 'lucide-react';
import { DishPreset, PresetCategoryType, MealDishItem } from '../types';
import { POPULAR_DISH_PRESETS } from '../data/dishPresets';
import { RAW_POPULAR_MENU_LIST, RawMenuItem } from '../data/popularMenuData';
import { soundFx } from '../utils/audio';

interface PopularMenuSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMenu?: (preset: DishPreset, rawItem?: RawMenuItem) => void;
  onSelectRawMenu?: (rawItem: RawMenuItem) => void;
  onSelectPresetMenu?: (preset: DishPreset) => void;
  onAddDish?: (dish: MealDishItem) => void;
  onAddMultipleDishes?: (dishes: MealDishItem[]) => void;
  currentSelectedDishName?: string;
  selectedDishNames?: string[];
}

export const PopularMenuSelectorModal: React.FC<PopularMenuSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMenu,
  onSelectRawMenu,
  onSelectPresetMenu,
  onAddDish,
  onAddMultipleDishes,
  currentSelectedDishName,
  selectedDishNames = [],
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<PresetCategoryType | 'all'>('all');
  const [suitabilityFilter, setSuitabilityFilter] = useState<'all' | 'good' | 'moderate' | 'caution'>('all');

  // Multi-selection state inside modal
  const [selectedItemsMap, setSelectedItemsMap] = useState<{ [id: number]: { item: RawMenuItem; qty: number } }>({});
  const [recentToastMessage, setRecentToastMessage] = useState<string | null>(null);

  const categoryStats = useMemo(() => {
    return {
      all: RAW_POPULAR_MENU_LIST.length,
      savory: RAW_POPULAR_MENU_LIST.filter((m) => m.categoryType === 'savory').length,
      dessert: RAW_POPULAR_MENU_LIST.filter((m) => m.categoryType === 'dessert').length,
      snack: RAW_POPULAR_MENU_LIST.filter((m) => m.categoryType === 'snack').length,
      fruit: RAW_POPULAR_MENU_LIST.filter((m) => m.categoryType === 'fruit').length,
      beverage: RAW_POPULAR_MENU_LIST.filter((m) => m.categoryType === 'beverage').length,
    };
  }, []);

  const filteredMenuItems = useMemo(() => {
    let list = RAW_POPULAR_MENU_LIST;

    if (activeCategory !== 'all') {
      list = list.filter((item) => item.categoryType === activeCategory);
    }

    if (suitabilityFilter !== 'all') {
      list = list.filter((item) => item.diabetesSuitability === suitabilityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.categoryThai.toLowerCase().includes(q) ||
          item.servingDesc.toLowerCase().includes(q) ||
          item.healthNote.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, suitabilityFilter, searchQuery]);

  if (!isOpen) return null;

  const showFeedbackToast = (msg: string) => {
    setRecentToastMessage(msg);
    setTimeout(() => {
      setRecentToastMessage(null);
    }, 2800);
  };

  const convertRawToDish = (rawItem: RawMenuItem, qty: number = 1): MealDishItem => {
    return {
      id: `dish_${rawItem.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: rawItem.name,
      categoryType: rawItem.categoryType,
      categoryThai: rawItem.categoryThai,
      servingQty: qty,
      servingDesc: rawItem.servingDesc,
      baseWeightG: rawItem.defaultWeightG,
      kcal: Math.round(rawItem.kcal * qty),
      carbsG: Math.round(rawItem.carbsG * qty),
      sugarG: parseFloat((rawItem.sugarG * qty).toFixed(1)),
      proteinG: Math.round(rawItem.proteinG * qty),
      fatG: Math.round(rawItem.fatG * qty),
      sodiumMg: Math.round(rawItem.sodiumMg * qty),
      fiberG: Math.round(rawItem.fiberG * qty),
      gi: rawItem.gi,
      healthNote: rawItem.healthNote,
      diabetesSuitability: rawItem.diabetesSuitability,
      ingredients: [
        {
          id: `ing_${rawItem.id}_main`,
          name: rawItem.categoryType === 'fruit' ? rawItem.name : `${rawItem.name} (สัดส่วนหลัก)`,
          category: rawItem.categoryType === 'fruit' ? 'fruit' : 'carb',
          ratioPercent: 100,
          weightGrams: Math.round((rawItem.defaultWeightG || 100) * qty),
          density: {
            kcalPer100g: Math.round((rawItem.kcal / (rawItem.defaultWeightG || 100)) * 100),
            carbsPer100g: parseFloat(((rawItem.carbsG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
            sugarPer100g: parseFloat(((rawItem.sugarG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
            proteinPer100g: parseFloat(((rawItem.proteinG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
            fatPer100g: parseFloat(((rawItem.fatG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
            fiberPer100g: parseFloat(((rawItem.fiberG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
            sodiumPer100g: Math.round((rawItem.sodiumMg / (rawItem.defaultWeightG || 100)) * 100),
            glycemicIndex: rawItem.gi,
          },
          gi: rawItem.gi,
          isSelected: true,
        },
      ],
    };
  };

  const handleSelectOne = (rawItem: RawMenuItem) => {
    soundFx.playSuccessChime();
    showFeedbackToast(`✅ เลือก "${rawItem.name}" (${rawItem.kcal} kcal) แล้ว`);

    // Update local state map
    setSelectedItemsMap((prev) => {
      const currentQty = prev[rawItem.id]?.qty || 0;
      return {
        ...prev,
        [rawItem.id]: { item: rawItem, qty: currentQty + 1 },
      };
    });

    // 1. If onAddDish exists, add it to the multi-dish meal list
    if (onAddDish) {
      const dish = convertRawToDish(rawItem, 1);
      onAddDish(dish);
    }

    // 2. If onSelectRawMenu exists
    if (onSelectRawMenu) {
      onSelectRawMenu(rawItem);
    }

    // 3. If onSelectMenu exists (DishPreset + RawItem)
    if (onSelectMenu) {
      const preset: DishPreset = POPULAR_DISH_PRESETS.find((p) => p.id === `dish_preset_${rawItem.id}`) || {
        id: `dish_preset_${rawItem.id}`,
        name: rawItem.name,
        categoryType: rawItem.categoryType,
        categoryThai: rawItem.categoryThai,
        defaultTotalWeightG: rawItem.defaultWeightG,
        description: `${rawItem.servingDesc} — ≈ ${rawItem.kcal} kcal`,
        healthNote: rawItem.healthNote,
        diabetesSuitability: rawItem.diabetesSuitability,
        ingredients: [
          {
            id: `ing_${rawItem.id}_main`,
            name: rawItem.name,
            category: rawItem.categoryType === 'fruit' ? 'fruit' : 'carb',
            ratioPercent: 100,
            density: {
              kcalPer100g: Math.round((rawItem.kcal / (rawItem.defaultWeightG || 100)) * 100),
              carbsPer100g: parseFloat(((rawItem.carbsG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
              sugarPer100g: parseFloat(((rawItem.sugarG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
              proteinPer100g: parseFloat(((rawItem.proteinG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
              fatPer100g: parseFloat(((rawItem.fatG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
              fiberPer100g: parseFloat(((rawItem.fiberG / (rawItem.defaultWeightG || 100)) * 100).toFixed(1)),
              sodiumPer100g: Math.round((rawItem.sodiumMg / (rawItem.defaultWeightG || 100)) * 100),
              glycemicIndex: rawItem.gi,
            },
            gi: rawItem.gi,
            isSelected: true,
          },
        ],
      };
      onSelectMenu(preset, rawItem);
    }
  };

  const handleApplyAllSelectedAndClose = () => {
    soundFx.playSuccessChime();
    const items = Object.values(selectedItemsMap);
    if (items.length > 0 && onAddMultipleDishes) {
      const dishes = items.map(({ item, qty }) => convertRawToDish(item, qty));
      onAddMultipleDishes(dishes);
    }
    onClose();
  };

  // Selected totals in modal
  const selectedEntries = Object.values(selectedItemsMap) as Array<{ item: RawMenuItem; qty: number }>;
  const totalSelectedKcal = selectedEntries.reduce(
    (sum, entry) => sum + entry.item.kcal * entry.qty,
    0
  );
  const totalSelectedCount = selectedEntries.reduce(
    (sum, entry) => sum + entry.qty,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="popular-menu-selector-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative"
      >
        {/* Toast Notification Alert Banner */}
        {recentToastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400/40 animate-in slide-in-from-top-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{recentToastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                <span>คลังเมนูอาหารยอดนิยม</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  {RAW_POPULAR_MENU_LIST.length} เมนู
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกเลือกเมนูเพื่อเพิ่มเข้ามื้ออาหารได้ไม่จำกัด คำนวณแคลอรีและสารอาหารทันที
              </p>
            </div>
          </div>
          <button
            id="close-popular-menu-modal-btn"
            onClick={() => {
              soundFx.playClickBeep();
              onClose();
            }}
            className="w-10 h-10 rounded-2xl bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-colors shadow-2xs shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-popular-menu-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเมนู เช่น ข้าวมันไก่, ข้าวผัด, ผัดกะเพรา, บัวลอย, ฝรั่ง..."
                className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suitability filter */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setSuitabilityFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  suitabilityFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ทุกระดับ
              </button>
              <button
                onClick={() => setSuitabilityFilter('good')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  suitabilityFilter === 'good'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ปลอดภัยดี</span>
              </button>
              <button
                onClick={() => setSuitabilityFilter('caution')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  suitabilityFilter === 'caution'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ควรระวัง</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>ทั้งหมด ({categoryStats.all})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveCategory('savory');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeCategory === 'savory'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🍱 ของคาว ({categoryStats.savory})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveCategory('dessert');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeCategory === 'dessert'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🍰 ของหวาน ({categoryStats.dessert})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveCategory('snack');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeCategory === 'snack'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🥜 อาหารว่าง ({categoryStats.snack})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveCategory('fruit');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeCategory === 'fruit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🍉 ผลไม้ ({categoryStats.fruit})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveCategory('beverage');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeCategory === 'beverage'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🥤 เครื่องดื่ม ({categoryStats.beverage})</span>
            </button>
          </div>
        </div>

        {/* Menu Items Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-h-[58vh] space-y-3">
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-400">
              <Utensils className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-600 text-base">ไม่พบเมนูที่ตรงกับคำค้นหา "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMenuItems.map((item) => {
                const isSelectedInModal = Boolean(selectedItemsMap[item.id]);
                const selectedQtyInModal = selectedItemsMap[item.id]?.qty || 0;
                const isAlreadyInMeal =
                  currentSelectedDishName === item.name || selectedDishNames.includes(item.name);
                const suitability = item.diabetesSuitability;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between group relative ${
                      isSelectedInModal || isAlreadyInMeal
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                            {item.categoryThai}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                              suitability === 'good'
                                ? 'bg-emerald-100 text-emerald-800'
                                : suitability === 'moderate'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {suitability === 'good' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> ปลอดภัย
                              </>
                            ) : suitability === 'moderate' ? (
                              <>ปานกลาง</>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" /> ระวัง
                              </>
                            )}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.gi === 'low'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : item.gi === 'medium'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            GI: {item.gi?.toUpperCase() || 'MED'}
                          </span>

                          {(isSelectedInModal || isAlreadyInMeal) && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-0.5 shadow-2xs animate-in zoom-in-75 duration-150">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>เลือกแล้ว {selectedQtyInModal > 1 ? `(${selectedQtyInModal} จาน)` : ''}</span>
                            </span>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-emerald-700 flex items-center gap-0.5 justify-end">
                            <Flame className="w-4 h-4 text-orange-500" />
                            {item.kcal} <span className="text-xs font-normal text-slate-500">kcal</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block font-medium">
                            {item.servingDesc}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition-colors">
                        {item.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.healthNote}</p>
                    </div>

                    {/* Macro Nutrition Row & Action Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span>
                          คาร์บ: <strong className="text-slate-800">{item.carbsG}g</strong>
                          {item.sugarG > 0 && <span className="text-slate-400"> (นต. {item.sugarG}g)</span>}
                        </span>
                        <span>
                          โปรตีน: <strong className="text-slate-800">{item.proteinG}g</strong>
                        </span>
                        <span>
                          ไขมัน: <strong className="text-slate-800">{item.fatG}g</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectOne(item)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shrink-0 active:scale-95 ${
                          isSelectedInModal || isAlreadyInMeal
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/80 hover:border-emerald-600'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isSelectedInModal || isAlreadyInMeal ? '+ เพิ่มอีก 1' : 'เลือกเมนูนี้'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with summary of multi-selected items */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">
              แสดง <strong>{filteredMenuItems.length}</strong> จาก {RAW_POPULAR_MENU_LIST.length} เมนู
            </span>
            {totalSelectedCount > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black border border-emerald-200">
                เลือกแล้ว {totalSelectedCount} รายการ (+{totalSelectedKcal} kcal)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                soundFx.playClickBeep();
                onClose();
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
            >
              ปิด
            </button>

            {totalSelectedCount > 0 && (
              <button
                onClick={handleApplyAllSelectedAndClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>เสร็จสิ้นการเลือก ({totalSelectedCount} เมนู)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
