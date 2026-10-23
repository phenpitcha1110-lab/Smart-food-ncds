import React, { useState, useEffect } from 'react';
import { UserProfile, DiabetesCondition } from '../types';
import { Heart, Scale, Activity, Save, CheckCircle2, User, Sparkles, Target, RotateCcw, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { calculateBmi, calculateBmr } from '../utils/bmiHelper';

interface ProfileRegistrationViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetProfile: () => void;
  onResetAllData?: () => void;
  onClearLogsOnly?: () => void;
}

export const ProfileRegistrationView: React.FC<ProfileRegistrationViewProps> = ({
  userProfile,
  onUpdateProfile,
  onResetProfile,
  onResetAllData,
  onClearLogsOnly,
}) => {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showConfirmResetAll, setShowConfirmResetAll] = useState<boolean>(false);
  const [showConfirmClearLogs, setShowConfirmClearLogs] = useState<boolean>(false);

  // Sync formData if userProfile changes
  useEffect(() => {
    setFormData(userProfile);
  }, [userProfile]);

  // Dynamic BMI Calculation using exact 5-level Asian criteria
  const bmiEval =
    formData.weightKg && formData.heightCm && formData.weightKg > 0 && formData.heightCm > 0
      ? calculateBmi(formData.weightKg, formData.heightCm)
      : null;

  // Dynamic BMR Calculation (Mifflin-St Jeor)
  const bmrEval =
    formData.weightKg && formData.heightCm && formData.weightKg > 0 && formData.heightCm > 0
      ? calculateBmr(
          formData.gender,
          formData.age || 40,
          formData.weightKg,
          formData.heightCm
        )
      : null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccessChime();

    // Automatically update targetDailyKcal from calculated BMR if available
    const updated = {
      ...formData,
      targetDailyKcal: bmrEval ? bmrEval.bmr : (formData.targetDailyKcal || 1600),
    };
    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-6 py-4 rounded-3xl flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">บันทึกข้อมูลผู้ใช้งานเรียบร้อยแล้ว</p>
            <p className="text-xs text-emerald-700">
              ระบบคำนวณ BMI และพลังงานพื้นฐาน (BMR) ให้คุณอัตโนมัติ
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ช่องรีเซ็ตข้อมูลผู้ใช้งาน เด่นชัดตรงโปรไฟล์ (Reset Section) ตามคำสั่งผู้ใช้ */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 rounded-3xl p-5 sm:p-7 border-2 border-rose-300 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black tracking-wider uppercase shadow-2xs">
                  🔴 ช่องรีเซ็ตข้อมูล (Reset Control)
                </span>
                <span className="text-xs text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded-md">
                  เด่นชัดตรงโปรไฟล์
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                รีเซ็ตข้อมูลผู้ใช้งาน & เริ่มต้นใหม่
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                ต้องการเปลี่ยนผู้รับบริการ หรือต้องการเริ่มกรอกข้อมูลสุขภาพใหม่ สามารถกดปุ่มรีเซ็ตเพื่อย้อนกลับไปหน้าแรกสุด (สื่อความรู้โรค → กรอกข้อมูลผู้ใช้งาน)
              </p>
            </div>
          </div>

          {/* Action Buttons in Reset Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFx.playClickBeep();
                onResetProfile();
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:shadow-md"
              title="รีเซ็ตและเปิดหน้าแรกสุด: สื่อความรู้โรค และกรอกข้อมูลผู้ใช้งาน"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>🔄 รีเซ็ตและเริ่มกรอกข้อมูลใหม่</span>
            </button>

            {onClearLogsOnly && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickBeep();
                  setShowConfirmClearLogs(true);
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                title="ล้างประวัติการบันทึกอาหาร 14 วันทั้งหมดเพื่อเริ่มรอบใหม่"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>ล้างประวัติอาหาร 14 วัน</span>
              </button>
            )}

            {onResetAllData && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickBeep();
                  setShowConfirmResetAll(true);
                }}
                className="w-full sm:w-auto px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title="ล้างข้อมูลทั้งหมด คืนค่าเริ่มต้นโรงงาน"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>คืนค่าเริ่มต้น</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clear Logs */}
      {showConfirmClearLogs && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              ยืนยันการล้างประวัติอาหาร 14 วัน?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-5">
              ประวัติการบันทึกมื้ออาหาร 14 วันทั้งหมดจะถูกลบ เพื่อให้คุณเริ่มต้นบันทึกรอบใหม่ได้ทันที
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmClearLogs(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearLogsOnly) onClearLogsOnly();
                  setShowConfirmClearLogs(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                ยืนยันล้างประวัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset All Data */}
      {showConfirmResetAll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              ยืนยันการรีเซ็ตข้อมูลทั้งหมด?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-5">
              ระบบจะลบข้อมูลโปรไฟล์และประวัติอาหารทั้งหมด พร้อมเปิดหน้าแรกสุดเพื่อให้เริ่มใหม่
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmResetAll(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetAllData) onResetAllData();
                  setShowConfirmResetAll(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                ยืนยันรีเซ็ตทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              User Profile & Health Data
            </span>
            <h1 className="font-black text-2xl text-slate-900 tracking-tight">ข้อมูลผู้ใช้งาน & สุขภาพ</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูล 4 อย่าง (เพศ, อายุ, น้ำหนัก, ส่วนสูง) เพื่อการคำนวณ BMI และพลังงานพื้นฐาน (BMR) อัตโนมัติ
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* ชื่อเรียก */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              ชื่อเล่น / ชื่อเรียกของคุณ
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="ระบุชื่อเล่นของคุณ"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
              required
            />
          </div>

          {/* 1. เพศ & 2. อายุ (ปี) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                1. เพศ
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClickBeep();
                    setFormData({ ...formData, gender: 'female' });
                  }}
                  className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.gender === 'female'
                      ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs ring-2 ring-rose-400/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">👩</span>
                  <span>หญิง</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClickBeep();
                    setFormData({ ...formData, gender: 'male' });
                  }}
                  className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.gender === 'male'
                      ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-2xs ring-2 ring-sky-400/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">👨</span>
                  <span>ชาย</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                2. อายุ (ปี)
              </label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                placeholder="ระบุอายุ"
                min="1"
                max="120"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* 3. น้ำหนัก kg & 4. ส่วนสูง cm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                3. น้ำหนัก (กิโลกรัม)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weightKg || ''}
                onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) || null })}
                placeholder="เช่น 60.0"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                4. ส่วนสูง (เซนติเมตร)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.heightCm || ''}
                onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) || null })}
                placeholder="เช่น 165"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* โรคประจำตัว */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              โรคประจำตัว / ภาวะสุขภาพ
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value as DiabetesCondition })}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
            >
              <option value="general">คนทั่วไป (ไม่มีโรคประจำตัว)</option>
              <option value="type1_diabetes">เบาหวานชนิดที่ 1</option>
              <option value="type2_diabetes">เบาหวานชนิดที่ 2</option>
              <option value="hypertension">ความดันโลหิตสูง</option>
              <option value="hyperlipidemia">ไขมันในเลือดสูง</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>

          {/* สรุปผลการคำนวณอัตโนมัติ: BMI & BMR */}
          <div className="p-5 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>ผลการคำนวณสุขภาพอัตโนมัติ (ผู้ใช้ ไม่ต้องกรอกเอง)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BMI Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>ดัชนีมวลกาย (BMI)</span>
                  <span className="font-mono text-[10px]">น้ำหนัก ÷ ส่วนสูง²</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {bmiEval ? bmiEval.bmi : '-'}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">kg/m²</span>
                </div>
                {bmiEval && (
                  <div className="mt-2">
                    <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${bmiEval.badgeColor}`}>
                      {bmiEval.category}
                    </span>
                  </div>
                )}
              </div>

              {/* BMR Card */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>🎯 พลังงานพื้นฐานของร่างกาย (BMR)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    อัตโนมัติ
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {bmrEval ? bmrEval.bmr.toLocaleString() : '-'}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">kcal/วัน</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  โดยระบบคำนวณให้อัตโนมัติ ผู้ใช้ ไม่ต้องกรอก BMR เอง
                </p>
                {bmrEval && (
                  <div className="mt-2 text-xs text-emerald-700 font-bold">
                    เฉลี่ยต่อมื้อ: ~{bmrEval.perMealKcal} kcal/มื้อ (ช่วงแนะนำ {bmrEval.minMealKcal} - {bmrEval.maxMealKcal} kcal)
                  </div>
                )}
              </div>
            </div>

            {bmrEval && (
              <div className="p-3 rounded-2xl bg-emerald-100/50 border border-emerald-200/60 text-[11px] text-slate-700">
                <span className="text-emerald-950 font-bold block mb-0.5">
                  สูตรคำนวณ {formData.gender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}:
                </span>
                <span className="font-mono text-[10px]">
                  {formData.gender === 'female'
                    ? 'BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) − 161'
                    : 'BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) + 5'}
                  {' '}= {bmrEval.formulaDetails} = {bmrEval.bmr.toLocaleString()} kcal/วัน
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClickBeep();
                onResetProfile();
              }}
              className="px-5 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              title="รีเซ็ตและเปิดหน้าต่างเริ่มต้น (สื่อความรู้โรค → กรอกข้อมูล)"
            >
              <RotateCcw className="w-4 h-4" />
              <span>รีเซ็ตข้อมูลผู้ใช้งาน</span>
            </button>

            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลผู้ใช้งาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
