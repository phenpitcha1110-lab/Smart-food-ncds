import React, { useState, useEffect } from 'react';
import { UserProfile, DiabetesCondition } from '../types';
import {
  calculateBmi,
  BMI_LEVELS_DEFINITION,
  BmiEvaluation,
  calculateBmr,
  BmrCalculationResult,
} from '../utils/bmiHelper';
import { DiseaseEducationModal } from './DiseaseEducationModal';
import {
  Scale,
  Sparkles,
  Heart,
  ArrowRight,
  User,
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface WelcomeGateModalProps {
  onComplete: (profile: Partial<UserProfile>) => void;
  initialProfile?: UserProfile;
}

export const WelcomeGateModal: React.FC<WelcomeGateModalProps> = ({ onComplete, initialProfile }) => {
  // Step 1: Input form | Step 2: BMI & BMR Announcement | Step 3: Proceeds into website
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Disease Knowledge Modal (Default true on initial view so user sees it before entering name, with close button)
  const [showEducationModal, setShowEducationModal] = useState<boolean>(true);

  // Form State - 4 health metrics + disease condition
  const [nickname, setNickname] = useState(initialProfile?.nickname || '');
  const [gender, setGender] = useState<'female' | 'male'>(
    initialProfile?.gender === 'male' ? 'male' : 'female'
  );
  const [age, setAge] = useState<string>(initialProfile?.age ? initialProfile.age.toString() : '');
  const [weightKg, setWeightKg] = useState<string>(initialProfile?.weightKg ? initialProfile.weightKg.toString() : '');
  const [heightCm, setHeightCm] = useState<string>(initialProfile?.heightCm ? initialProfile.heightCm.toString() : '');
  const [condition, setCondition] = useState<DiabetesCondition>(
    (initialProfile?.condition as DiabetesCondition) || 'type2_diabetes'
  );

  useEffect(() => {
    if (initialProfile?.nickname) {
      setNickname(initialProfile.nickname);
      setGender(initialProfile.gender === 'male' ? 'male' : 'female');
      if (initialProfile.age) setAge(initialProfile.age.toString());
      if (initialProfile.weightKg) setWeightKg(initialProfile.weightKg.toString());
      if (initialProfile.heightCm) setHeightCm(initialProfile.heightCm.toString());
      if (initialProfile.condition) setCondition(initialProfile.condition);
    }
  }, [initialProfile]);

  // Calculated BMI Evaluation & BMR on Step 2
  const [bmiResult, setBmiResult] = useState<BmiEvaluation | null>(null);
  const [bmrResult, setBmrResult] = useState<BmrCalculationResult | null>(null);

  // Handle Step 1 -> Step 2
  const handleProceedToAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !age.trim() || !weightKg.trim() || !heightCm.trim()) {
      return;
    }

    const w = parseFloat(weightKg) || 0;
    const h = parseFloat(heightCm) || 0;
    const a = parseInt(age) || 0;
    if (w <= 0 || h <= 0 || a <= 0) return;

    soundFx.playSuccessChime();
    const evaluation = calculateBmi(w, h);
    const bmr = calculateBmr(gender, a, w, h);
    setBmiResult(evaluation);
    setBmrResult(bmr);
    setCurrentStep(2);
  };

  // Handle Step 2 -> Step 3 (Website entry)
  const handleEnterWebsite = () => {
    soundFx.playSuccessChime();
    const w = parseFloat(weightKg) || 60;
    const h = parseFloat(heightCm) || 165;
    const a = parseInt(age) || 45;

    // Calculate final BMR
    const bmr = bmrResult || calculateBmr(gender, a, w, h);

    // Set smart default nutrient targets based on condition
    let targetCarbs = 30;
    let targetSugar = 10;
    if (condition === 'general') {
      targetCarbs = 45;
      targetSugar = 15;
    } else if (condition === 'type1_diabetes' || condition === 'type2_diabetes' || condition === 'diabetes') {
      targetCarbs = 25;
      targetSugar = 5;
    } else if (condition === 'hypertension') {
      targetCarbs = 35;
      targetSugar = 10;
    } else if (condition === 'hyperlipidemia') {
      targetCarbs = 30;
      targetSugar = 8;
    }

    onComplete({
      nickname: nickname.trim(),
      gender,
      age: a,
      weightKg: w,
      heightCm: h,
      condition,
      targetDailyKcal: bmr.bmr,
      targetCarbsPerMealG: targetCarbs,
      targetSugarPerMealG: targetSugar,
      targetSodiumPerMealMg: condition === 'hypertension' ? 400 : 600,
    });
  };

  const getConditionName = (cond: DiabetesCondition) => {
    switch (cond) {
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
  };

  return (
    <>
      {/* 1. สื่อให้ความรู้เกี่ยวกับโรค แบบไม่เต็มหน้าเว็ป และมีกากบาทเพื่อไม่อ่านแล้ว หรือกดอ่านอีกครั้งได้ */}
      <DiseaseEducationModal
        isOpen={showEducationModal}
        onClose={() => setShowEducationModal(false)}
      />

      {/* Main Container Overlay */}
      <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* ========================================================= */}
        {/* หน้าแรก (STEP 1): ข้อมูลผู้ใช้งาน เพศ อายุ น้ำหนัก ส่วนสูง โรคประจำตัว */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto animate-scale-up max-h-[94vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs border border-emerald-100">
                <Scale className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider">
                  หน้า 1 จาก 3: ข้อมูลผู้ใช้งาน
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ยินดีต้อนรับสู่ระบบประเมินอาหาร AI
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                กรอกข้อมูลสุขภาพ 4 อย่างเพื่อคำนวณ BMI และพลังงานพื้นฐาน (BMR) อัตโนมัติ
              </p>
            </div>

            {/* Quick Button to Read Disease Knowledge Again */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickBeep();
                  setShowEducationModal(true);
                }}
                className="w-full py-2 px-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
              >
                <BookOpen className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                <span>📖 อ่านสื่อให้ความรู้เกี่ยวกับโรค (เบาหวาน / ไขมัน / ความดัน)</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProceedToAnnouncement} className="space-y-3.5">
              {/* ชื่อ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ชื่อ / ชื่อเรียกของคุณ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="เช่น สมชาย, คุณแก้ว"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-all shadow-2xs"
                  required
                  autoFocus
                />
              </div>

              {/* 1. เพศ: ชาย / หญิง */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. เพศ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClickBeep();
                      setGender('female');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'female'
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
                      setGender('male');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-2xs ring-2 ring-sky-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">👨</span>
                    <span>ชาย</span>
                  </button>
                </div>
              </div>

              {/* 2. อายุ (ปี) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. อายุ (ปี) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="เช่น 45"
                  min="1"
                  max="120"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-all shadow-2xs"
                  required
                />
              </div>

              {/* 3. น้ำหนัก kg & 4. ส่วนสูง cm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. น้ำหนัก (กิโลกรัม) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="เช่น 60.0"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-all shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    4. ส่วนสูง (เซนติเมตร) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="50"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="เช่น 165"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* โรคประจำตัว */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  โรคประจำตัว / ภาวะสุขภาพ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as DiabetesCondition)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                >
                  <option value="general">คนทั่วไป (ไม่มีโรคประจำตัว)</option>
                  <option value="type1_diabetes">เบาหวานชนิดที่ 1</option>
                  <option value="type2_diabetes">เบาหวานชนิดที่ 2</option>
                  <option value="hypertension">ความดันโลหิตสูง</option>
                  <option value="hyperlipidemia">ไขมันในเลือดสูง</option>
                  <option value="other">อื่นๆ</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  ระบบจะนำข้อมูล เพศ, อายุ, น้ำหนัก, ส่วนสูง ไปคำนวณ BMR และ BMI อัตโนมัติ โดยผู้ใช้ไม่ต้องกรอกเอง
                </p>
              </div>

              {/* Submit Button to Step 2 */}
              <button
                type="submit"
                disabled={!nickname.trim() || !age.trim() || !weightKg.trim() || !heightCm.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 mt-4 cursor-pointer"
              >
                <span>คำนวณ BMI และดูพลังงานพื้นฐาน BMR (ไปหน้า 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* หน้าสอง (STEP 2): ใบประกาศผลการประเมิน BMI และพลังงานพื้นฐาน (BMR)      */}
        {/* ========================================================================= */}
        {currentStep === 2 && bmiResult && bmrResult && (
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto animate-scale-up max-h-[92vh] overflow-y-auto">
            {/* Announcement Official Certificate Badge */}
            <div className="relative border-2 border-dashed border-emerald-300/80 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50/60 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
              {/* Header Ribbon */}
              <div className="text-center space-y-1 pb-3 border-b border-emerald-100">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  ใบประกาศผลการประเมินสุขภาพเฉพาะบุคคล (BMI & BMR Announcement)
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  ประกาศผลการคำนวณดัชนีมวลกาย & พลังงานพื้นฐาน
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  คำนวณอัตโนมัติ: ดัชนีมวลกาย (BMI) และพลังงานพื้นฐานของร่างกาย (BMR)
                </p>
              </div>

              {/* Recipient Info Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 text-xs font-semibold text-slate-700 bg-white/95 rounded-2xl p-3 border border-slate-100 shadow-2xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">ชื่อผู้ประเมิน</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{nickname}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">เพศ / อายุ</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {gender === 'female' ? 'หญิง' : 'ชาย'} ({age} ปี)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">น้ำหนัก / ส่วนสูง</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{weightKg}kg / {heightCm}cm</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">โรคประจำตัว</span>
                  <span className="font-bold text-emerald-700 text-xs truncate block" title={getConditionName(condition)}>
                    {getConditionName(condition)}
                  </span>
                </div>
              </div>

              {/* 1. Main BMI Result Display (Hero Big Value) */}
              <div className={`rounded-2xl p-4 sm:p-5 border text-center ${bmiResult.bgColor} ${bmiResult.borderColor}`}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. ค่าดัชนีมวลกายของคุณ (BMI = น้ำหนัก ÷ ส่วนสูง²)
                </div>
                <div className="flex items-baseline justify-center gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                    {bmiResult.bmi}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500">kg/m²</span>
                </div>

                {/* Level Tag Announcement */}
                <div className="mt-2.5">
                  <span className="text-xs font-bold text-slate-600 mr-2">ผลการประเมิน:</span>
                  <span className={`inline-block px-3 py-1 rounded-xl text-xs sm:text-sm font-black border shadow-2xs ${bmiResult.badgeColor}`}>
                    {bmiResult.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium max-w-md mx-auto leading-relaxed">
                  {bmiResult.advice}
                </p>
              </div>

              {/* 2. Main BMR Result Display (Hero Energy Value) */}
              <div className="rounded-2xl p-4 sm:p-5 border border-emerald-200 bg-emerald-50/60 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80 mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>🎯 พลังงานพื้นฐานของร่างกาย (BMR)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    คำนวณอัตโนมัติ
                  </span>
                </div>

                {/* Main BMR Announcement Display */}
                <div className="bg-white/95 rounded-2xl p-4 border border-emerald-200/80 shadow-2xs text-center">
                  <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                    🎯 พลังงานพื้นฐานของร่างกาย (BMR)
                  </div>
                  <div className="flex items-baseline justify-center gap-1.5 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                      {bmrResult.bmr.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-slate-500">kcal/วัน</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    โดยระบบคำนวณให้อัตโนมัติ ผู้ใช้ ไม่ต้องกรอก BMR เอง
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-around text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">เฉลี่ยต่อมื้อ (~3 มื้อ)</span>
                      <span className="font-bold text-emerald-700 text-sm font-mono">~{bmrResult.perMealKcal} kcal/มื้อ</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">ช่วงแนะนำต่อมื้อ</span>
                      <span className="font-bold text-slate-700 text-xs font-mono">{bmrResult.minMealKcal} - {bmrResult.maxMealKcal} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Formula Breakdown Details */}
                <div className="mt-3 p-3 rounded-xl bg-emerald-100/40 border border-emerald-200/70 text-[11px] text-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span>สูตรคำนวณอัตโนมัติ:</span>
                    <span className="text-[10px] text-emerald-700">เพศ{gender === 'female' ? 'หญิง' : 'ชาย'}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    {gender === 'female'
                      ? 'ผู้หญิง: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) − 161'
                      : 'ผู้ชาย: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) + 5'}
                  </div>
                  <div className="text-[10px] text-emerald-900 font-mono font-semibold pt-0.5">
                    = {bmrResult.formulaDetails} = {bmrResult.bmr.toLocaleString()} kcal/วัน
                  </div>
                </div>
              </div>

              {/* 5-Level Asian Criteria Reference (เกณฑ์ 5 ระดับอย่างเป็นทางการ) */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>เกณฑ์ดัชนีมวลกายมาตรฐาน (5 ระดับ)</span>
                  <span className="text-emerald-700 text-[11px]">เกณฑ์สมส่วน: 18.5 – 22.9</span>
                </div>

                <div className="space-y-1">
                  {BMI_LEVELS_DEFINITION.map((item) => {
                    const isUserLevel = bmiResult.level === item.level;
                    return (
                      <div
                        key={item.level}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                          isUserLevel
                            ? `${item.bgColor} ${item.borderColor} border-2 shadow-xs font-bold ring-2 ring-emerald-500/20`
                            : 'bg-white border-slate-100 text-slate-600 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isUserLevel ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0"></span>
                          )}
                          <span className="font-mono text-slate-700 text-[11px] font-bold shrink-0 w-24">
                            {item.rangeText}
                          </span>
                          <span className="truncate text-xs">
                            {item.category}
                          </span>
                        </div>

                        {isUserLevel && (
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                            ระดับของคุณ
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions: Back to Edit or Proceed to Website (หน้า 3) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickBeep();
                  setCurrentStep(1);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ย้อนกลับไปแก้ไขข้อมูล</span>
              </button>

              <button
                type="button"
                onClick={handleEnterWebsite}
                className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>เข้าสู่การใช้งานเว็บไซต์ (หน้า 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
