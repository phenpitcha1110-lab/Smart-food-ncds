import React from 'react';
import {
  Flame,
  Wheat,
  Candy,
  Activity,
  Plus,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Droplet,
  ChevronRight,
  TrendingDown,
  Scale,
  Calendar,
  Camera,
  Utensils,
} from 'lucide-react';
import { UserProfile, MealLog } from '../types';
import { calculateBmi } from '../utils/bmiHelper';

interface DashboardViewProps {
  userProfile: UserProfile;
  mealLogs: MealLog[];
  onOpenMealBox: () => void;
  onOpenPhotoScanner?: () => void;
  onOpenProfile: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  mealLogs,
  onOpenMealBox,
  onOpenPhotoScanner,
  onOpenProfile,
}) => {
  // Aggregate daily totals from logs
  const totalDailyKcal = mealLogs.reduce((sum, log) => sum + log.totalKcal, 0);
  const totalDailyCarbs = mealLogs.reduce((sum, log) => sum + log.totalCarbsG, 0);
  const totalDailySugar = mealLogs.reduce((sum, log) => sum + log.totalSugarG, 0);
  const totalDailyFiber = mealLogs.reduce((sum, log) => sum + log.totalFiberG, 0);

  const targetKcal = userProfile.targetDailyKcal || 1600;
  const targetCarbsDaily = (userProfile.targetCarbsPerMealG || 30) * 3;
  const targetSugarDaily = (userProfile.targetSugarPerMealG || 10) * 3;

  const carbPercent = Math.min(100, Math.round((totalDailyCarbs / targetCarbsDaily) * 100));
  const kcalPercent = Math.min(100, Math.round((totalDailyKcal / targetKcal) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected Health Telemetry • NCD Diabetes Care</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            สวัสดีคุณ {userProfile.nickname || 'ผู้รับบริการ'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เป้าหมายโภชนาการประจำวัน: พลังงาน {targetKcal} kcal • คาร์โบไฮเดรตไม่เกิน {targetCarbsDaily}g • น้ำตาลไม่เกิน {targetSugarDaily}g
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          {onOpenPhotoScanner && (
            <button
              onClick={onOpenPhotoScanner}
              className="flex-1 md:flex-none px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-blue-200" />
              <span>AI ถ่ายรูปวิเคราะห์อาหาร</span>
            </button>
          )}

          <button
            onClick={onOpenMealBox}
            className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
          >
            <Utensils className="w-4 h-4" />
            <span>ประเมินแคลอรีมื้ออาหาร</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Calories Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Flame className="w-4 h-4 text-orange-500" />
                พลังงานรวมวันนี้
              </span>
              <span>เป้า {targetKcal} kcal</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{totalDailyKcal}</span>
              <span className="text-xs text-slate-400 font-medium">/ {targetKcal} kcal</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-5 overflow-hidden">
            <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${kcalPercent}%` }} />
          </div>
        </div>

        {/* Carbs Card (Crucial for Diabetes) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Wheat className="w-4 h-4 text-blue-500" />
                คาร์โบไฮเดรตรวม
              </span>
              <span>เป้า ≤ {targetCarbsDaily}g</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span
                className={`text-3xl font-black tracking-tight ${
                  totalDailyCarbs > targetCarbsDaily ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {totalDailyCarbs.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {targetCarbsDaily}g</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-5 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                totalDailyCarbs > targetCarbsDaily ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${carbPercent}%` }}
            />
          </div>
        </div>

        {/* Sugar Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-rose-600">
                <Candy className="w-4 h-4 text-rose-500" />
                น้ำตาลรวม
              </span>
              <span>เป้า ≤ {targetSugarDaily}g</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {totalDailySugar.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {targetSugarDaily}g</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-5 overflow-hidden">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalDailySugar / targetSugarDaily) * 100)}%` }}
            />
          </div>
        </div>

        {/* Dietary Fiber Card (Target > 20g/day) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Droplet className="w-4 h-4 text-emerald-500" />
                ใยอาหาร (ไฟเบอร์)
              </span>
              <span>เป้า ≥ 20g</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">
                {totalDailyFiber.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">g (เกณฑ์ดี)</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalDailyFiber / 20) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Split: Meal Logs & Clinical Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Recent Meal Logs from the Smart Box (Spans 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Daily Telemetry Log
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-0.5">
                  บันทึกมื้ออาหารวันนี้ (Daily Meal Logs)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ข้อมูลที่ประเมินจากระบบประเมินแคลอรีและการคำนวณสารอาหาร
                </p>
              </div>

              <button
                onClick={onOpenMealBox}
                className="text-xs font-bold text-slate-800 hover:text-emerald-600 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ประเมินมื้อใหม่</span>
              </button>
            </div>

            {mealLogs.length > 0 ? (
              <div className="space-y-3">
                {mealLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-emerald-500 hover:bg-white transition-all shadow-2xs group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            log.status === 'optimal'
                              ? 'bg-emerald-500'
                              : log.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                          {log.mealName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">({log.timestamp})</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-700">{log.totalKcal} kcal</span>
                        <span className="font-bold text-blue-600">คาร์บ {log.totalCarbsG}g</span>
                        <span className="font-bold text-rose-600">น้ำตาล {log.totalSugarG}g</span>
                      </div>
                    </div>

                    {/* Compartment breakdown chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {log.compartments.map((comp, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-white text-[11px] text-slate-600 border border-slate-200 font-semibold shadow-2xs"
                        >
                          {comp.foodName} ({comp.weightG}g)
                        </span>
                      ))}
                    </div>

                    {log.clinicalFeedback && (
                      <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-200/60 font-medium">
                        💡 {log.clinicalFeedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">ยังไม่มีรายการบันทึกอาหารสำหรับวันนี้</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  เริ่มเลือกเมนูอาหารหรือถ่ายภาพ เพื่อประเมินแคลอรี สารอาหาร และบันทึกมื้ออาหารแรกของคุณ
                </p>
                <button
                  onClick={onOpenMealBox}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เริ่มประเมินแคลอรีตอนนี้</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Health Profile Card & Diabetes Tips (Spans 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Health Profile Widget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-base text-slate-900">โปรไฟล์และการควบคุมโรค</h3>
              <button onClick={onOpenProfile} className="text-xs font-bold text-emerald-600 hover:underline">
                แก้ไข
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">ภาวะสุขภาพ:</span>
                <span className="font-bold text-slate-900">
                  {(() => {
                    switch (userProfile.condition) {
                      case 'general':
                        return 'คนทั่วไป (ไม่มีโรคประจำตัว)';
                      case 'type1_diabetes':
                        return 'เบาหวานชนิดที่ 1';
                      case 'type2_diabetes':
                      case 'diabetes':
                        return 'เบาหวานชนิดที่ 2';
                      case 'gestational_diabetes':
                        return 'เบาหวานขณะตั้งครรภ์';
                      case 'pre_diabetes':
                        return 'ภาวะก่อนเบาหวาน';
                      case 'hypertension':
                      case 'hypertension_ncd':
                        return 'ความดันโลหิตสูง';
                      case 'hyperlipidemia':
                        return 'ไขมันในเลือดสูง';
                      case 'other':
                      default:
                        return 'อื่นๆ';
                    }
                  })()}
                </span>
              </div>
              {userProfile.weightKg && userProfile.heightCm ? (
                (() => {
                  const bmiRes = calculateBmi(userProfile.weightKg, userProfile.heightCm);
                  return (
                    <div className="flex justify-between py-2 border-b border-slate-100 items-center">
                      <span className="text-slate-500 font-medium">ดัชนีมวลกาย (BMI):</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 mr-1.5">{bmiRes.bmi}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${bmiRes.badgeColor}`}>
                          {bmiRes.category}
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : null}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">คาร์โบไฮเดรตต่อมื้อ:</span>
                <span className="font-bold text-blue-600">≤ {userProfile.targetCarbsPerMealG || 30} กรัม</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">น้ำตาลต่อมื้อ:</span>
                <span className="font-bold text-rose-600">≤ {userProfile.targetSugarPerMealG || 10} กรัม</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">โซเดียมต่อมื้อ:</span>
                <span className="font-bold text-slate-700">≤ {userProfile.targetSodiumPerMealMg || 600} มิลลิกรัม</span>
              </div>
            </div>
          </div>

          {/* Clinical Tip Widget (Hero Dark Slate style) */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>หลักการจัดจานอาหาร 2:1:1</span>
            </div>
            <h4 className="font-bold text-base text-white">
              หัวใจของการคุมระดับน้ำตาลในเลือด
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
              การแบ่งช่องกล่องข้าว 4 ช่องช่วยให้ผู้ป่วยเห็นภาพชัดเจน: ผัก 2 ส่วน + ข้าวแป้งไม่ขัดสี 1 ส่วน + เนื้อสัตว์ไม่ติดมัน 1 ส่วน ช่วยลดระดับน้ำตาลหลังอาหารได้อย่างมีประสิทธิภาพ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
