import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  CupSoda,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Droplets,
  HeartPulse,
  Info,
  Check,
} from 'lucide-react';
import { BEVERAGE_MASTER_LIST, BeverageItem } from '../data/beverageData';
import { soundFx } from '../utils/audio';

interface BeverageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBeverage?: (beverage: BeverageItem) => void;
  onToggleBeverage?: (beverage: BeverageItem) => void;
  selectedBeverages?: BeverageItem[];
  selectedBeverageNames?: string[];
}

export const BeverageSelectorModal: React.FC<BeverageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectBeverage,
  onToggleBeverage,
  selectedBeverages = [],
  selectedBeverageNames = [],
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<
    'all' | 'water_soda' | 'herbal_sweet' | 'coffee_tea' | 'milk_cocoa' | 'juice_smoothie'
  >('all');
  const [suitabilityFilter, setSuitabilityFilter] = useState<'all' | 'good' | 'moderate' | 'caution'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute selected beverage names set for easy check
  const selectedNamesSet = useMemo(() => {
    const set = new Set<string>();
    selectedBeverages.forEach((b) => set.add(b.name.toLowerCase()));
    selectedBeverageNames.forEach((n) => set.add(n.toLowerCase()));
    return set;
  }, [selectedBeverages, selectedBeverageNames]);

  const selectedCount = selectedBeverages.length > 0 ? selectedBeverages.length : selectedBeverageNames.length;
  const totalKcal = selectedBeverages.reduce((sum, b) => sum + b.kcal, 0);
  const totalSugar = selectedBeverages.reduce((sum, b) => sum + b.sugarG, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleToggle = (bev: BeverageItem) => {
    soundFx.playSuccessChime();
    const isCurrentlySelected = selectedNamesSet.has(bev.name.toLowerCase());

    if (onToggleBeverage) {
      onToggleBeverage(bev);
    } else if (onSelectBeverage) {
      onSelectBeverage(bev);
    }

    if (isCurrentlySelected) {
      showToast(`ลบ "${bev.name}" ออกจากเครื่องดื่ม`);
    } else {
      showToast(`✅ เลือก "${bev.name}" (${bev.kcal} kcal) แล้ว`);
    }
  };

  const groupStats = useMemo(() => {
    return {
      all: BEVERAGE_MASTER_LIST.length,
      water_soda: BEVERAGE_MASTER_LIST.filter((b) => b.categoryGroup === 'water_soda').length,
      herbal_sweet: BEVERAGE_MASTER_LIST.filter((b) => b.categoryGroup === 'herbal_sweet').length,
      coffee_tea: BEVERAGE_MASTER_LIST.filter((b) => b.categoryGroup === 'coffee_tea').length,
      milk_cocoa: BEVERAGE_MASTER_LIST.filter((b) => b.categoryGroup === 'milk_cocoa').length,
      juice_smoothie: BEVERAGE_MASTER_LIST.filter((b) => b.categoryGroup === 'juice_smoothie').length,
    };
  }, []);

  const filteredBeverages = useMemo(() => {
    let list = BEVERAGE_MASTER_LIST;

    if (activeGroup !== 'all') {
      list = list.filter((item) => item.categoryGroup === activeGroup);
    }

    if (suitabilityFilter !== 'all') {
      list = list.filter((item) => item.diabetesSuitability === suitabilityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.nameEn.toLowerCase().includes(q) ||
          item.categoryGroupThai.toLowerCase().includes(q) ||
          item.healthNote.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeGroup, suitabilityFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="beverage-selector-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-cyan-50 to-emerald-50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
              <CupSoda className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span>เลือกเครื่องดื่มประจำมื้อ</span>
                <span className="text-xs bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full font-bold">
                  {BEVERAGE_MASTER_LIST.length} รายการ
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกเครื่องดื่มเพื่อประเมินแคลอรี น้ำตาล และความปลอดภัยสำหรับผู้ป่วยเบาหวานในมื้อนี้
              </p>
            </div>
          </div>
          <button
            id="close-beverage-modal-btn"
            onClick={() => {
              soundFx.playClickBeep();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 space-y-3.5">
          {/* Search bar & Suitability filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเครื่องดื่ม เช่น กาแฟดำ, ชานม, นมถั่วเหลือง, น้ำมะนาว, โกโก้..."
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suitability buttons */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs shrink-0">
              <button
                onClick={() => setSuitabilityFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  suitabilityFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ทุกระดับ
              </button>
              <button
                onClick={() => setSuitabilityFilter('good')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  suitabilityFilter === 'good'
                    ? 'bg-emerald-600 text-white shadow-sm'
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
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>น้ำตาลสูง/ควรระวัง</span>
              </button>
            </div>
          </div>

          {/* Group Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveGroup('all');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeGroup === 'all'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>ทั้งหมด ({groupStats.all})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveGroup('water_soda');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeGroup === 'water_soda'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>💧 น้ำเปล่า & โซดา ({groupStats.water_soda})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveGroup('coffee_tea');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeGroup === 'coffee_tea'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>☕ กาแฟ & ชา ({groupStats.coffee_tea})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveGroup('herbal_sweet');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeGroup === 'herbal_sweet'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🌿 น้ำหวาน & สมุนไพร ({groupStats.herbal_sweet})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveGroup('milk_cocoa');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeGroup === 'milk_cocoa'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🥛 นม & โกโก้ ({groupStats.milk_cocoa})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveGroup('juice_smoothie');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeGroup === 'juice_smoothie'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>🍹 น้ำผลไม้ & สมูทตี้ ({groupStats.juice_smoothie})</span>
            </button>
          </div>
        </div>

        {/* Floating Toast Notification inside modal */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-teal-400/40 animate-in slide-in-from-top-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Beverage Items Grid */}
        <div className="flex-1 overflow-y-auto p-5 max-h-[55vh] space-y-3">
          {filteredBeverages.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-400">
              <CupSoda className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-600 text-base">ไม่พบเครื่องดื่มที่ตรงกับคำค้นหา "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBeverages.map((bev) => {
                const isSelected = selectedNamesSet.has(bev.name.toLowerCase());

                return (
                  <div
                    key={bev.id}
                    onClick={() => handleToggle(bev)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between select-none ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/70 shadow-md ring-2 ring-teal-500/30'
                        : 'border-slate-200/90 bg-white hover:border-teal-300 hover:bg-slate-50/80 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top row: Name, volume, suitability badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-sm font-black transition-colors ${
                              isSelected ? 'text-teal-900' : 'text-slate-900 group-hover:text-teal-700'
                            }`}>
                              {bev.name}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({bev.nameEn})
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold animate-in zoom-in-75">
                                <Check className="w-3 h-3" />
                                <span>เลือกแล้ว</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                              <Droplets className="w-3 h-3 text-teal-600" />
                              {bev.servingDesc}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">{bev.categoryGroupThai}</span>
                          </div>
                        </div>

                        {/* Suitability badge */}
                        <div>
                          {bev.diabetesSuitability === 'good' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>ปลอดภัยดี</span>
                            </span>
                          ) : bev.diabetesSuitability === 'moderate' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <span>ปานกลาง</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>ควรระวัง</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nutrition Macro Chips */}
                      <div className="grid grid-cols-4 gap-1.5 my-3 bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">พลังงาน</div>
                          <div className="text-xs font-black text-amber-600">≈ {bev.kcal} kcal</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">คาร์โบไฮเดรต</div>
                          <div className="text-xs font-black text-slate-700">{bev.carbsG}g</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">น้ำตาล</div>
                          <div className={`text-xs font-black ${bev.sugarG > 15 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {bev.sugarG}g
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">โปรตีน</div>
                          <div className="text-xs font-black text-emerald-700">{bev.proteinG}g</div>
                        </div>
                      </div>

                      {/* Health Note */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-teal-50/30 p-2 rounded-lg border border-teal-100/50">
                        <span className="font-bold text-teal-800">คำแนะนำ: </span>
                        {bev.healthNote}
                      </p>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10.5px] text-slate-400">
                        ดัชนีน้ำตาล (GI): <strong className="text-slate-600 uppercase">{bev.gi}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(bev);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-teal-600 hover:bg-teal-700 text-white group-hover:scale-105'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>ยกเลิก</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>เลือกเครื่องดื่มนี้</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>คำนวณแคลอรีและน้ำตาลเข้าสู่สรุปมื้ออาหารและ AI ประเมินเบาหวานโดยอัตโนมัติ</span>
            {selectedCount > 0 && (
              <span className="font-black text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md">
                เลือกแล้ว {selectedCount} แก้ว/ขวด (≈ {totalKcal} kcal, น้ำตาล {totalSugar}g)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                soundFx.playClickBeep();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>เรียบร้อย ({selectedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
