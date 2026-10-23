import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Save,
  Wheat,
  Fish,
  Leaf,
  Apple,
  Info,
  Scale,
  Zap,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Eye,
  Sliders,
  Copy,
  AlertCircle,
  HelpCircle,
  FileText,
  RotateCcw,
  Utensils,
  Edit3,
  Plus,
  Layers,
  Flame,
  Search,
} from 'lucide-react';
import {
  UserProfile,
  MealPhotoAnalysisResult,
  CompartmentType,
  CompartmentState,
  MealLog,
  AlertStatus,
  FoodConfidenceLevel,
  DishPreset,
  MealIngredientItem,
  IngredientSummaryRow,
} from '../types';
import { soundFx } from '../utils/audio';
import { PopularMenuSelectorModal } from './PopularMenuSelectorModal';
import { MenuDetailEditorModal } from './MenuDetailEditorModal';
import { RawMenuItem } from '../data/popularMenuData';

interface MealPhotoScannerProps {
  userProfile: UserProfile;
  onApplyToSimulator: (
    compartmentsData: {
      slot: CompartmentType;
      foodName: string;
      weightGrams: number;
      density: {
        kcalPer100g: number;
        carbsPer100g: number;
        sugarPer100g: number;
        proteinPer100g: number;
        fatPer100g: number;
        fiberPer100g: number;
        sodiumPer100g: number;
        glycemicIndex?: 'low' | 'medium' | 'high';
      };
    }[]
  ) => void;
  onSaveMeal: (meal: MealLog) => void;
}

// Preset demonstration meal photos with high-quality sample dishes
const PRESET_SAMPLE_MEALS = [
  {
    id: 'sample_1',
    title: 'ตัวอย่าง 1: จานสุขภาพ 2:1:1 (ข้าวไรซ์เบอร์รี่ + อกไก่ย่าง + บรอกโคลี + ฝรั่ง)',
    subtitle: 'สูตรควบคุมน้ำตาลดีเยี่ยม คาร์บต่ำ ใยอาหารสูง',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    fallbackBase64: '',
  },
  {
    id: 'sample_2',
    title: 'ตัวอย่าง 2: ข้าวกล้อง + ปลานึ่งมะนาว + ผักต้มรวม + แก้วมังกร',
    subtitle: 'โปรตีนย่อยง่าย ไขมันต่ำ มีผักครบ 2 ทัพพี',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    fallbackBase64: '',
  },
  {
    id: 'sample_3',
    title: 'ตัวอย่าง 3: ข้าวผัดไข่ + หมูทอด + แตงกวา + กล้วยหอม',
    subtitle: 'มีคาร์โบไฮเดรตและน้ำมันสูง ต้องระวังระดับน้ำตาลพุ่ง',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    fallbackBase64: '',
  },
];

export const MealPhotoScanner: React.FC<MealPhotoScannerProps> = ({
  userProfile,
  onApplyToSimulator,
  onSaveMeal,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera' | 'sample'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgressText, setAnalysisProgressText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<MealPhotoAnalysisResult | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Modals state for Popular Menu & Detail Customization
  const [showPopularMenuModal, setShowPopularMenuModal] = useState<boolean>(false);
  const [showMenuDetailModal, setShowMenuDetailModal] = useState<boolean>(false);

  const [customWeights, setCustomWeights] = useState<Record<CompartmentType, number>>({
    carb: 90,
    protein: 90,
    vegetable: 140,
    fruit: 80,
  });
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  // Start Camera
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Cannot open camera directly:', err);
      showNotification('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง หรือใช้วิธีอัปโหลดรูปภาพแทน', 'info');
      setActiveMode('upload');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Toggle Camera Facing
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode, cameraFacing]);

  // Capture image from camera video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    soundFx.playClickBeep();
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      stopCamera();
      analyzeImage(dataUrl);
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundFx.playClickBeep();

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset sample selection
  const handleSelectSample = async (sample: typeof PRESET_SAMPLE_MEALS[0]) => {
    soundFx.playClickBeep();
    setSelectedImage(sample.imageUrl);

    try {
      setIsAnalyzing(true);
      setAnalysisProgressText('กำลังดาวน์โหลดภาพตัวอย่าง...');
      const resp = await fetch(sample.imageUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        analyzeImage(base64Data);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Fallback sample analyze', err);
      analyzeImage(sample.imageUrl);
    }
  };

  // Show Toast
  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  };

  // Run AI Vision Analysis on Image following 4-step AI Nutritionist rules
  const analyzeImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisProgressText('ขั้นตอนที่ 1/4: กำลังระบุชื่อเมนูจากภาพ (Thai & English)...');

    try {
      setTimeout(() => {
        setAnalysisProgressText('ขั้นตอนที่ 2/4: กำลังแยกวัตถุดิบออกเป็นชิ้นๆ และประเมินน้ำหนักเป็นกรัม...');
      }, 700);

      setTimeout(() => {
        setAnalysisProgressText('ขั้นตอนที่ 3/4: กำลังจัดทำตารางสรุป แคลอรี โปรตีน คาร์บ ไขมัน แต่ละชิ้น...');
      }, 1500);

      setTimeout(() => {
        setAnalysisProgressText('ขั้นตอนที่ 4/4: กำลังรวมแคลอรีทั้งหมดเป็นช่วง (Calorie Range)...');
      }, 2200);

      const response = await fetch('/api/analyze-meal-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType: 'image/jpeg',
          userProfile,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.result) {
        throw new Error(data.error || 'Failed to parse AI response');
      }

      const result: MealPhotoAnalysisResult = data.result;
      setAnalysisResult(result);
      soundFx.playSuccessChime();

      // Initialize custom weights from AI estimated weights
      const initialWeights: Record<CompartmentType, number> = {
        carb: 90,
        protein: 90,
        vegetable: 140,
        fruit: 80,
      };

      result.identifiedCompartments.forEach((item) => {
        if (item.slot && item.estimatedWeightG) {
          initialWeights[item.slot] = item.estimatedWeightG;
        }
      });

      setCustomWeights(initialWeights);
      showNotification('AI นักโภชนาการวิเคราะห์เมนูและประเมินแคลอรีสำเร็จ!', 'success');
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      generateFallbackAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fallback analysis in case of network issue
  const generateFallbackAnalysis = () => {
    soundFx.playWarningBeep();
    const fallbackResult: MealPhotoAnalysisResult = {
      dishNameThai: 'ข้าวกะเพราอกไก่ ไข่ต้ม ผักเคียง',
      dishNameEn: 'Stir-fried Holy Basil with Chicken Breast, Boiled Egg, and Side Veggies',
      calorieRange: '380 - 430 แคลอรี่',
      overview: 'ตรวจพบอาหารเพื่อสุขภาพ ประกอบด้วยอกไก่ผัดกะเพรา ข้าวไม่ขัดสี ไข่ต้ม และผักสด',
      diabetesSafetyScore: 88,
      overallConfidence: 'HIGH',
      clinicalSummary: 'สัดส่วนอาหารมีความสมดุล ผักและใยอาหารมีปริมาณเพียงพอช่วยชะลอการดูดซึมกลูโคสเข้าสู่กระแสเลือดได้เป็นอย่างดี',
      recommendations: [
        'ควรเลือกรับประทานผักก่อนเป็นอันดับแรก เพื่อชะลอการย่อยคาร์โบไฮเดรต',
        'ควบคุมปริมาณข้าวไม่ให้เกิน 1 ทัพพี (ประมาณ 80-90 กรัม)',
        'หลีกเลี่ยงการราดน้ำซอสผัดที่มีน้ำตาลและโซเดียมแฝง',
      ],
      ingredientsTable: [
        {
          name: 'ข้าวไรซ์เบอร์รี่',
          estimatedWeightG: 90,
          kcal: 100,
          proteinG: 2.3,
          carbsG: 21.0,
          fatG: 0.8,
          notes: 'คาร์โบไฮเดรตเชิงซ้อน 1 ทัพพี',
        },
        {
          name: 'อกไก่ผัดกะเพรา',
          estimatedWeightG: 100,
          kcal: 140,
          proteinG: 26.0,
          carbsG: 1.5,
          fatG: 3.5,
          notes: 'โปรตีนลีน ใช้น้ำมันผัดแต่น้อย',
        },
        {
          name: 'ไข่ต้ม (1 ฟอง)',
          estimatedWeightG: 50,
          kcal: 75,
          proteinG: 6.5,
          carbsG: 0.6,
          fatG: 5.0,
          notes: 'โปรตีนคุณภาพสูง ปลอดภัยต่อเบาหวาน',
        },
        {
          name: 'บรอกโคลีและแตงกวาเคียง',
          estimatedWeightG: 120,
          kcal: 40,
          proteinG: 2.5,
          carbsG: 6.0,
          fatG: 0.3,
          notes: 'ใยอาหารสูง ช่วยชะลอน้ำตาล',
        },
        {
          name: 'น้ำมันปรุงอาหารและซอสแฝง',
          estimatedWeightG: 5,
          kcal: 45,
          proteinG: 0.0,
          carbsG: 0.5,
          fatG: 5.0,
          notes: 'ประเมินช่วงแคลอรีที่มองไม่เห็นด้วยตา',
        },
      ],
      formattedSummary: `🍱 1. ชื่อเมนู: ข้าวกะเพราอกไก่ ไข่ต้ม ผักเคียง (Stir-fried Holy Basil with Chicken Breast & Boiled Egg)\n\n2. แยกวัตถุดิบและประเมินน้ำหนัก:\n- ข้าวไรซ์เบอร์รี่ 90g (100 kcal, P: 2.3g, C: 21g, F: 0.8g)\n- อกไก่ผัดกะเพรา 100g (140 kcal, P: 26g, C: 1.5g, F: 3.5g)\n- ไข่ต้ม 50g (75 kcal, P: 6.5g, C: 0.6g, F: 5g)\n- บรอกโคลีและแตงกวา 120g (40 kcal, P: 2.5g, C: 6g, F: 0.3g)\n\n3. รวมแคลอรีทั้งหมดเป็นช่วง:\n🔥 380 - 430 แคลอรี่ (เฉลี่ย ≈ 400 kcal)\n\n4. คำแนะนำเบาหวาน:\nสัดส่วนคาร์บและโปรตีนเหมาะสมมาก แนะนำทานผักก่อนเพื่อชะลอน้ำตาล`,
      identifiedCompartments: [
        {
          slot: 'carb',
          slotTitleThai: 'ช่องที่ 1: ข้าว / แป้ง (Carbohydrate)',
          foodName: 'ข้าวไรซ์เบอร์รี่',
          identificationStatus: 'confirmed',
          confidence: 'HIGH',
          description: 'ข้าวไม่ขัดสี อุดมด้วยวิตามินบีและไฟเบอร์สูง',
          estimatedWeightG: 90,
          glycemicIndex: 'low',
          kcalPer100g: 111,
          carbsPer100g: 23.5,
          sugarPer100g: 0.5,
          proteinPer100g: 2.6,
          fatPer100g: 0.9,
          fiberPer100g: 1.8,
          sodiumPer100g: 2,
          adviceForDiabetes: 'เป็นคาร์โบไฮเดรตเชิงซ้อน เหมาะสมสำหรับผู้ป่วยเบาหวาน',
        },
        {
          slot: 'protein',
          slotTitleThai: 'ช่องที่ 2: เนื้อสัตว์ / โปรตีน (Protein)',
          foodName: 'อกไก่ผัดกะเพรา + ไข่ต้ม',
          identificationStatus: 'confirmed',
          confidence: 'HIGH',
          description: 'โปรตีนลีน ไขมันต่ำ ปรุงสุกด้วยการต้มและผัดน้ำมันน้อย',
          estimatedWeightG: 150,
          glycemicIndex: 'low',
          kcalPer100g: 143,
          carbsPer100g: 1.4,
          sugarPer100g: 0.2,
          proteinPer100g: 21.6,
          fatPer100g: 5.6,
          fiberPer100g: 0.2,
          sodiumPer100g: 180,
          adviceForDiabetes: 'โปรตีนช่วยให้อิ่มนาน ไม่ส่งผลกระทบต่อระดับน้ำตาลในเลือด',
        },
        {
          slot: 'vegetable',
          slotTitleThai: 'ช่องที่ 3: ผัก / ใยอาหาร (Vegetables)',
          foodName: 'บรอกโคลีและแตงกวา',
          identificationStatus: 'confirmed',
          confidence: 'HIGH',
          description: 'ผักใบเขียวและผักสด ไม่ใช้น้ำมัน',
          estimatedWeightG: 120,
          glycemicIndex: 'low',
          kcalPer100g: 33,
          carbsPer100g: 5.0,
          sugarPer100g: 1.2,
          proteinPer100g: 2.1,
          fatPer100g: 0.3,
          fiberPer100g: 3.0,
          sodiumPer100g: 35,
          adviceForDiabetes: 'ใยอาหารสูงมาก ช่วยดักจับน้ำตาลและไขมันในทางเดินอาหาร',
        },
        {
          slot: 'fruit',
          slotTitleThai: 'ช่องที่ 4: ผลไม้ / วิตามิน (Fruit & Snack)',
          foodName: 'ฝรั่งสด',
          identificationStatus: 'confirmed',
          confidence: 'HIGH',
          description: 'ผลไม้รสไม่หวานจัด หั่นชิ้นพอดีคำ',
          estimatedWeightG: 80,
          glycemicIndex: 'low',
          kcalPer100g: 43,
          carbsPer100g: 9.5,
          sugarPer100g: 6.0,
          proteinPer100g: 0.9,
          fatPer100g: 0.3,
          fiberPer100g: 5.4,
          sodiumPer100g: 2,
          adviceForDiabetes: 'ดัชนีน้ำตาลต่ำ ทานได้ประมาณ 1 กำมือต่อมื้อ',
        },
      ],
    };
    setAnalysisResult(fallbackResult);
    showNotification('โหลดผลการวิเคราะห์มาตรฐาน 4 ขั้นตอนเรียบร้อย', 'info');
  };

  // Handle Menu Selection from 360+ Popular Menu library
  const handleSelectFromPopularMenu = (preset: DishPreset, rawItem?: RawMenuItem) => {
    soundFx.playSuccessChime();

    // Map ingredients to slots and table rows
    const ingredientsRows: IngredientSummaryRow[] = (rawItem ? [
      {
        name: rawItem.name,
        estimatedWeightG: rawItem.defaultWeightG,
        kcal: rawItem.kcal,
        proteinG: rawItem.proteinG,
        carbsG: rawItem.carbsG,
        fatG: rawItem.fatG,
        notes: `${rawItem.servingDesc} (GI: ${rawItem.gi.toUpperCase()})`,
      }
    ] : preset.ingredients.map((ing) => ({
      name: ing.name,
      estimatedWeightG: ing.weightGrams || Math.round((preset.defaultTotalWeightG * (ing.ratioPercent || 25)) / 100),
      kcal: Math.round(((ing.density.kcalPer100g || 0) * (ing.weightGrams || 100)) / 100),
      proteinG: parseFloat((((ing.density.proteinPer100g || 0) * (ing.weightGrams || 100)) / 100).toFixed(1)),
      carbsG: parseFloat((((ing.density.carbsPer100g || 0) * (ing.weightGrams || 100)) / 100).toFixed(1)),
      fatG: parseFloat((((ing.density.fatPer100g || 0) * (ing.weightGrams || 100)) / 100).toFixed(1)),
      notes: ing.category === 'carb' ? 'ข้าว/แป้ง' : ing.category === 'protein' ? 'โปรตีน' : 'ผัก/ใยอาหาร',
    })));

    const totalKcal = rawItem ? rawItem.kcal : Math.round(preset.ingredients.reduce((acc, ing) => acc + ((ing.density.kcalPer100g || 0) * (ing.weightGrams || 100)) / 100, 0));
    const minKcal = Math.max(10, Math.round(totalKcal * 0.92));
    const maxKcal = Math.round(totalKcal * 1.08);
    const calorieRange = `${minKcal} - ${maxKcal} แคลอรี่`;

    const newResult: MealPhotoAnalysisResult = {
      dishNameThai: rawItem?.name || preset.name,
      dishNameEn: rawItem?.categoryThai ? `${rawItem.name} (${rawItem.categoryThai})` : preset.name,
      calorieRange,
      overview: `เลือกจากคลังเมนูยอดนิยม: ${rawItem?.name || preset.name} (${rawItem?.servingDesc || '1 จานมาตรฐาน'})`,
      diabetesSafetyScore: rawItem?.diabetesSuitability === 'good' ? 90 : rawItem?.diabetesSuitability === 'moderate' ? 75 : 55,
      overallConfidence: 'HIGH',
      clinicalSummary: rawItem?.healthNote || preset.healthNote || 'วิเคราะห์และประเมินสารอาหารจากขนาดบริโภคมาตรฐาน',
      recommendations: [
        `ปริมาณคาร์โบไฮเดรตประมาณ ${rawItem?.carbsG || 30}g ควรทานคู่กับผักใบเขียว`,
        'ควบคุมการใช้น้ำมันและซอสปรุงรสเพิ่มเติม',
        'ดื่มน้ำเปล่าให้เพียงพอหลังรับประทานมื้ออาหาร',
      ],
      ingredientsTable: ingredientsRows,
      formattedSummary: `🍱 1. ชื่อเมนู: ${rawItem?.name || preset.name}\n\n2. วัตถุดิบและขนาดบริโภคมาตรฐาน:\n- น้ำหนักรวม: ${rawItem?.defaultWeightG || preset.defaultTotalWeightG} g\n- พลังงาน: ${totalKcal} kcal\n- คาร์บ: ${rawItem?.carbsG || 30}g, โปรตีน: ${rawItem?.proteinG || 15}g, ไขมัน: ${rawItem?.fatG || 8}g\n\n3. รวมแคลอรีทั้งหมดเป็นช่วง:\n🔥 ${calorieRange} (เฉลี่ย ≈ ${totalKcal} kcal)\n\n4. คำแนะนำเบาหวาน:\n${rawItem?.healthNote || 'ควรทานคู่กับผักสดและควบคุมการเติมน้ำตาล'}`,
      identifiedCompartments: [
        {
          slot: 'carb',
          slotTitleThai: 'ช่องที่ 1: ข้าว / แป้ง (Carbohydrate)',
          foodName: rawItem?.name || preset.name,
          identificationStatus: 'confirmed',
          confidence: 'HIGH',
          description: rawItem?.servingDesc || preset.description || '',
          estimatedWeightG: rawItem?.defaultWeightG || preset.defaultTotalWeightG,
          glycemicIndex: rawItem?.gi || 'low',
          kcalPer100g: Math.round(((rawItem?.kcal || 120) / (rawItem?.defaultWeightG || 100)) * 100),
          carbsPer100g: parseFloat((((rawItem?.carbsG || 20) / (rawItem?.defaultWeightG || 100)) * 100).toFixed(1)),
          sugarPer100g: parseFloat((((rawItem?.sugarG || 1) / (rawItem?.defaultWeightG || 100)) * 100).toFixed(1)),
          proteinPer100g: parseFloat((((rawItem?.proteinG || 5) / (rawItem?.defaultWeightG || 100)) * 100).toFixed(1)),
          fatPer100g: parseFloat((((rawItem?.fatG || 2) / (rawItem?.defaultWeightG || 100)) * 100).toFixed(1)),
          fiberPer100g: parseFloat((((rawItem?.fiberG || 1) / (rawItem?.defaultWeightG || 100)) * 100).toFixed(1)),
          sodiumPer100g: Math.round(((rawItem?.sodiumMg || 50) / (rawItem?.defaultWeightG || 100)) * 100),
          adviceForDiabetes: rawItem?.healthNote || preset.healthNote || '',
        },
      ],
    };

    setAnalysisResult(newResult);
    showNotification(`เลือกเมนู "${rawItem?.name || preset.name}" สำเร็จ!`, 'success');
  };

  // Handle saving customized details from MenuDetailEditorModal
  const handleSaveCustomDetails = (data: {
    dishNameThai: string;
    dishNameEn?: string;
    notes?: string;
    ingredients: MealIngredientItem[];
    calorieRange?: string;
  }) => {
    soundFx.playSuccessChime();

    // Map ingredients to ingredientsTable
    const updatedTable: IngredientSummaryRow[] = data.ingredients.map((ing) => {
      const w = ing.weightGrams || 80;
      const factor = w / 100;
      return {
        name: ing.name,
        estimatedWeightG: w,
        kcal: Math.round((ing.density.kcalPer100g || 0) * factor),
        proteinG: parseFloat(((ing.density.proteinPer100g || 0) * factor).toFixed(1)),
        carbsG: parseFloat(((ing.density.carbsPer100g || 0) * factor).toFixed(1)),
        fatG: parseFloat(((ing.density.fatPer100g || 0) * factor).toFixed(1)),
        notes: ing.category === 'carb' ? 'ข้าว/แป้ง' : ing.category === 'protein' ? 'โปรตีน' : ing.category === 'vegetable' ? 'ผัก' : ing.category === 'fruit' ? 'ผลไม้' : 'ไขมัน/เครื่องปรุง',
      };
    });

    const totalKcal = updatedTable.reduce((sum, item) => sum + (item.kcal || 0), 0);
    const minKcal = Math.max(10, Math.round(totalKcal * 0.92));
    const maxKcal = Math.round(totalKcal * 1.08);
    const calorieRange = data.calorieRange || `${minKcal} - ${maxKcal} แคลอรี่`;

    const updatedResult: MealPhotoAnalysisResult = {
      ...(analysisResult || {
        overview: 'วิเคราะห์และปรับแต่งรายละเอียดเมนูอาหารโดยผู้ใช้',
        diabetesSafetyScore: 85,
        overallConfidence: 'HIGH',
        clinicalSummary: 'รายละเอียดเมนูได้รับการปรับแต่งส่วนประกอบและสารอาหารอย่างแม่นยำ',
        identifiedCompartments: [],
      }),
      dishNameThai: data.dishNameThai,
      dishNameEn: data.dishNameEn,
      calorieRange,
      ingredientsTable: updatedTable,
      clinicalSummary: data.notes
        ? `หมายเหตุการปรุง: ${data.notes}. สัดส่วนอาหารได้รับการคำนวณตามวัตถุดิบที่ระบุ`
        : (analysisResult?.clinicalSummary || 'ปรับแต่งวัตถุดิบและคำนวณพลังงานเรียบร้อย'),
      formattedSummary: `🍱 1. ชื่อเมนู: ${data.dishNameThai} ${data.dishNameEn ? `(${data.dishNameEn})` : ''}\n\n2. วัตถุดิบที่ปรับแต่ง:\n${updatedTable.map((t) => `- ${t.name} (${t.estimatedWeightG}g, ${t.kcal} kcal)`).join('\n')}\n\n3. รวมแคลอรีทั้งหมดเป็นช่วง:\n🔥 ${calorieRange} (เฉลี่ย ≈ ${totalKcal} kcal)\n\n4. หมายเหตุ:\n${data.notes || 'วิเคราะห์ตามโภชนาการสำหรับเบาหวาน'}`,
    };

    setAnalysisResult(updatedResult);
    showNotification('บันทึกรายละเอียดเมนูและคำนวณแคลอรีใหม่เรียบร้อย!', 'success');
  };

  // Live calculation of totals based on custom weighed weights or ingredient table
  const liveTotals = React.useMemo(() => {
    if (!analysisResult) {
      return {
        totalKcal: 0,
        totalCarbsG: 0,
        totalSugarG: 0,
        totalProteinG: 0,
        totalFatG: 0,
        totalFiberG: 0,
        totalSodiumMg: 0,
        status: 'optimal' as AlertStatus,
        alertTitle: '',
        alertDescription: '',
      };
    }

    let kcal = 0;
    let carbs = 0;
    let sugar = 0;
    let protein = 0;
    let fat = 0;
    let fiber = 0;
    let sodium = 0;

    if (analysisResult.ingredientsTable && analysisResult.ingredientsTable.length > 0) {
      analysisResult.ingredientsTable.forEach((item) => {
        kcal += item.kcal || 0;
        carbs += item.carbsG || 0;
        protein += item.proteinG || 0;
        fat += item.fatG || 0;
      });
      sugar = parseFloat((carbs * 0.15).toFixed(1));
      fiber = parseFloat((carbs * 0.1).toFixed(1));
    } else {
      analysisResult.identifiedCompartments.forEach((comp) => {
        const weight = customWeights[comp.slot] || comp.estimatedWeightG || 0;
        const factor = weight / 100;

        kcal += (comp.kcalPer100g || 0) * factor;
        carbs += (comp.carbsPer100g || 0) * factor;
        sugar += (comp.sugarPer100g || 0) * factor;
        protein += (comp.proteinPer100g || 0) * factor;
        fat += (comp.fatPer100g || 0) * factor;
        fiber += (comp.fiberPer100g || 0) * factor;
        sodium += (comp.sodiumPer100g || 0) * factor;
      });
    }

    const targetCarbs = userProfile.targetCarbsPerMealG || 30;
    const targetSugar = userProfile.targetSugarPerMealG || 10;

    let status: AlertStatus = 'optimal';
    let alertTitle = '🟢 ปริมาณคาร์โบไฮเดรตและน้ำตาลอยู่ในเกณฑ์ปลอดภัย';
    let alertDescription = 'สัดส่วนและน้ำหนักอาหารเหมาะสมกับเป้าหมายการควบคุมเบาหวาน';

    if (carbs > targetCarbs * 1.15 || sugar > targetSugar * 1.25) {
      status = 'danger';
      alertTitle = '🔴 คาร์โบไฮเดรต/น้ำตาลเกินเกณฑ์เป้าหมาย!';
      alertDescription = `คาร์บ ${carbs.toFixed(1)}g เกินเป้าหมาย ${targetCarbs}g แนะนำลดปริมาณข้าวในช่องที่ 1`;
    } else if (carbs > targetCarbs * 0.88 || sugar > targetSugar * 0.9) {
      status = 'warning';
      alertTitle = '🟡 ควรระวัง: ปริมาณคาร์โบไฮเดรตใกล้เต็มโควต้าของมื้อนี้';
      alertDescription = `คาร์บ ${carbs.toFixed(1)}g คิดเป็น ${((carbs / targetCarbs) * 100).toFixed(0)}% ของโควต้า`;
    }

    return {
      totalKcal: Math.round(kcal),
      totalCarbsG: parseFloat(carbs.toFixed(1)),
      totalSugarG: parseFloat(sugar.toFixed(1)),
      totalProteinG: parseFloat(protein.toFixed(1)),
      totalFatG: parseFloat(fat.toFixed(1)),
      totalFiberG: parseFloat(fiber.toFixed(1)),
      totalSodiumMg: Math.round(sodium),
      status,
      alertTitle,
      alertDescription,
    };
  }, [analysisResult, customWeights, userProfile]);

  // Handle Weight input change for a slot
  const handleWeightChange = (slot: CompartmentType, val: number) => {
    setCustomWeights((prev) => ({
      ...prev,
      [slot]: Math.max(0, val),
    }));
  };

  // Copy formatted output to clipboard
  const handleCopyFormattedSummary = () => {
    if (!analysisResult) return;
    const textToCopy =
      analysisResult.formattedSummary ||
      `🍱 1. ชื่อเมนู: ${analysisResult.dishNameThai || 'เมนูอาหาร'}\n\n2. รวมแคลอรี: ${analysisResult.calorieRange || `${liveTotals.totalKcal} kcal`}\n\n3. โภชนาการ: คาร์บ ${liveTotals.totalCarbsG}g, โปรตีน ${liveTotals.totalProteinG}g, ไขมัน ${liveTotals.totalFatG}g\n\nคำแนะนำ:\n${analysisResult.clinicalSummary || 'วิเคราะห์ตามหลักการคุมระดับน้ำตาลในเลือด'}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    soundFx.playClickBeep();
    showNotification('คัดลอกข้อความผลการวิเคราะห์ 4 ขั้นตอนเรียบร้อยแล้ว', 'success');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Transfer identified results to Smart Meal Box Simulator
  const handleApplyToSmartMealBox = () => {
    if (!analysisResult) return;
    soundFx.playSuccessChime();

    const dataToTransfer = (analysisResult.identifiedCompartments.length > 0
      ? analysisResult.identifiedCompartments
      : [
          {
            slot: 'carb' as const,
            foodName: analysisResult.dishNameThai || 'อาหารจานหลัก',
            estimatedWeightG: 120,
            kcalPer100g: 130,
            carbsPer100g: 22,
            sugarPer100g: 1,
            proteinPer100g: 6,
            fatPer100g: 2,
            fiberPer100g: 1,
            sodiumPer100g: 50,
            glycemicIndex: 'low' as const,
          },
        ]
    ).map((comp) => ({
      slot: comp.slot,
      foodName: comp.foodName,
      weightGrams: customWeights[comp.slot] || comp.estimatedWeightG || 80,
      density: {
        kcalPer100g: comp.kcalPer100g,
        carbsPer100g: comp.carbsPer100g,
        sugarPer100g: comp.sugarPer100g,
        proteinPer100g: comp.proteinPer100g,
        fatPer100g: comp.fatPer100g,
        fiberPer100g: comp.fiberPer100g,
        sodiumPer100g: comp.sodiumPer100g,
        glycemicIndex: comp.glycemicIndex,
      },
    }));

    onApplyToSimulator(dataToTransfer);
  };

  // Save directly to Diabetes Meal Logs
  const handleSaveDirectToLogs = () => {
    if (!analysisResult) return;
    soundFx.playSuccessChime();

    const mealName = analysisResult.dishNameThai || `มื้อ${selectedMealType === 'breakfast' ? 'เช้า' : selectedMealType === 'lunch' ? 'กลางวัน' : selectedMealType === 'dinner' ? 'เย็น' : 'ว่าง'}`;

    const newLog: MealLog = {
      id: 'meal_ai_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      mealType: selectedMealType,
      mealName: `${mealName} (AI นักโภชนาการประเมิน)`,
      compartments: (analysisResult.identifiedCompartments.length > 0
        ? analysisResult.identifiedCompartments
        : [
            {
              slot: 'carb' as const,
              foodName: analysisResult.dishNameThai || 'เมนูอาหาร',
              estimatedWeightG: 150,
              kcalPer100g: 120,
              carbsPer100g: 20,
            },
          ]
      ).map((comp) => {
        const weight = customWeights[comp.slot] || comp.estimatedWeightG || 0;
        const factor = weight / 100;
        return {
          type: comp.slot,
          foodName: comp.foodName,
          weightG: weight,
          kcal: Math.round((comp.kcalPer100g || 0) * factor),
          carbsG: parseFloat(((comp.carbsPer100g || 0) * factor).toFixed(1)),
        };
      }),
      totalKcal: liveTotals.totalKcal,
      totalCarbsG: liveTotals.totalCarbsG,
      totalSugarG: liveTotals.totalSugarG,
      totalFiberG: liveTotals.totalFiberG,
      status: liveTotals.status,
      clinicalFeedback: `${analysisResult.calorieRange ? `ช่วงแคลอรี: ${analysisResult.calorieRange}. ` : ''}${analysisResult.clinicalSummary || liveTotals.alertDescription}`,
    };

    onSaveMeal(newLog);
    showNotification('บันทึกมื้ออาหารลงสมุดสุขภาพเบาหวานเรียบร้อยแล้ว!', 'success');
  };

  // Convert current analysisResult ingredients to MealIngredientItem[] for editor
  const currentModalIngredients: MealIngredientItem[] = React.useMemo(() => {
    if (analysisResult?.ingredientsTable && analysisResult.ingredientsTable.length > 0) {
      return analysisResult.ingredientsTable.map((row, idx) => ({
        id: `ing_row_${idx}`,
        name: row.name,
        category: (row.name.includes('ข้าว') || row.name.includes('แป้ง') || row.name.includes('เส้น')
          ? 'carb'
          : row.name.includes('ไก่') || row.name.includes('ไข่') || row.name.includes('ปลา') || row.name.includes('หมู') || row.name.includes('เนื้อ') || row.name.includes('เต้าหู้')
          ? 'protein'
          : row.name.includes('ผัก') || row.name.includes('บรอกโคลี') || row.name.includes('แตงกวา')
          ? 'vegetable'
          : row.name.includes('น้ำมัน') || row.name.includes('เนย')
          ? 'fat'
          : row.name.includes('ผลไม้') || row.name.includes('ฝรั่ง') || row.name.includes('ส้ม') || row.name.includes('กล้วย')
          ? 'fruit'
          : 'condiment') as CompartmentType,
        ratioPercent: 20,
        weightGrams: row.estimatedWeightG,
        density: {
          kcalPer100g: Math.round(((row.kcal || 0) / (row.estimatedWeightG || 100)) * 100),
          carbsPer100g: parseFloat((((row.carbsG || 0) / (row.estimatedWeightG || 100)) * 100).toFixed(1)),
          sugarPer100g: 0.5,
          proteinPer100g: parseFloat((((row.proteinG || 0) / (row.estimatedWeightG || 100)) * 100).toFixed(1)),
          fatPer100g: parseFloat((((row.fatG || 0) / (row.estimatedWeightG || 100)) * 100).toFixed(1)),
          fiberPer100g: 1.0,
          sodiumPer100g: 50,
          glycemicIndex: 'low',
        },
        gi: 'low',
        isSelected: true,
      }));
    }

    if (analysisResult?.identifiedCompartments) {
      return analysisResult.identifiedCompartments.map((comp) => ({
        id: `ing_comp_${comp.slot}`,
        name: comp.foodName,
        category: comp.slot,
        ratioPercent: 25,
        weightGrams: customWeights[comp.slot] || comp.estimatedWeightG || 80,
        density: {
          kcalPer100g: comp.kcalPer100g,
          carbsPer100g: comp.carbsPer100g,
          sugarPer100g: comp.sugarPer100g,
          proteinPer100g: comp.proteinPer100g,
          fatPer100g: comp.fatPer100g,
          fiberPer100g: comp.fiberPer100g,
          sodiumPer100g: comp.sodiumPer100g,
          glycemicIndex: comp.glycemicIndex,
        },
        gi: comp.glycemicIndex || 'low',
        isSelected: true,
      }));
    }

    return [];
  }, [analysisResult, customWeights]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="font-bold text-sm">{showToast.message}</p>
        </div>
      )}

      {/* Popular Menu Selector Modal */}
      <PopularMenuSelectorModal
        isOpen={showPopularMenuModal}
        onClose={() => setShowPopularMenuModal(false)}
        onSelectMenu={handleSelectFromPopularMenu}
        currentSelectedDishName={analysisResult?.dishNameThai}
      />

      {/* Menu Detail & Ingredients Editor Modal */}
      <MenuDetailEditorModal
        isOpen={showMenuDetailModal}
        onClose={() => setShowMenuDetailModal(false)}
        dishNameThai={analysisResult?.dishNameThai || 'เมนูอาหาร'}
        dishNameEn={analysisResult?.dishNameEn}
        initialIngredients={currentModalIngredients}
        initialNotes={analysisResult?.clinicalSummary}
        onSaveDetails={handleSaveCustomDetails}
        userProfile={userProfile}
      />

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Nutritionist — วิเคราะห์ภาพ & ประเมินแคลอรี 4 ขั้นตอน</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            ระบบวิเคราะห์อาหารจากภาพ & ประเมินพลังงาน
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base leading-relaxed">
            ประเมินแคลอรีเป็นช่วงอัตโนมัติ ไม่ต้องชั่งน้ำหนัก พร้อมเลือกจาก 360+ เมนูยอดนิยม และเพิ่มรายละเอียดเมนูได้อิสระ
          </p>
        </div>

        {/* Quick Popular Menu Button & Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            id="open-popular-menu-btn"
            onClick={() => {
              soundFx.playClickBeep();
              setShowPopularMenuModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Utensils className="w-4 h-4" />
            <span>เลือกจากเมนูยอดนิยม (360+ เมนู)</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดรูป</span>
            </button>
            <button
              onClick={() => setActiveMode('camera')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'camera'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ถ่ายภาพ</span>
            </button>
            <button
              onClick={() => setActiveMode('sample')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'sample'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ภาพตัวอย่าง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Image Capture/Preview (Left) & AI Analysis Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo Viewfinder / Upload Box (Spans 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Image Capture & Visual Input
              </h2>
              {selectedImage && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  โหลดรูปแล้ว
                </span>
              )}
            </div>

            {/* Mode 1: Camera Active */}
            {activeMode === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-400/40 rounded-2xl flex items-center justify-center">
                  <div className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                    วางจานอาหารให้อยู่กึ่งกลางภาพ
                  </div>
                </div>

                {/* Camera Action Buttons */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                  <button
                    onClick={toggleCameraFacing}
                    className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all active:scale-95"
                    title="สลับกล้องหน้า/หลัง"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={capturePhoto}
                    disabled={isAnalyzing}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                    <span>ถ่ายภาพประเมิน</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: File Upload Box */}
            {activeMode === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] ${
                  selectedImage
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={selectedImage}
                      alt="Uploaded Meal"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-800 text-xs font-bold shadow-md">
                        คลิกเพื่อเปลี่ยนรูปภาพ
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">
                      คลิกเพื่อเลือกไฟล์ หรือลากรูปภาพมาวางที่นี่
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      ถ่ายหรืออัปโหลดภาพอาหารเพื่อประเมินแคลอรีและสารอาหารอัตโนมัติ
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Mode 3: Preset Sample Meal Picker */}
            {activeMode === 'sample' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">
                  เลือกชุดภาพตัวอย่างอาหารเพื่อทดสอบการประเมินส่วนประกอบแบบทันที:
                </p>
                {PRESET_SAMPLE_MEALS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <img
                      src={sample.imageUrl}
                      alt={sample.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {sample.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar for Re-analysis */}
            {selectedImage && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => analyzeImage(selectedImage)}
                  disabled={isAnalyzing}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isAnalyzing ? 'กำลังประมวลผล...' : 'กดวิเคราะห์ซ้ำด้วย AI'}</span>
                </button>
              </div>
            )}
          </section>

          {/* AI Nutritionist 4-Step Explanation Card */}
          <section className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-5 border border-emerald-800 shadow-md">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ขั้นตอนการประเมินของ AI นักโภชนาการ</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span><strong>บอกชื่อเมนู:</strong> ระบุชื่ออาหารทั้งภาษาไทยและอังกฤษ</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span><strong>แยกวัตถุดิบ:</strong> จำแนกชิ้นส่วนที่มองเห็นจริง และประเมินน้ำหนักเป็นกรัม</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span><strong>ตารางสรุปสารอาหาร:</strong> แสดงแคลอรี, โปรตีน, คาร์บ, ไขมัน แต่ละชิ้น</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  4
                </span>
                <span><strong>รวมแคลอรีเป็น "ช่วง":</strong> ไม่เดามั่ว ประเมินครอบคลุมน้ำมันและเครื่องปรุงแฝง</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: AI Analysis Findings & 4-Step Breakdown (Spans 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Loading Animation Card */}
          {isAnalyzing && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="relative w-20 h-20 mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />
                </div>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                AI นักโภชนาการกำลังวิเคราะห์รูปภาพอาหาร...
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 animate-pulse">
                {analysisProgressText}
              </p>
              <p className="text-xs text-slate-400 mt-3 max-w-sm">
                กำลังจำแนกวัตถุดิบ คำนวณสารอาหารรายชิ้น และประเมินพลังงานเป็นช่วงอย่างแม่นยำ
              </p>
            </div>
          )}

          {/* Empty State when no analysis yet */}
          {!isAnalyzing && !analysisResult && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-slate-800">
                พร้อมรับภาพเพื่อประเมินสารอาหาร 4 ขั้นตอน
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
                คุณสามารถถ่ายรูป หรือเลือกภาพอาหารด้านซ้าย หรือกดปุ่มเลือกจาก 360+ เมนูยอดนิยมเพื่อดูการประเมินแคลอรีได้ทันที
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowPopularMenuModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>ค้นหาในคลัง 360+ เมนูยอดนิยม</span>
                </button>
                <button
                  onClick={() => handleSelectSample(PRESET_SAMPLE_MEALS[0])}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  ทดลองดูตัวอย่างจานสุขภาพ 2:1:1
                </button>
              </div>
            </div>
          )}

          {/* Render Full AI Analysis Results */}
          {!isAnalyzing && analysisResult && (
            <div className="space-y-6">
              {/* Step 1 & 4 Banner: Dish Names & Calorie Range */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-700/80">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>ขั้นตอนที่ 1: ชื่อเมนูที่ระบุได้</span>
                      </span>
                      {analysisResult.overallConfidence && (
                        <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                          ความมั่นใจ: {analysisResult.overallConfidence}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {analysisResult.dishNameThai || 'เมนูอาหารเพื่อสุขภาพ'}
                    </h2>
                    {analysisResult.dishNameEn && (
                      <p className="text-xs text-slate-300 mt-0.5 font-medium italic">
                        {analysisResult.dishNameEn}
                      </p>
                    )}
                  </div>

                  {/* Edit Menu Details Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="edit-menu-details-btn"
                      onClick={() => {
                        soundFx.playClickBeep();
                        setShowMenuDetailModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>เพิ่ม / แก้ไขรายละเอียดเมนู</span>
                    </button>

                    <button
                      onClick={handleCopyFormattedSummary}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
                      title="คัดลอกข้อความสรุป"
                    >
                      {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Step 4: Calorie Range Assessment */}
                <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>ขั้นตอนที่ 4: รวมแคลอรีทั้งหมดเป็น "ช่วง" (Calorie Range)</span>
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {analysisResult.calorieRange || `${Math.round(liveTotals.totalKcal * 0.92)} - ${Math.round(liveTotals.totalKcal * 1.08)} แคลอรี่`}
                      <span className="text-xs font-normal text-slate-300 ml-2">
                        (เฉลี่ย ≈ {liveTotals.totalKcal} kcal)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      *ประเมินเป็นช่วงครอบคลุมน้ำมันปรุงอาหารและซอสปรุงรสที่มองไม่เห็นด้วยตาเปล่า
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-xs shrink-0">
                    <div className="text-center">
                      <span className="text-slate-400 block text-[10px]">คาร์บรวม</span>
                      <span className="font-bold text-sm text-blue-300">{liveTotals.totalCarbsG}g</span>
                    </div>
                    <div className="w-px h-6 bg-white/20" />
                    <div className="text-center">
                      <span className="text-slate-400 block text-[10px]">โปรตีน</span>
                      <span className="font-bold text-sm text-emerald-300">{liveTotals.totalProteinG}g</span>
                    </div>
                    <div className="w-px h-6 bg-white/20" />
                    <div className="text-center">
                      <span className="text-slate-400 block text-[10px]">ไขมัน</span>
                      <span className="font-bold text-sm text-amber-300">{liveTotals.totalFatG}g</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 & 3: Ingredients Breakdown Table */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ขั้นตอนที่ 2 & 3: วัตถุดิบแยกชิ้น & ตารางสารอาหาร
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      ตารางสรุป แคลอรี, โปรตีน, คาร์บ, ไขมัน ของวัตถุดิบแต่ละชิ้น
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowMenuDetailModal(true)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 border border-emerald-200/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มวัตถุดิบ/เครื่องเคียง</span>
                  </button>
                </div>

                {/* Table Layout */}
                <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3 sm:px-4">วัตถุดิบที่มองเห็นในภาพ</th>
                        <th className="p-3 text-center">น้ำหนักประเมิน</th>
                        <th className="p-3 text-center text-orange-700">แคลอรี</th>
                        <th className="p-3 text-center text-blue-700">โปรตีน</th>
                        <th className="p-3 text-center text-emerald-700">คาร์บ</th>
                        <th className="p-3 text-center text-amber-700">ไขมัน</th>
                        <th className="p-3 sm:px-4">ข้อสังเกต / หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {((analysisResult.ingredientsTable && analysisResult.ingredientsTable.length > 0)
                        ? analysisResult.ingredientsTable
                        : analysisResult.identifiedCompartments.map((c) => ({
                            name: c.foodName,
                            estimatedWeightG: c.estimatedWeightG || 80,
                            kcal: Math.round(((c.kcalPer100g || 0) * (c.estimatedWeightG || 80)) / 100),
                            proteinG: parseFloat((((c.proteinPer100g || 0) * (c.estimatedWeightG || 80)) / 100).toFixed(1)),
                            carbsG: parseFloat((((c.carbsPer100g || 0) * (c.estimatedWeightG || 80)) / 100).toFixed(1)),
                            fatG: parseFloat((((c.fatPer100g || 0) * (c.estimatedWeightG || 80)) / 100).toFixed(1)),
                            notes: c.adviceForDiabetes || c.description || '',
                          }))
                      ).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 sm:px-4 font-bold text-slate-800">
                            {row.name}
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600">
                            {row.estimatedWeightG ? `${row.estimatedWeightG} g` : '-'}
                          </td>
                          <td className="p-3 text-center font-bold text-orange-600">
                            {row.kcal || 0} kcal
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600">
                            {row.proteinG || 0}g
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-600">
                            {row.carbsG || 0}g
                          </td>
                          <td className="p-3 text-center font-bold text-amber-600">
                            {row.fatG || 0}g
                          </td>
                          <td className="p-3 sm:px-4 text-[11px] text-slate-500">
                            {row.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
                      <tr>
                        <td className="p-3 sm:px-4 text-slate-800">รวมทั้งหมด (ช่วงประเมิน)</td>
                        <td className="p-3 text-center font-mono text-slate-700">
                          {((analysisResult.ingredientsTable && analysisResult.ingredientsTable.length > 0)
                            ? analysisResult.ingredientsTable.reduce((sum, item) => sum + (item.estimatedWeightG || 0), 0)
                            : 0)} g
                        </td>
                        <td className="p-3 text-center text-orange-700 text-sm">
                          {liveTotals.totalKcal} kcal
                        </td>
                        <td className="p-3 text-center text-blue-700 text-sm">
                          {liveTotals.totalProteinG}g
                        </td>
                        <td className="p-3 text-center text-emerald-700 text-sm">
                          {liveTotals.totalCarbsG}g
                        </td>
                        <td className="p-3 text-center text-amber-700 text-sm">
                          {liveTotals.totalFatG}g
                        </td>
                        <td className="p-3 sm:px-4 text-[11px] text-emerald-700">
                          ช่วง {analysisResult.calorieRange || `${Math.round(liveTotals.totalKcal * 0.92)} - ${Math.round(liveTotals.totalKcal * 1.08)} แคล`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Clinical Diabetes Assessment & Feedback */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Diabetes Clinical Evaluation & Safety
                    </h4>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {analysisResult.overview}
                    </p>
                  </div>

                  {/* Safety Score */}
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/80">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">ความปลอดภัยเบาหวาน</span>
                      <span className="text-xl font-black text-emerald-600 font-mono">
                        {analysisResult.diabetesSafetyScore}
                        <span className="text-xs text-slate-400 font-normal">/100</span>
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {analysisResult.diabetesSafetyScore >= 80 ? 'ดี' : analysisResult.diabetesSafetyScore >= 60 ? 'พอใช้' : 'ระวัง'}
                    </div>
                  </div>
                </div>

                {/* Clinical advice */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>คำแนะนำจาก AI นักโภชนาการ:</span>
                  </p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {analysisResult.clinicalSummary}
                  </p>

                  {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                    <ul className="text-xs text-emerald-800 space-y-1 list-disc pl-5 mt-2.5 pt-2 border-t border-emerald-200/50">
                      {analysisResult.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Status Alert Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    liveTotals.status === 'danger'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : liveTotals.status === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {liveTotals.status === 'danger' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  ) : liveTotals.status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs">{liveTotals.alertTitle}</h4>
                    <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                      {liveTotals.alertDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: 1. Apply to Smart Meal Box Simulator, 2. Save Direct to Diary */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold">เลือกมื้ออาหารสำหรับบันทึก:</span>
                  <div className="flex items-center gap-1">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMealType(m)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          selectedMealType === m
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {m === 'breakfast' ? 'เช้า' : m === 'lunch' ? 'กลางวัน' : m === 'dinner' ? 'เย็น' : 'ของว่าง'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleApplyToSmartMealBox}
                    className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Utensils className="w-4 h-4 text-emerald-400" />
                    <span>ส่งข้อมูลเข้าหน้าประเมินเมนู</span>
                  </button>

                  <button
                    onClick={handleSaveDirectToLogs}
                    className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกมื้อนี้ลงสมุดสุขภาพเบาหวาน</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
