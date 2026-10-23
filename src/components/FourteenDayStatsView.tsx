import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Scale,
  Heart,
  Flame,
  Award,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Utensils,
  Wheat,
  Droplet,
  Sparkles,
  CheckCircle2,
  Info,
  RotateCcw,
  Trash2,
  Activity,
  User,
} from 'lucide-react';
import { UserProfile, MealLog, AlertStatus, DiabetesCondition } from '../types';
import { soundFx } from '../utils/audio';
import { calculateBmi, BMI_LEVELS_DEFINITION } from '../utils/bmiHelper';

interface DailyMealSummary {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealName: string;
  weightG: number;
  kcal: number;
  carbsG: number;
  sugarG: number;
  status: AlertStatus;
}

export interface DailyRecord14 {
  id: string;
  date: string; // YYYY-MM-DD
  dayLabel: string;
  dayOffset: number; // 0 is today, 1 is day 2, etc.
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiCategory: string;
  totalKcal: number;
  totalCarbsG: number;
  totalSugarG: number;
  totalSodiumMg: number;
  complianceStatus: AlertStatus;
  fastingGlucoseMgDl?: number;
  meals: DailyMealSummary[];
  notes?: string;
}

interface FourteenDayStatsViewProps {
  userProfile: UserProfile;
  mealLogs: MealLog[];
  onOpenMealBox: () => void;
  onOpenPhotoScanner?: () => void;
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
}

// Helper to compute BMI & Category
function computeBmi(weightKg: number, heightCm: number): { bmi: number; category: string } {
  const result = calculateBmi(weightKg, heightCm);
  return { bmi: result.bmi, category: result.category };
}

export function getConditionThaiLabel(cond?: DiabetesCondition): string {
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
      return 'ความดันโลหิตสูง';
    case 'hyperlipidemia':
      return 'ไขมันในเลือดสูง';
    default:
      return 'การดูแลสุขภาพทั่วไป';
  }
}

const STORAGE_KEY = 'smart_mealbox_records_real_accumulated_v4';

// Helper to build Day 1 Baseline record directly from User Profile inputs on front page
function buildBaselineDay1(profile: UserProfile, logs: MealLog[] = []): DailyRecord14 | null {
  const weight = profile.weightKg || 0;
  const height = profile.heightCm || 0;
  if (weight <= 0 || height <= 0) return null;

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const { bmi, category } = computeBmi(weight, height);

  // Use only actual meal logs for today (never fake or sample numbers)
  const todayLogs = (logs || []).filter((l) => l.timestamp.split('T')[0] === dateStr);
  const totalKcal = todayLogs.reduce((sum, l) => sum + l.totalKcal, 0);
  const totalCarbs = todayLogs.reduce((sum, l) => sum + l.totalCarbsG, 0);
  const totalSugar = todayLogs.reduce((sum, l) => sum + l.totalSugarG, 0);
  const hasWarning = todayLogs.some((m) => m.status === 'warning' || m.status === 'danger');

  return {
    id: `real_record_day_1_${dateStr}`,
    date: dateStr,
    dayLabel: `วันที่ 1 (${today.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}) - ข้อมูลแรกเริ่ม`,
    dayOffset: 0,
    weightKg: weight,
    heightCm: height,
    bmi,
    bmiCategory: category,
    totalKcal,
    totalCarbsG: totalCarbs,
    totalSugarG: totalSugar,
    totalSodiumMg: 0,
    complianceStatus: hasWarning ? 'warning' : 'optimal',
    fastingGlucoseMgDl: profile.bloodSugarFastingMgDl || 0,
    meals: todayLogs.map((l) => ({
      id: l.id,
      mealType: l.mealType,
      mealName: l.mealName,
      weightG: l.compartments.reduce((sum, c) => sum + c.weightG, 0) || 0,
      kcal: l.totalKcal,
      carbsG: l.totalCarbsG,
      sugarG: l.totalSugarG,
      status: l.status,
    })),
    notes: `บันทึกเริ่มต้นจากข้อมูลผู้ใช้งานหน้าแรก (คุณ ${profile.nickname || 'ผู้ใช้งาน'})`,
  };
}

// Helper to convert real meal logs into daily records
function createRecordsFromMealLogs(profile: UserProfile, logs: MealLog[]): DailyRecord14[] {
  if (!logs || logs.length === 0) return [];
  const logsByDate: { [dateStr: string]: MealLog[] } = {};
  logs.forEach((log) => {
    const dateStr = log.timestamp.split('T')[0];
    if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
    logsByDate[dateStr].push(log);
  });

  const sortedDates = Object.keys(logsByDate).sort();
  const weight = profile.weightKg || 0;
  const height = profile.heightCm || 0;
  const { bmi, category } = computeBmi(weight, height);

  return sortedDates.map((dateStr, idx) => {
    const dayLogs = logsByDate[dateStr];
    const totalKcal = dayLogs.reduce((sum, l) => sum + l.totalKcal, 0);
    const totalCarbs = dayLogs.reduce((sum, l) => sum + l.totalCarbsG, 0);
    const totalSugar = dayLogs.reduce((sum, l) => sum + l.totalSugarG, 0);
    const hasWarning = dayLogs.some((m) => m.status === 'warning' || m.status === 'danger');
    const d = new Date(dateStr);

    return {
      id: `real_record_day_${idx + 1}_${dateStr}`,
      date: dateStr,
      dayLabel: `วันที่ ${idx + 1} (${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})`,
      dayOffset: idx,
      weightKg: weight,
      heightCm: height,
      bmi,
      bmiCategory: category,
      totalKcal,
      totalCarbsG: totalCarbs,
      totalSugarG: totalSugar,
      totalSodiumMg: 0,
      complianceStatus: hasWarning ? 'warning' : 'optimal',
      fastingGlucoseMgDl: profile.bloodSugarFastingMgDl || 0,
      meals: dayLogs.map((l) => ({
        id: l.id,
        mealType: l.mealType,
        mealName: l.mealName,
        weightG: l.compartments.reduce((sum, c) => sum + c.weightG, 0) || 0,
        kcal: l.totalKcal,
        carbsG: l.totalCarbsG,
        sugarG: l.totalSugarG,
        status: l.status,
      })),
      notes: `บันทึกจากการใช้งานจริง (${dayLogs.length} มื้อ)`,
    };
  });
}

export const FourteenDayStatsView: React.FC<FourteenDayStatsViewProps> = ({
  userProfile,
  mealLogs,
  onOpenMealBox,
  onOpenPhotoScanner,
  onUpdateProfile,
}) => {
  const [records, setRecords] = useState<DailyRecord14[]>([]);
  const [activeChartTab, setActiveChartTab] = useState<'bmi' | 'weight' | 'kcal' | 'carbs' | 'glucose'>('bmi');
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  // Edit / Add Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<DailyRecord14 | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('0');
  const [editHeight, setEditHeight] = useState<string>('0');
  const [editKcal, setEditKcal] = useState<string>('0');
  const [editCarbs, setEditCarbs] = useState<string>('0');
  const [editSugar, setEditSugar] = useState<string>('0');
  const [editFastingGlucose, setEditFastingGlucose] = useState<string>('0');
  const [editNotes, setEditNotes] = useState<string>('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Initialize records from userProfile & localStorage (Strictly from real inputs & real usage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let parsed: DailyRecord14[] = [];
      if (saved) {
        try {
          const raw = JSON.parse(saved);
          if (Array.isArray(raw)) parsed = raw;
        } catch {
          parsed = [];
        }
      }

      const weight = userProfile.weightKg || 0;
      const height = userProfile.heightCm || 0;

      // Case 1: If no saved records or records is empty
      if (parsed.length === 0) {
        if (mealLogs && mealLogs.length > 0) {
          const initial = createRecordsFromMealLogs(userProfile, mealLogs);
          if (initial.length > 0) {
            setRecords(initial);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
            return;
          }
        }

        // Auto-create Day 1 baseline directly from the user profile inputs on the first screen
        const day1 = buildBaselineDay1(userProfile, mealLogs);
        if (day1) {
          setRecords([day1]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([day1]));
        } else {
          setRecords([]);
        }
        return;
      }

      // Case 2: If records already exist, ensure the baseline Day 1 reflects the actual user profile info
      if (weight > 0 && height > 0) {
        const { bmi, category } = computeBmi(weight, height);
        let wasUpdated = false;
        const updated = parsed.map((r, idx) => {
          // If first record has 0 weight/height or was updated in profile
          if (idx === 0 && (r.weightKg <= 0 || r.heightCm <= 0 || r.weightKg !== weight || r.heightCm !== height)) {
            wasUpdated = true;
            return {
              ...r,
              weightKg: weight,
              heightCm: height,
              bmi,
              bmiCategory: category,
              notes: r.notes || `บันทึกเริ่มต้นจากข้อมูลผู้ใช้งานหน้าแรก (คุณ ${userProfile.nickname || 'ผู้ใช้งาน'})`,
            };
          }
          return r;
        });

        if (wasUpdated) {
          setRecords(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return;
        }
      }

      setRecords(parsed);
    } catch {
      setRecords([]);
    }
  }, [userProfile, mealLogs]);

  // Sync actual meal logs from application usage into the daily records
  useEffect(() => {
    if (mealLogs.length === 0 || records.length === 0) return;

    // Group mealLogs by date
    const logsByDate: { [dateStr: string]: MealLog[] } = {};
    mealLogs.forEach((log) => {
      const dateStr = log.timestamp.split('T')[0];
      if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
      logsByDate[dateStr].push(log);
    });

    let hasChanges = false;
    const updated = [...records];

    // Update existing dates with new meal calculations
    Object.keys(logsByDate).forEach((dateStr) => {
      const logsForDate = logsByDate[dateStr];
      const existingIdx = updated.findIndex((r) => r.date === dateStr);

      const dayKcal = logsForDate.reduce((sum, m) => sum + m.totalKcal, 0);
      const dayCarbs = logsForDate.reduce((sum, m) => sum + m.totalCarbsG, 0);
      const daySugar = logsForDate.reduce((sum, m) => sum + m.totalSugarG, 0);
      const hasWarning = logsForDate.some((m) => m.status === 'warning' || m.status === 'danger');

      const convertedMeals: DailyMealSummary[] = logsForDate.map((l) => ({
        id: l.id,
        mealType: l.mealType,
        mealName: l.mealName,
        weightG: l.compartments.reduce((sum, c) => sum + c.weightG, 0) || 0,
        kcal: l.totalKcal,
        carbsG: l.totalCarbsG,
        sugarG: l.totalSugarG,
        status: l.status,
      }));

      if (existingIdx !== -1) {
        // Update existing record
        if (
          updated[existingIdx].totalKcal !== dayKcal ||
          updated[existingIdx].meals.length !== convertedMeals.length
        ) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            totalKcal: dayKcal,
            totalCarbsG: dayCarbs,
            totalSugarG: daySugar,
            complianceStatus: hasWarning ? 'warning' : 'optimal',
            meals: convertedMeals,
          };
          hasChanges = true;
        }
      } else {
        // A new day of actual usage was logged!
        const lastRec = updated[updated.length - 1];
        const weight = lastRec ? lastRec.weightKg : userProfile.weightKg || 0;
        const height = lastRec ? lastRec.heightCm : userProfile.heightCm || 0;
        const { bmi, category } = computeBmi(weight, height);

        const newDayNumber = updated.length + 1;
        const d = new Date(dateStr);
        const dayLabel = `วันที่ ${newDayNumber} (${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})`;

        updated.push({
          id: `real_record_day_${newDayNumber}_${dateStr}`,
          date: dateStr,
          dayLabel,
          dayOffset: newDayNumber - 1,
          weightKg: weight,
          heightCm: height,
          bmi,
          bmiCategory: category,
          totalKcal: dayKcal,
          totalCarbsG: dayCarbs,
          totalSugarG: daySugar,
          totalSodiumMg: 0,
          complianceStatus: hasWarning ? 'warning' : 'optimal',
          fastingGlucoseMgDl: lastRec?.fastingGlucoseMgDl || 0,
          meals: convertedMeals,
          notes: `บันทึกจากการใช้งานวันที่ ${newDayNumber}`,
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [mealLogs, records, userProfile]);

  // Save changes to localStorage helper
  const saveRecordsToStorage = (newRecords: DailyRecord14[]) => {
    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  };

  // Clear all records (Start completely fresh at 0 days)
  const handleClearAllRecords = () => {
    soundFx.playSuccessBeep();
    saveRecordsToStorage([]);
    setShowResetConfirmModal(false);
  };

  // Start with Day 1 baseline only using actual user profile inputs
  const handleResetToDay1 = () => {
    soundFx.playSuccessBeep();
    const day1 = buildBaselineDay1(userProfile, mealLogs);
    if (day1) {
      saveRecordsToStorage([day1]);
    } else {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const weight = userProfile.weightKg || 0;
      const height = userProfile.heightCm || 0;
      const { bmi, category } = computeBmi(weight, height);
      const fallbackDay1: DailyRecord14 = {
        id: `real_record_day_1_${dateStr}`,
        date: dateStr,
        dayLabel: `วันที่ 1 (${today.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}) - ข้อมูลแรกเริ่ม`,
        dayOffset: 0,
        weightKg: weight,
        heightCm: height,
        bmi,
        bmiCategory: category,
        totalKcal: 0,
        totalCarbsG: 0,
        totalSugarG: 0,
        totalSodiumMg: 0,
        complianceStatus: 'optimal',
        fastingGlucoseMgDl: userProfile.bloodSugarFastingMgDl || 0,
        meals: [],
        notes: `เริ่มต้นบันทึกวันแรกจากข้อมูลผู้ใช้งาน (คุณ ${userProfile.nickname || 'ผู้ใช้งาน'})`,
      };
      saveRecordsToStorage([fallbackDay1]);
    }
    setShowResetConfirmModal(false);
  };

  // Quick Open for Today's Daily Weight Check-in
  const handleOpenTodayCheckIn = () => {
    soundFx.playClickBeep();
    const todayDateStr = new Date().toISOString().split('T')[0];
    const todayRec = records.find((r) => r.date === todayDateStr);

    if (todayRec) {
      setEditingRecord(todayRec);
      setEditDate(todayRec.date);
      setEditWeight(todayRec.weightKg.toString());
      setEditHeight(todayRec.heightCm.toString());
      setEditKcal(todayRec.totalKcal.toString());
      setEditCarbs(todayRec.totalCarbsG.toString());
      setEditSugar(todayRec.totalSugarG.toString());
      setEditFastingGlucose(todayRec.fastingGlucoseMgDl && todayRec.fastingGlucoseMgDl > 0 ? todayRec.fastingGlucoseMgDl.toString() : '');
      setEditNotes(todayRec.notes || '');
    } else {
      const lastRec = records[records.length - 1];
      const defaultWeight = lastRec && lastRec.weightKg > 0 ? lastRec.weightKg : (userProfile.weightKg || 0);
      const defaultHeight = lastRec && lastRec.heightCm > 0 ? lastRec.heightCm : (userProfile.heightCm || 0);
      setEditingRecord(null);
      setEditDate(todayDateStr);
      setEditWeight(defaultWeight > 0 ? defaultWeight.toString() : '');
      setEditHeight(defaultHeight > 0 ? defaultHeight.toString() : '');
      setEditKcal('0');
      setEditCarbs('0');
      setEditSugar('0');
      setEditFastingGlucose(userProfile.bloodSugarFastingMgDl && userProfile.bloodSugarFastingMgDl > 0 ? userProfile.bloodSugarFastingMgDl.toString() : '');
      setEditNotes(records.length === 0 ? `เริ่มต้นบันทึกวันแรก (คุณ ${userProfile.nickname || 'ผู้ใช้งาน'})` : 'บันทึกน้ำหนัก & สถิติการกินประจำวัน');
    }
    setShowEditModal(true);
  };

  // Open modal to edit or add a day
  const handleOpenEditModal = (rec?: DailyRecord14) => {
    soundFx.playClickBeep();
    if (rec) {
      setEditingRecord(rec);
      setEditDate(rec.date);
      setEditWeight(rec.weightKg.toString());
      setEditHeight(rec.heightCm.toString());
      setEditKcal(rec.totalKcal.toString());
      setEditCarbs(rec.totalCarbsG.toString());
      setEditSugar(rec.totalSugarG.toString());
      setEditFastingGlucose(rec.fastingGlucoseMgDl ? rec.fastingGlucoseMgDl.toString() : '0');
      setEditNotes(rec.notes || '');
    } else {
      const nextDate = new Date();
      const nextDateStr = nextDate.toISOString().split('T')[0];
      const lastRec = records[records.length - 1];
      setEditingRecord(null);
      setEditDate(nextDateStr);
      setEditWeight(lastRec ? lastRec.weightKg.toString() : (userProfile.weightKg || 0).toString());
      setEditHeight(lastRec ? lastRec.heightCm.toString() : (userProfile.heightCm || 0).toString());
      setEditKcal('0');
      setEditCarbs('0');
      setEditSugar('0');
      setEditFastingGlucose(lastRec?.fastingGlucoseMgDl ? lastRec.fastingGlucoseMgDl.toString() : '0');
      setEditNotes('');
    }
    setShowEditModal(true);
  };

  // Save edited or newly added day data
  const handleSaveEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccessBeep();

    const w = parseFloat(editWeight) || 0;
    const h = parseFloat(editHeight) || 0;
    const kcal = parseFloat(editKcal) || 0;
    const carbs = parseFloat(editCarbs) || 0;
    const sugar = parseFloat(editSugar) || 0;
    const fbs = parseFloat(editFastingGlucose) || 0;
    const { bmi, category } = computeBmi(w, h);

    const todayDateStr = new Date().toISOString().split('T')[0];

    if (editingRecord) {
      const updatedRecords = records.map((r) => {
        if (r.id === editingRecord.id) {
          return {
            ...r,
            date: editDate || r.date,
            weightKg: w,
            heightCm: h,
            bmi,
            bmiCategory: category,
            totalKcal: kcal,
            totalCarbsG: carbs,
            totalSugarG: sugar,
            fastingGlucoseMgDl: fbs,
            notes: editNotes,
          };
        }
        return r;
      });
      saveRecordsToStorage(updatedRecords);

      if ((editingRecord.date === todayDateStr || editDate === todayDateStr) && onUpdateProfile && (w > 0 || h > 0)) {
        onUpdateProfile({
          ...userProfile,
          weightKg: w > 0 ? w : userProfile.weightKg,
          heightCm: h > 0 ? h : userProfile.heightCm,
        });
      }
    } else {
      // Create new consecutive record
      const isRecordForToday = editDate === todayDateStr;
      const newDayNum = records.length + 1;
      const newRec: DailyRecord14 = {
        id: `real_record_day_${newDayNum}_${editDate}`,
        date: editDate,
        dayLabel: `วันที่ ${newDayNum} (${new Date(editDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})`,
        dayOffset: records.length,
        weightKg: w,
        heightCm: h,
        bmi,
        bmiCategory: category,
        totalKcal: kcal,
        totalCarbsG: carbs,
        totalSugarG: sugar,
        totalSodiumMg: 0,
        complianceStatus: 'optimal',
        fastingGlucoseMgDl: fbs,
        meals: [],
        notes: editNotes || 'บันทึกข้อมูลสุขภาพ',
      };
      saveRecordsToStorage([...records, newRec]);

      if (isRecordForToday && onUpdateProfile && (w > 0 || h > 0)) {
        onUpdateProfile({
          ...userProfile,
          weightKg: w > 0 ? w : userProfile.weightKg,
          heightCm: h > 0 ? h : userProfile.heightCm,
        });
      }
    }

    setShowEditModal(false);
  };

  // Delete a day record
  const handleDeleteRecord = (recordId: string) => {
    soundFx.playClickBeep();
    if (records.length <= 1) {
      alert('จำเป็นต้องมีบันทึกอย่างน้อย 1 วัน');
      return;
    }
    const filtered = records.filter((r) => r.id !== recordId);
    saveRecordsToStorage(filtered);
    setShowEditModal(false);
  };

  // First Day vs Today BMI Comparison logic
  const comparisonData = useMemo(() => {
    const profileW = userProfile.weightKg || 0;
    const profileH = userProfile.heightCm || 0;
    const { bmi: profileBmi, category: profileBmiCat } = computeBmi(profileW, profileH);

    if (records.length === 0) {
      if (profileW > 0 && profileH > 0) {
        const virtualDay1: DailyRecord14 = {
          id: 'virtual_day_1',
          date: new Date().toISOString().split('T')[0],
          dayLabel: 'วันที่ 1 (วันแรกที่เริ่มใช้)',
          dayOffset: 0,
          weightKg: profileW,
          heightCm: profileH,
          bmi: profileBmi,
          bmiCategory: profileBmiCat,
          totalKcal: 0,
          totalCarbsG: 0,
          totalSugarG: 0,
          totalSodiumMg: 0,
          complianceStatus: 'optimal',
          meals: [],
        };
        return {
          firstDay: virtualDay1,
          latestDay: virtualDay1,
          bmiDelta: 0,
          weightDelta: 0,
          percentBmiChange: 0,
          daysTracked: 1,
          statusImproved: false,
          hasValidData: true,
        };
      }
      return {
        firstDay: null,
        latestDay: null,
        bmiDelta: 0,
        weightDelta: 0,
        percentBmiChange: 0,
        daysTracked: 0,
        statusImproved: false,
        hasValidData: false,
      };
    }

    const firstDay = records[0];
    const latestDay = records[records.length - 1];

    const effectiveFirstWeight = firstDay.weightKg > 0 ? firstDay.weightKg : profileW;
    const effectiveLatestWeight = latestDay.weightKg > 0 ? latestDay.weightKg : profileW;
    const effectiveFirstHeight = firstDay.heightCm > 0 ? firstDay.heightCm : profileH;
    const effectiveLatestHeight = latestDay.heightCm > 0 ? latestDay.heightCm : profileH;

    const firstBmi = firstDay.bmi > 0 ? firstDay.bmi : computeBmi(effectiveFirstWeight, effectiveFirstHeight).bmi;
    const latestBmi = latestDay.bmi > 0 ? latestDay.bmi : computeBmi(effectiveLatestWeight, effectiveLatestHeight).bmi;

    const hasValidFirst = effectiveFirstWeight > 0 && effectiveFirstHeight > 0;
    const hasValidLatest = effectiveLatestWeight > 0 && effectiveLatestHeight > 0;

    const bmiDelta = hasValidFirst && hasValidLatest ? parseFloat((latestBmi - firstBmi).toFixed(1)) : 0;
    const weightDelta = hasValidFirst && hasValidLatest ? parseFloat((effectiveLatestWeight - effectiveFirstWeight).toFixed(1)) : 0;
    const percentBmiChange = hasValidFirst && hasValidLatest && firstBmi > 0 ? parseFloat(((bmiDelta / firstBmi) * 100).toFixed(1)) : 0;
    const statusImproved = bmiDelta < 0 || (firstBmi > 0 && firstBmi < 18.5 && bmiDelta > 0);

    return {
      firstDay: {
        ...firstDay,
        weightKg: effectiveFirstWeight,
        heightCm: effectiveFirstHeight,
        bmi: firstBmi,
        bmiCategory: firstDay.bmiCategory || profileBmiCat,
      },
      latestDay: {
        ...latestDay,
        weightKg: effectiveLatestWeight,
        heightCm: effectiveLatestHeight,
        bmi: latestBmi,
        bmiCategory: latestDay.bmiCategory || profileBmiCat,
      },
      bmiDelta,
      weightDelta,
      percentBmiChange,
      daysTracked: records.length,
      statusImproved,
      hasValidData: hasValidFirst || hasValidLatest,
    };
  }, [records, userProfile]);

  // Key KPI calculations across all recorded days
  const statsSummary = useMemo(() => {
    const profileW = userProfile.weightKg || 0;
    const profileH = userProfile.heightCm || 0;
    const { bmi: profileBmi, category: profileBmiCat } = computeBmi(profileW, profileH);

    if (records.length === 0) {
      return {
        latestWeight: profileW,
        weightDelta: 0,
        latestHeight: profileH,
        latestBmi: profileBmi,
        latestBmiCat: profileW > 0 ? profileBmiCat : 'รอระบุข้อมูล',
        avgKcal: 0,
        avgCarbs: 0,
        complianceRate: 100,
        safeDaysCount: 0,
      };
    }

    const firstDay = records[0];
    const latestDay = records[records.length - 1];

    const effectiveFirstWeight = firstDay.weightKg > 0 ? firstDay.weightKg : profileW;
    const effectiveLatestWeight = latestDay.weightKg > 0 ? latestDay.weightKg : profileW;
    const effectiveHeight = latestDay.heightCm > 0 ? latestDay.heightCm : profileH;
    const effectiveBmi = latestDay.bmi > 0 ? latestDay.bmi : computeBmi(effectiveLatestWeight, effectiveHeight).bmi;
    const effectiveBmiCat = latestDay.bmiCategory || computeBmi(effectiveLatestWeight, effectiveHeight).category;

    const weightDelta = effectiveFirstWeight > 0 && effectiveLatestWeight > 0
      ? parseFloat((effectiveLatestWeight - effectiveFirstWeight).toFixed(1))
      : 0;

    const recordedDaysWithMeals = records.filter((r) => r.totalKcal > 0);
    const activeCount = recordedDaysWithMeals.length || 0;
    const totalKcalSum = records.reduce((sum, r) => sum + r.totalKcal, 0);
    const totalCarbsSum = records.reduce((sum, r) => sum + r.totalCarbsG, 0);
    const safeDaysCount = records.filter((r) => r.complianceStatus === 'optimal').length;
    const complianceRate = records.length > 0 ? Math.round((safeDaysCount / records.length) * 100) : 100;

    return {
      latestWeight: effectiveLatestWeight,
      weightDelta,
      latestHeight: effectiveHeight,
      latestBmi: effectiveBmi,
      latestBmiCat: effectiveLatestWeight > 0 ? effectiveBmiCat : 'รอระบุข้อมูล',
      avgKcal: activeCount > 0 ? Math.round(totalKcalSum / activeCount) : 0,
      avgCarbs: activeCount > 0 ? Math.round(totalCarbsSum / activeCount) : 0,
      complianceRate,
      safeDaysCount,
    };
  }, [records, userProfile]);

  // Chart data boundaries with safe zero-handling
  const chartBounds = useMemo(() => {
    if (records.length === 0) {
      return {
        minWeight: 0,
        maxWeight: 100,
        minBmi: 0,
        maxBmi: 35,
        maxKcal: 2000,
        maxCarb: 200,
        minGlucose: 0,
        maxGlucose: 160,
      };
    }
    const weights = records.map((r) => r.weightKg);
    const bmis = records.map((r) => r.bmi);
    const kcals = records.map((r) => r.totalKcal);
    const carbs = records.map((r) => r.totalCarbsG);
    const glucoses = records.map((r) => r.fastingGlucoseMgDl || 0);

    const validWeights = weights.filter((w) => w > 0);
    const validBmis = bmis.filter((b) => b > 0);
    const validGlucoses = glucoses.filter((g) => g > 0);

    const minWeight = validWeights.length > 0 ? Math.floor(Math.min(...validWeights) - 1) : 0;
    const maxWeight = validWeights.length > 0 ? Math.ceil(Math.max(...validWeights) + 1) : 100;
    const minBmi = validBmis.length > 0 ? Math.floor(Math.min(...validBmis) - 0.5) : 0;
    const maxBmi = validBmis.length > 0 ? Math.ceil(Math.max(...validBmis) + 0.5) : 35;
    const minGlucose = validGlucoses.length > 0 ? Math.floor(Math.min(...validGlucoses) - 10) : 0;
    const maxGlucose = validGlucoses.length > 0 ? Math.ceil(Math.max(...validGlucoses) + 15) : 160;

    return {
      minWeight,
      maxWeight,
      minBmi,
      maxBmi,
      maxKcal: Math.max(userProfile.targetDailyKcal || 1600, ...kcals, 1000) + 200,
      maxCarb: Math.max(160, ...carbs, 100) + 20,
      minGlucose,
      maxGlucose,
    };
  }, [records, userProfile]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>บันทึกสะสมจริงจากการใช้งาน (Real Usage 14-Day Tracker)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              สถิติการบันทึกการกิน & น้ำหนัก ส่วนสูง 14 วัน
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              นำข้อมูลจริงจากที่คุณกรอกในหน้าแรก (ชื่อ, น้ำหนัก, ส่วนสูง, BMI) มาลงในสถิติวันแรกทันที ไม่ใช้ตัวเลขสุ่มหรือตัวเลขตัวอย่าง
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenTodayCheckIn()}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white flex items-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-400/40"
              title="บันทึกน้ำหนักประจำวันและอัปเดตข้อมูลวันนี้"
            >
              <Scale className="w-6 h-6 text-emerald-100 shrink-0" />
              <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wide">
                บันทึกน้ำหนักประจำวัน
              </span>
            </button>

            <button
              onClick={() => handleOpenEditModal()}
              className="px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border border-emerald-200 cursor-pointer"
              title="เพิ่มบันทึกข้อมูลวันใหม่"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>+ เพิ่มวันใหม่</span>
            </button>

            <button
              onClick={onOpenMealBox}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-slate-600" />
              <span>ชั่งมื้ออาหาร</span>
            </button>

            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border border-slate-200 cursor-pointer"
              title="รีเซ็ตเริ่มต้นนับวันแรกใหม่"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Profile Baseline Sync Banner */}
        {userProfile.weightKg && userProfile.heightCm ? (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-slate-900">
                    ข้อมูลผู้ใช้งานจริงจากหน้าแรก: คุณ {userProfile.nickname || 'ผู้ใช้งาน'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wide">
                    ✓ ดึงข้อมูลหน้าแรกมาใส่แล้ว (ไม่ใช้เลขมั่ว)
                  </span>
                </div>
                <div className="text-xs text-slate-700 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>น้ำหนัก: <strong className="text-slate-900">{userProfile.weightKg} kg</strong></span>
                  <span>ส่วนสูง: <strong className="text-slate-900">{userProfile.heightCm} cm</strong></span>
                  <span>BMI เริ่มต้น: <strong className="text-emerald-700">{computeBmi(userProfile.weightKg, userProfile.heightCm).bmi}</strong> ({computeBmi(userProfile.weightKg, userProfile.heightCm).category})</span>
                  <span>เป้าหมายแคลอรี: <strong className="text-slate-900">{userProfile.targetDailyKcal || 1600} kcal/วัน</strong></span>
                  <span>ภาวะสุขภาพ: <strong className="text-slate-900">{getConditionThaiLabel(userProfile.condition)}</strong></span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-emerald-800 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-300 font-bold shrink-0 shadow-2xs">
              วันแรกตั้งต้นตามข้อมูลจริง
            </div>
          </div>
        ) : null}

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Latest Weight */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>น้ำหนักล่าสุด</span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {statsSummary.latestWeight > 0 ? statsSummary.latestWeight : (userProfile.weightKg || 'รอระบุ')}
              </span>
              {(statsSummary.latestWeight > 0 || (userProfile.weightKg && userProfile.weightKg > 0)) && (
                <span className="text-xs text-slate-500 font-bold">kg</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold">
              {records.length === 0 && !userProfile.weightKg ? (
                <span className="text-slate-400">ยังไม่มีบันทึก</span>
              ) : records.length <= 1 ? (
                <span className="text-slate-500">วันแรก (Baseline ตามข้อมูลที่กรอก)</span>
              ) : statsSummary.weightDelta < 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  ลดลง {Math.abs(statsSummary.weightDelta)} kg จากวันแรก
                </span>
              ) : statsSummary.weightDelta > 0 ? (
                <span className="text-amber-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{statsSummary.weightDelta} kg จากวันแรก
                </span>
              ) : (
                <span className="text-slate-500">คงที่เท่ากับวันแรก</span>
              )}
            </div>
          </div>

          {/* Height & BMI */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>ส่วนสูง & BMI ปัจจุบัน</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {statsSummary.latestBmi > 0 ? statsSummary.latestBmi : (userProfile.weightKg && userProfile.heightCm ? computeBmi(userProfile.weightKg, userProfile.heightCm).bmi : 'รอระบุ')}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {statsSummary.latestHeight > 0 ? `BMI (${statsSummary.latestHeight} cm)` : (userProfile.heightCm ? `BMI (${userProfile.heightCm} cm)` : 'รอระบุ')}
              </span>
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-1 truncate">
              {statsSummary.latestBmiCat}
            </div>
          </div>

          {/* Average Daily Calories */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>เฉลี่ยมื้อที่บันทึก</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {statsSummary.avgKcal > 0 ? statsSummary.avgKcal : '0'}
              </span>
              <span className="text-xs text-slate-500 font-bold">{statsSummary.avgKcal > 0 ? 'kcal/วัน' : 'kcal (รอชั่งอาหาร)'}</span>
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              เป้าหมาย: {userProfile.targetDailyKcal || 1600} kcal
            </div>
          </div>

          {/* Days Tracked & Compliance */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>จำนวนวันที่บันทึกแล้ว</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                {records.length > 0 ? records.length : (userProfile.weightKg ? 1 : 0)}
              </span>
              <span className="text-xs text-slate-500 font-bold">/ 14 วัน</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-1">
              {records.length === 0 && !userProfile.weightKg
                ? 'ยังไม่มีบันทึก (0 วัน)'
                : records.length <= 1
                ? 'เริ่มบันทึกจากข้อมูลวันแรก'
                : `ผ่านเกณฑ์ ${statsSummary.complianceRate}%`}
            </div>
          </div>
        </div>
      </div>

      {/* When 0 Records exist and user has not configured profile, display a clean Empty State Card */}
      {records.length === 0 && (!userProfile.weightKg || !userProfile.heightCm) ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <CalendarDays className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              ยังไม่มีบันทึกสะสม (0 / 14 วัน)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              ระบบจะเริ่มสะสมสถิติทีละวันตามการเข้าใช้งานจริง (ชั่งอาหาร, สแกนอาหาร, หรือบันทึกมื้ออาหาร) โดยไม่มีการใส่ข้อมูลจำลองไว้ล่วงหน้า
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenTodayCheckIn()}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center gap-2.5 shadow-md transition-all cursor-pointer active:scale-95 ring-2 ring-emerald-400/40"
            >
              <Scale className="w-5 h-5 text-emerald-100" />
              <span className="text-base sm:text-lg font-black tracking-wide">บันทึกน้ำหนักประจำวัน (วันแรก)</span>
            </button>

            <button
              type="button"
              onClick={onOpenMealBox}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-emerald-600" />
              <span>ชั่งมื้ออาหาร (Smart Meal Box)</span>
            </button>

            {onOpenPhotoScanner && (
              <button
                type="button"
                onClick={onOpenPhotoScanner}
                className="px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 transition-all border border-emerald-200 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>ประเมินแคลอรีมื้ออาหาร (AI)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: BMI DAY 1 VS TODAY COMPARISON (เปรียบเทียบ BMI วันแรกกับปัจจุบัน) */}
          {comparisonData.firstDay && comparisonData.latestDay && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    <span>การเปรียบเทียบดัชนีมวลกาย (BMI Baseline vs Present Comparison)</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    เปรียบเทียบ BMI วันแรกที่เริ่มใช้ กับ ปัจจุบัน (บันทึกสะสม {comparisonData.daysTracked} วัน)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ประเมินผลสัมฤทธิ์การควบคุมอาหารและการเปลี่ยนแปลงของร่างกายจากสถิติที่เริ่มใช้งานแอพวันแรก
                  </p>
                </div>
              </div>

              {/* Comparison Cards Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {/* Day 1 Baseline Card */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px]">
                        วันแรกที่เริ่มใช้ (Baseline)
                      </span>
                      <span>{new Date(comparisonData.firstDay.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">ดัชนีมวลกายแรกเริ่ม</div>
                    <div className="text-3xl sm:text-4xl font-black text-slate-800 mt-1">
                      {comparisonData.firstDay.bmi}{' '}
                      <span className="text-xs font-bold text-slate-500">BMI</span>
                    </div>
                    <div className="inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200/80 text-slate-700">
                      สถานะ: {comparisonData.firstDay.bmiCategory}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                    <div>
                      น้ำหนัก: <strong className="text-slate-900">{comparisonData.firstDay.weightKg} kg</strong>
                    </div>
                    <div>
                      ส่วนสูง: <strong className="text-slate-900">{comparisonData.firstDay.heightCm} cm</strong>
                    </div>
                  </div>
                </div>

                {/* Delta / Improvement Summary Card */}
                <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 flex flex-col justify-between text-center relative">
                  <div className="absolute top-3 right-3">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-2">
                      ผลการเปลี่ยนแปลง (Δ Delta)
                    </span>

                    <div className="flex items-center justify-center gap-1 mt-1">
                      {records.length <= 1 ? (
                        <span className="text-slate-400 font-bold text-2xl">กำลังเริ่มบันทึก</span>
                      ) : comparisonData.bmiDelta < 0 ? (
                        <>
                          <TrendingDown className="w-7 h-7 text-emerald-600 shrink-0" />
                          <span className="text-3xl sm:text-4xl font-black text-slate-900">
                            {comparisonData.bmiDelta}
                          </span>
                          <span className="text-xs font-bold text-slate-600 ml-1">BMI</span>
                        </>
                      ) : comparisonData.bmiDelta > 0 ? (
                        <>
                          <TrendingUp className="w-7 h-7 text-amber-600 shrink-0" />
                          <span className="text-3xl sm:text-4xl font-black text-slate-900">
                            +{comparisonData.bmiDelta}
                          </span>
                          <span className="text-xs font-bold text-slate-600 ml-1">BMI</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 font-bold text-2xl">0.0</span>
                          <span className="text-xs font-bold text-slate-600 ml-1">BMI</span>
                        </>
                      )}
                    </div>

                    <div className="text-xs font-bold text-emerald-800 mt-2">
                      {records.length <= 1 ? (
                        <span>บันทึกเป็นวันที่ 1 ข้อมูลจะเปรียบเทียบต่อเนื่องทุกวันที่ใช้งาน</span>
                      ) : comparisonData.weightDelta < 0 ? (
                        <span>น้ำหนักลดลง {Math.abs(comparisonData.weightDelta)} kg ({Math.abs(comparisonData.percentBmiChange)}%)</span>
                      ) : comparisonData.weightDelta > 0 ? (
                        <span>น้ำหนักเพิ่มขึ้น {comparisonData.weightDelta} kg</span>
                      ) : (
                        <span>น้ำหนักคงที่อย่างมีเสถียรภาพ</span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-200/80 mt-3 text-left">
                    {records.length <= 1 ? (
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ระบบจะเริ่มสะสมสถิติเมื่อคุณชั่งอาหารและบันทึกน้ำหนักในแต่ละวันจนครบ 14 วัน
                      </span>
                    ) : comparisonData.statusImproved ? (
                      <span className="flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <strong>ยอดเยี่ยม:</strong> แนวโน้มสุขภาพและดัชนีมวลกายพัฒนาไปในทางที่ดีขึ้น ช่วยลดความเสี่ยงภาวะดื้ออินซูลิน
                      </span>
                    ) : (
                      <span>
                        <strong>คำแนะนำ:</strong> ควบคุมสัดส่วนคาร์โบไฮเดรตในแต่ละมื้อด้วยเครื่องชั่งอัจฉริยะอย่างต่อเนื่อง
                      </span>
                    )}
                  </div>
                </div>

                {/* Current Day Card */}
                <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px]">
                        วันที่ {comparisonData.daysTracked} (ล่าสุด)
                      </span>
                      <span>{new Date(comparisonData.latestDay.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    </div>
                    <div className="text-xs text-emerald-800 font-medium">ดัชนีมวลกายล่าสุด</div>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1">
                      {comparisonData.latestDay.bmi}{' '}
                      <span className="text-xs font-bold text-emerald-800">BMI</span>
                    </div>
                    <div className="inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white">
                      สถานะ: {comparisonData.latestDay.bmiCategory}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-emerald-200/90 grid grid-cols-2 gap-2 text-xs text-emerald-900 font-medium">
                    <div>
                      น้ำหนัก: <strong className="text-emerald-950">{comparisonData.latestDay.weightKg} kg</strong>
                    </div>
                    <div>
                      ส่วนสูง: <strong className="text-emerald-950">{comparisonData.latestDay.heightCm} cm</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* BMI Asia-Pacific Standard Reference Bar */}
              <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>เกณฑ์ดัชนีมวลกายมาตรฐานเอเชีย (Asia-Pacific BMI Standards)</span>
              <span className="text-slate-500 text-[11px]">เกณฑ์สมส่วน: 18.5 – 22.9</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              <div className="bg-sky-100 text-sky-900 p-2 rounded-xl border border-sky-200">
                <div className="font-mono">&lt; 18.5</div>
                <div className="text-[9px] font-medium text-sky-800">น้ำหนักต่ำกว่าเกณฑ์ (ผอม)</div>
              </div>
              <div className="bg-emerald-100 text-emerald-900 p-2 rounded-xl border border-emerald-200">
                <div className="font-mono">18.5 – 22.9</div>
                <div className="text-[9px] font-medium text-emerald-800">น้ำหนักตามเกณฑ์ (สมส่วน)</div>
              </div>
              <div className="bg-amber-100 text-amber-900 p-2 rounded-xl border border-amber-200">
                <div className="font-mono">23.0 – 24.9</div>
                <div className="text-[9px] font-medium text-amber-800 leading-tight">น้ำหนักมากกว่าเกณฑ์ (น้ำหนักเกิน)</div>
              </div>
              <div className="bg-orange-100 text-orange-900 p-2 rounded-xl border border-orange-200">
                <div className="font-mono">25.0 – 29.9</div>
                <div className="text-[9px] font-medium text-orange-800">โรคอ้วนระดับที่ 1</div>
              </div>
              <div className="bg-rose-100 text-rose-900 p-2 rounded-xl border border-rose-200">
                <div className="font-mono">30.0 ขึ้นไป</div>
                <div className="text-[9px] font-medium text-rose-800">โรคอ้วนระดับที่ 2</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DAY-BY-DAY CONTINUOUS TREND GRAPHS (กราฟแนวโน้มแต่ละวันบันทึกไปเรื่อยๆ) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>กราฟแนวโน้มแต่ละวันบันทึกต่อเนื่อง (Continuous Daily Progression)</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              กราฟแนวโน้มแต่ละวันบันทึกไปเรื่อยๆ ({records.length} วันที่บันทึก)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามทิศทางการเปลี่ยนแปลงของ BMI, น้ำหนักตัว, พลังงาน และคาร์โบไฮเดรตในแต่ละวันอย่างต่อเนื่อง
            </p>
          </div>

          {/* Chart Tab Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveChartTab('bmi');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'bmi'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>แนวโน้ม BMI</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveChartTab('weight');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'weight'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>น้ำหนัก (kg)</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveChartTab('kcal');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'kcal'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>พลังงาน (kcal)</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveChartTab('carbs');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'carbs'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Wheat className="w-3.5 h-3.5 text-amber-500" />
              <span>คาร์บ & น้ำตาล</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClickBeep();
                setActiveChartTab('glucose');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'glucose'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Droplet className="w-3.5 h-3.5 text-blue-500" />
              <span>น้ำตาลเช้า</span>
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
          {/* 1. BMI Trend Chart */}
          {activeChartTab === 'bmi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
                <span>แนวโน้มดัชนีมวลกายรายวัน (BMI Progress)</span>
                <span className="font-bold text-slate-700">
                  วันแรก: {comparisonData.firstDay?.bmi} ➔ ปัจจุบัน: {comparisonData.latestDay?.bmi} BMI
                </span>
              </div>

              <div className="h-60 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-200 overflow-x-auto">
                {records.map((r, idx) => {
                  const range = chartBounds.maxBmi - chartBounds.minBmi || 1;
                  const heightPercent = Math.max(20, Math.min(100, ((r.bmi - chartBounds.minBmi) / range) * 80 + 20));
                  const isLatest = idx === records.length - 1;
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleOpenEditModal(r)}
                      className="flex-1 min-w-[36px] max-w-[80px] flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                      title={`${r.dayLabel}: BMI ${r.bmi} (${r.bmiCategory}) - คลิกเพื่อแก้ไข`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                        {r.bmi}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all group-hover:brightness-95 ${
                          isLatest
                            ? 'bg-emerald-500 ring-2 ring-emerald-300 shadow-xs'
                            : isFirst
                            ? 'bg-blue-400 ring-2 ring-blue-200'
                            : 'bg-emerald-400 group-hover:bg-emerald-500'
                        }`}
                      />
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold truncate max-w-full">
                        {isFirst ? 'วันแรก' : isLatest ? 'ล่าสุด' : `D${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1">
                <span>วันแรกที่เริ่มบันทึก</span>
                <span className="text-emerald-700 font-bold">คลิกที่แท่งกราฟวันใดก็ได้เพื่อดูและแก้ไขประวัติ</span>
                <span>วันล่าสุด</span>
              </div>
            </div>
          )}

          {/* 2. Weight Trend Chart */}
          {activeChartTab === 'weight' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
                <span>แนวโน้มน้ำหนักตัวรายวัน (kg)</span>
                <span className="font-bold text-emerald-700">
                  สูงสุด {chartBounds.maxWeight} kg | ต่ำสุด {chartBounds.minWeight} kg
                </span>
              </div>

              <div className="h-60 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-200 overflow-x-auto">
                {records.map((r, idx) => {
                  const range = chartBounds.maxWeight - chartBounds.minWeight || 1;
                  const heightPercent = Math.max(20, Math.min(100, ((r.weightKg - chartBounds.minWeight) / range) * 80 + 20));
                  const isLatest = idx === records.length - 1;

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleOpenEditModal(r)}
                      className="flex-1 min-w-[36px] max-w-[80px] flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                      title={`${r.dayLabel}: ${r.weightKg} kg (BMI: ${r.bmi})`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700 group-hover:scale-110 transition-transform">
                        {r.weightKg}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all ${
                          isLatest
                            ? 'bg-emerald-500 ring-2 ring-emerald-300'
                            : 'bg-emerald-300 group-hover:bg-emerald-400'
                        }`}
                      />
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold truncate">
                        {idx === 0 ? 'วันแรก' : isLatest ? 'ล่าสุด' : `D${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Calories Trend */}
          {activeChartTab === 'kcal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
                <span>พลังงานอาหารที่ได้รับในแต่ละวันเทียบกับเป้าหมาย ({userProfile.targetDailyKcal || 1600} kcal)</span>
                <span className="font-bold text-orange-600">เฉลี่ย {statsSummary.avgKcal} kcal/วัน</span>
              </div>

              <div className="h-60 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-200 relative overflow-x-auto">
                <div
                  style={{
                    bottom: `${((userProfile.targetDailyKcal || 1600) / chartBounds.maxKcal) * 100}%`,
                  }}
                  className="absolute left-0 right-0 border-b-2 border-dashed border-orange-400/80 z-10 pointer-events-none flex items-center justify-end px-2"
                >
                  <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                    เป้าหมาย {userProfile.targetDailyKcal || 1600} kcal
                  </span>
                </div>

                {records.map((r, idx) => {
                  const heightPercent = Math.max(10, Math.min(100, (r.totalKcal / chartBounds.maxKcal) * 100));
                  const isOver = r.totalKcal > (userProfile.targetDailyKcal || 1600) * 1.1;

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleOpenEditModal(r)}
                      className="flex-1 min-w-[36px] max-w-[80px] flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                      title={`${r.dayLabel}: ${r.totalKcal} kcal`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700 group-hover:scale-110 transition-transform">
                        {r.totalKcal}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all ${
                          isOver ? 'bg-amber-400 group-hover:bg-amber-500' : 'bg-orange-400 group-hover:bg-orange-500'
                        }`}
                      />
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold truncate">
                        {idx === 0 ? 'วันแรก' : idx === records.length - 1 ? 'ล่าสุด' : `D${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Carbs & Sugar Trend */}
          {activeChartTab === 'carbs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
                <span>ปริมาณคาร์โบไฮเดรตและน้ำตาล (g) รายวัน</span>
                <span className="font-bold text-amber-600">เฉลี่ยคาร์บ {statsSummary.avgCarbs} g/วัน</span>
              </div>

              <div className="h-60 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-200 overflow-x-auto">
                {records.map((r, idx) => {
                  const carbHeight = Math.max(10, Math.min(100, (r.totalCarbsG / chartBounds.maxCarb) * 100));

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleOpenEditModal(r)}
                      className="flex-1 min-w-[36px] max-w-[80px] flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                      title={`${r.dayLabel}: คาร์บ ${r.totalCarbsG}g, น้ำตาล ${r.totalSugarG}g`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700">
                        {r.totalCarbsG}g
                      </span>
                      <div
                        style={{ height: `${carbHeight}%` }}
                        className="w-full rounded-t-xl bg-amber-400 group-hover:bg-amber-500 transition-all"
                      />
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold truncate">
                        {idx === 0 ? 'วันแรก' : idx === records.length - 1 ? 'ล่าสุด' : `D${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Fasting Glucose Trend */}
          {activeChartTab === 'glucose' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
                <span>ระดับน้ำตาลปลายนิ้วตอนเช้าก่อนอาหาร (Fasting Blood Glucose mg/dL)</span>
                <span className="font-bold text-blue-700">เกณฑ์เป้าหมายเบาหวาน: 80 - 130 mg/dL</span>
              </div>

              <div className="h-60 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-200 overflow-x-auto">
                {records.map((r, idx) => {
                  const hasGlucose = typeof r.fastingGlucoseMgDl === 'number' && r.fastingGlucoseMgDl > 0;
                  const glucoseVal = hasGlucose ? r.fastingGlucoseMgDl! : 0;
                  const range = Math.max(1, chartBounds.maxGlucose - chartBounds.minGlucose);
                  const heightPercent = hasGlucose
                    ? Math.max(20, Math.min(100, ((glucoseVal - chartBounds.minGlucose) / range) * 80 + 20))
                    : 12;

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleOpenEditModal(r)}
                      className="flex-1 min-w-[36px] max-w-[80px] flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                      title={`${r.dayLabel}: ${hasGlucose ? `${glucoseVal} mg/dL` : 'ยังไม่ได้ระบุ'}`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700">
                        {hasGlucose ? glucoseVal : '—'}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all ${
                          hasGlucose ? 'bg-blue-400 group-hover:bg-blue-500' : 'bg-slate-200 group-hover:bg-slate-300 border border-dashed border-slate-300'
                        }`}
                      />
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold truncate">
                        {idx === 0 ? 'วันแรก' : idx === records.length - 1 ? 'ล่าสุด' : `D${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: PROGRESS LOG TABLE (ตารางบันทึกความคืบหน้า) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>ตารางบันทึกความคืบหน้าอย่างละเอียด (Detailed Progress Diary Table)</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              ตารางบันทึกความคืบหน้าการรับประทานอาหาร & สุขภาพ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงบันทึกจริงทุกวันนับตั้งแต่วันแรกที่เริ่มใช้งาน สามารถคลิกดูเมนูอาหารหรือแก้ไขข้อมูลได้
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEditModal()}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มบันทึกวันใหม่</span>
            </button>
          </div>
        </div>

        {/* Detailed Table Format */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3.5 pl-4">วันที่ / ลำดับวัน</th>
                <th className="p-3.5">น้ำหนัก & ส่วนสูง</th>
                <th className="p-3.5">ดัชนีมวลกาย (BMI)</th>
                <th className="p-3.5">พลังงาน (kcal)</th>
                <th className="p-3.5">คาร์บ / น้ำตาล</th>
                <th className="p-3.5">น้ำตาลเช้า (FBS)</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5 text-right pr-4">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {records
                .slice()
                .reverse()
                .map((rec, rIdx) => {
                  const isExpanded = expandedDayId === rec.id;
                  const originalDayNum = records.length - rIdx;
                  const isFirst = originalDayNum === 1;

                  return (
                    <React.Fragment key={rec.id}>
                      <tr
                        onClick={() => setExpandedDayId(isExpanded ? null : rec.id)}
                        className={`cursor-pointer transition-colors ${
                          isFirst ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[11px] font-black text-slate-700">
                              {originalDayNum}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{new Date(rec.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                {isFirst && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[9px] font-bold">
                                    วันแรก
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{rec.dayLabel}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{rec.weightKg} kg</div>
                          <div className="text-[11px] text-slate-500">{rec.heightCm} cm</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{rec.bmi}</div>
                          <div className="text-[11px] text-emerald-700 font-medium">{rec.bmiCategory}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">
                            {rec.totalKcal > 0 ? `${rec.totalKcal} kcal` : '0 kcal (รอชั่งอาหาร)'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            เป้า {userProfile.targetDailyKcal || 1600} kcal
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">
                            {rec.totalCarbsG > 0 ? `${rec.totalCarbsG}g คาร์บ` : '0g คาร์บ'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {rec.totalSugarG > 0 ? `น้ำตาล ${rec.totalSugarG}g` : 'น้ำตาล 0g'}
                          </div>
                        </td>

                        <td className="p-3.5">
                          {rec.fastingGlucoseMgDl ? (
                            <span className="font-bold text-blue-700">{rec.fastingGlucoseMgDl} mg/dL</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              rec.complianceStatus === 'optimal'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {rec.complianceStatus === 'optimal' ? 'ปลอดภัย' : 'เฝ้าระวัง'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(rec);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลวันนั้น"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-slate-400">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Nested Row showing detailed meal items */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>รายละเอียดมื้ออาหารที่รับประทาน ({rec.meals.length} มื้อ)</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={onOpenMealBox}
                                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                                >
                                  + ชั่งอาหารเพิ่ม
                                </button>
                              </div>

                              {rec.meals.length === 0 ? (
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-400 text-center">
                                  ยังไม่มีการชั่งอาหารในวันนี้ สามารถกด "ชั่งมื้ออาหาร" เพื่อบันทึกมื้ออาหาร
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {rec.meals.map((m, mIdx) => (
                                    <div
                                      key={m.id || mIdx}
                                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                                    >
                                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span className="uppercase tracking-wider text-[10px] text-emerald-700">
                                          {m.mealType === 'breakfast'
                                            ? 'มื้อเช้า'
                                            : m.mealType === 'lunch'
                                            ? 'มื้อกลางวัน'
                                            : m.mealType === 'dinner'
                                            ? 'มื้อเย็น'
                                            : 'ของว่าง'}
                                        </span>
                                        <span className="text-slate-700">{m.weightG}g</span>
                                      </div>
                                      <div className="text-xs font-bold text-slate-900 truncate" title={m.mealName}>
                                        {m.mealName}
                                      </div>
                                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                                        <span>{m.kcal} kcal</span>
                                        <span>คาร์บ {m.carbsG}g</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {rec.notes && (
                                <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
                                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span><strong>บันทึกเพิ่มเติม:</strong> {rec.notes}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Edit / Add Record Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <Scale className="w-6 h-6 text-emerald-600 shrink-0" />
                <span className="text-xl sm:text-2xl font-black">บันทึกน้ำหนักประจำวัน</span>
              </h3>
              {editingRecord && records.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(editingRecord.id)}
                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="ลบบันทึกวันนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {editingRecord ? `วันที่: ${editingRecord.dayLabel} (${editingRecord.date})` : 'ระบุวันที่และข้อมูลสถิติสุขภาพ'}
            </p>

            <form onSubmit={handleSaveEditRecord} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันที่บันทึก (Date)</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">น้ำหนักตัว (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    required
                    placeholder="เช่น 68.0"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">ระบุน้ำหนักจริง</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ส่วนสูง (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="250"
                    required
                    placeholder="เช่น 165"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">ระบุส่วนสูงจริง</p>
                </div>
              </div>

              {/* Live Auto-Calculated BMI Banner */}
              {(() => {
                const w = parseFloat(editWeight) || 0;
                const h = parseFloat(editHeight) || 0;
                const evalResult = calculateBmi(w, h);
                return (
                  <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${evalResult.bgColor} ${evalResult.borderColor}`}>
                    <div>
                      <span className="text-slate-600 block text-[10px] font-bold">
                        ดัชนีมวลกายคำนวณอัตโนมัติ (Live BMI):
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {evalResult.bmi > 0 ? `${evalResult.bmi} kg/m²` : 'รอระบุน้ำหนักและส่วนสูง'}
                      </span>
                    </div>
                    {evalResult.bmi > 0 && (
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${evalResult.badgeColor}`}>
                        {evalResult.category}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Meal & Eating Stats: Calories & Carbs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">พลังงานอาหาร (kcal)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="5000"
                    placeholder="0"
                    value={editKcal}
                    onChange={(e) => setEditKcal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">พลังงานรวมทั้งวัน</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">คาร์โบไฮเดรต (g)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="1000"
                    placeholder="0"
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">คาร์บรวมทั้งวัน</p>
                </div>
              </div>

              {/* Sugar & Fasting Glucose */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">น้ำตาล (g) - ไม่บังคับ</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="500"
                    placeholder="0"
                    value={editSugar}
                    onChange={(e) => setEditSugar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    น้ำตาลตอนเช้า (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="500"
                    placeholder="เช่น 110"
                    value={editFastingGlucose}
                    onChange={(e) => setEditFastingGlucose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">บันทึกเพิ่มเติม / เมนูที่ทาน</label>
                <textarea
                  rows={2}
                  placeholder="เช่น มื้อเช้าข้าวต้มปลา มื้อกลางวันสลัดไก่ย่าง ดื่มน้ำ 2 ลิตร"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Baseline Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">รีเซ็ตสถิติ 14 วัน?</h3>
              <p className="text-xs text-slate-500">
                เลือกรูปแบบการรีเซ็ตข้อมูลสถิติสุขภาพและการกิน
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleClearAllRecords}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
              >
                ล้างประวัติทั้งหมด (เริ่มสะสมใหม่จาก 0 วัน)
              </button>
              <button
                type="button"
                onClick={handleResetToDay1}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                เริ่มนับจากวันแรกใหม่ (Day 1)
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="w-full px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
