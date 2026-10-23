import { ActivityLevel } from '../types';

// Helper utility for BMI calculation and Asian-Pacific criteria

export interface BmiEvaluation {
  bmi: number;
  level: 1 | 2 | 3 | 4 | 5;
  category: string;
  categoryShort: string;
  badgeColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  advice: string;
}

export const BMI_LEVELS_DEFINITION = [
  {
    level: 1,
    rangeText: 'น้อยกว่า 18.5',
    category: 'น้ำหนักต่ำกว่าเกณฑ์ (ผอม)',
    categoryShort: 'ผอม',
    textColor: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    advice: 'ควรได้รับพลังงานและสารอาหารให้เพียงพอ เน้นโปรตีนคุณภาพดีเพื่อเสริมสร้างกล้ามเนื้อและภูมิคุ้มกัน',
  },
  {
    level: 2,
    rangeText: '18.5 – 22.9',
    category: 'น้ำหนักตามเกณฑ์ (สมส่วน)',
    categoryShort: 'สมส่วน',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    advice: 'ยอดเยี่ยม! ดัชนีมวลกายอยู่ในเกณฑ์มาตรฐานสมส่วน แนะนำรักษาสัดส่วนอาหาร 2:1:1 และออกกำลังกายสม่ำเสมอ',
  },
  {
    level: 3,
    rangeText: '23.0 – 24.9',
    category: 'น้ำหนักมากกว่าเกณฑ์ (น้ำหนักเกิน) เริ่มมีความเสี่ยงต่อโรคเรื้อรัง',
    categoryShort: 'น้ำหนักเกิน (เริ่มเสี่ยง)',
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    advice: 'เริ่มมีความเสี่ยงต่อโรคเรื้อรังและภาวะดื้ออินซูลิน แนะนำลดอาหารหวาน มัน เค็ม และควบคุมคาร์โบไฮเดรตในแต่ละมื้อ',
  },
  {
    level: 4,
    rangeText: '25.0 – 29.9',
    category: 'โรคอ้วนระดับที่ 1',
    categoryShort: 'อ้วนระดับ 1',
    textColor: 'text-orange-800',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    advice: 'มีความเสี่ยงต่อโรคเบาหวาน ความดันโลหิตสูง และไขมันในเลือดสูง ควรใช้กล่องอาหารจำกัดคาร์บและเพิ่มผักใบเขียว',
  },
  {
    level: 5,
    rangeText: '30.0 ขึ้นไป',
    category: 'โรคอ้วนระดับที่ 2',
    categoryShort: 'อ้วนระดับ 2',
    textColor: 'text-rose-800',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    advice: 'อยู่ในเกณฑ์อันตรายสูงต่อภาวะแทรกซ้อนของโรคเรื้อรัง แนะนำปรับเปลี่ยนพฤติกรรมการกินอย่างจริงจังและปรึกษาแพทย์',
  },
];

export function calculateBmi(weightKg: number, heightCm: number): BmiEvaluation {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return {
      bmi: 0,
      level: 2,
      category: 'รอระบุข้อมูล',
      categoryShort: 'รอระบุข้อมูล',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      advice: 'กรุณาระบุน้ำหนักและส่วนสูงเพื่อคำนวณดัชนีมวลกายอัตโนมัติ',
    };
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM || 1);
  const bmi = parseFloat(rawBmi.toFixed(1));

  if (bmi < 18.5) {
    const def = BMI_LEVELS_DEFINITION[0];
    return { bmi, ...def, level: 1 };
  } else if (bmi >= 18.5 && bmi < 23.0) {
    const def = BMI_LEVELS_DEFINITION[1];
    return { bmi, ...def, level: 2 };
  } else if (bmi >= 23.0 && bmi < 25.0) {
    const def = BMI_LEVELS_DEFINITION[2];
    return { bmi, ...def, level: 3 };
  } else if (bmi >= 25.0 && bmi < 30.0) {
    const def = BMI_LEVELS_DEFINITION[3];
    return { bmi, ...def, level: 4 };
  } else {
    const def = BMI_LEVELS_DEFINITION[4];
    return { bmi, ...def, level: 5 };
  }
}

// --------------------------------------------------------------------------
// การคำนวณพลังงานที่ต้องการต่อวัน (EER - Estimated Energy Requirement)
// สูตร National Academies (2023)
// --------------------------------------------------------------------------

export interface ActivityOption {
  id: ActivityLevel;
  label: string;
  icon: string;
  desc: string;
  paFemale: number;
  paMale: number;
}

export const ACTIVITY_LEVELS: ActivityOption[] = [
  {
    id: 'sedentary',
    label: 'น้อยมาก/ไม่ค่อยเคลื่อนไหว',
    icon: '🛋️',
    desc: 'นั่งทำงานอยู่กับที่ ไม่ค่อยออกกำลังกาย',
    paFemale: 1.00,
    paMale: 1.00,
  },
  {
    id: 'light',
    label: 'กิจกรรมเล็กน้อย',
    icon: '🚶',
    desc: 'เดินไปมา ทำงานบ้าน ออกกำลังกายเบาๆ',
    paFemale: 1.12,
    paMale: 1.11,
  },
  {
    id: 'moderate',
    label: 'กิจกรรมปานกลาง',
    icon: '🏃',
    desc: 'เดินเร็ว วิ่ง หรือออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์',
    paFemale: 1.27,
    paMale: 1.25,
  },
  {
    id: 'heavy',
    label: 'กิจกรรมมาก',
    icon: '🏋️',
    desc: 'ออกกำลังกายหนัก ใช้แรงกายมาก หรือเล่นกีฬาเกือบทุกวัน',
    paFemale: 1.45,
    paMale: 1.48,
  },
];

export interface EerCalculationResult {
  eer: number; // kcal/day
  perMealKcal: number; // kcal/มื้อ (เฉลี่ย 3 มื้อ)
  minMealKcal: number;
  maxMealKcal: number;
  paValue: number;
  activityLabel: string;
  activityIcon: string;
  genderLabel: string;
  summaryText: string;
  formulaDetails: string;
}

// --------------------------------------------------------------------------
// การคำนวณพลังงานพื้นฐานของร่างกาย (BMR - Basal Metabolic Rate)
// ผู้ชาย: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) + 5
// ผู้หญิง: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) − 161
// --------------------------------------------------------------------------

export interface BmrCalculationResult {
  bmr: number; // kcal/วัน
  perMealKcal: number; // kcal/มื้อ (~1/3)
  minMealKcal: number;
  maxMealKcal: number;
  genderLabel: string;
  summaryText: string;
  formulaDetails: string;
}

export function calculateBmr(
  gender: 'female' | 'male' | 'other',
  age: number,
  weightKg: number,
  heightCm: number
): BmrCalculationResult {
  const w = weightKg > 0 ? weightKg : 60;
  const a = age > 0 ? age : 40;
  const h = heightCm > 0 ? heightCm : 165;
  const isFemale = gender === 'female';

  let rawBmr = 0;
  let formulaDetails = '';

  if (isFemale) {
    // ผู้หญิง: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) − 161
    rawBmr = 10 * w + 6.25 * h - 5 * a - 161;
    formulaDetails = `(10 × ${w}) + (6.25 × ${h}) − (5 × ${a}) − 161`;
  } else {
    // ผู้ชาย: BMR = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) + 5
    rawBmr = 10 * w + 6.25 * h - 5 * a + 5;
    formulaDetails = `(10 × ${w}) + (6.25 × ${h}) − (5 × ${a}) + 5`;
  }

  const bmr = Math.max(800, Math.round(rawBmr));
  const perMealKcal = Math.round(bmr / 3);
  const minMealKcal = Math.round(bmr * 0.28);
  const maxMealKcal = Math.round(bmr * 0.36);
  const genderLabel = isFemale ? 'หญิง' : 'ชาย';
  const summaryText = `เพศ${genderLabel} อายุ ${a} ปี น้ำหนัก ${w} kg ส่วนสูง ${h} cm`;

  return {
    bmr,
    perMealKcal,
    minMealKcal,
    maxMealKcal,
    genderLabel,
    summaryText,
    formulaDetails,
  };
}

// Backward compatibility alias
export function calculateEer(
  gender: 'female' | 'male' | 'other',
  age: number,
  weightKg: number,
  heightCm: number,
  _activityLevel?: ActivityLevel
): EerCalculationResult {
  const res = calculateBmr(gender, age, weightKg, heightCm);
  return {
    eer: res.bmr,
    perMealKcal: res.perMealKcal,
    minMealKcal: res.minMealKcal,
    maxMealKcal: res.maxMealKcal,
    paValue: 1.0,
    activityLabel: 'BMR พื้นฐาน',
    activityIcon: '🎯',
    genderLabel: res.genderLabel,
    summaryText: res.summaryText,
    formulaDetails: res.formulaDetails,
  };
}
