import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog, CompartmentType, MealIngredientItem } from './types';
import { Navigation, NavTab } from './components/Navigation';
import { AIMealEstimatorView } from './components/AIMealEstimatorView';
import { MealPhotoScanner } from './components/MealPhotoScanner';
import { DashboardView } from './components/DashboardView';
import { FourteenDayStatsView } from './components/FourteenDayStatsView';
import { ProfileRegistrationView } from './components/ProfileRegistrationView';
import { WelcomeGateModal } from './components/WelcomeGateModal';
import { DiseaseEducationModal } from './components/DiseaseEducationModal';
import { POPULAR_DISH_PRESETS } from './data/dishPresets';
import { calculateBmi } from './utils/bmiHelper';

const DEFAULT_PROFILE: UserProfile = {
  nickname: '',
  age: 0,
  gender: 'female',
  weightKg: null,
  heightCm: null,
  condition: 'type2_diabetes',
  targetDailyKcal: 1600,
  targetCarbsPerMealG: 30,
  targetSugarPerMealG: 10,
  targetSodiumPerMealMg: 600,
};

export default function App() {
  // Tabs: 1. fourteen_day_stats | 2. mealbox | 3. scan_photo | 4. dashboard | 5. profile
  const [currentTab, setCurrentTab] = useState<NavTab>('fourteen_day_stats');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // After clicking link to website, show welcome gate (หน้าให้ความรู้ -> ใส่ข้อมูลผู้ใช้งาน) as the very first screen
  const [showWelcomeGate, setShowWelcomeGate] = useState<boolean>(true);
  const [showGlobalEducationModal, setShowGlobalEducationModal] = useState<boolean>(false);

  // Active meal session state (passed to SmartMealBoxSimulator)
  const [activeMealName, setActiveMealName] = useState<string>('');
  const [activeTotalWeightG, setActiveTotalWeightG] = useState<number>(0);
  const [activeIngredients, setActiveIngredients] = useState<MealIngredientItem[]>([]);

  // Load initial state from LocalStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('smart_mealbox_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
      }

      const savedLogs = localStorage.getItem('smart_mealbox_logs');
      if (savedLogs) {
        setMealLogs(JSON.parse(savedLogs));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
      // Ensure the welcome flow (หน้าให้ความรู้ -> ใส่ข้อมูลผู้ใช้งาน) pops up on initial website link access
      setShowWelcomeGate(true);
    }
  }, []);

  // Save profile to LocalStorage
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('smart_mealbox_profile', JSON.stringify(newProfile));

    if (newProfile.weightKg && newProfile.heightCm) {
      try {
        const saved = localStorage.getItem('smart_mealbox_records_real_accumulated_v4');
        if (saved) {
          const recs = JSON.parse(saved);
          if (Array.isArray(recs) && recs.length > 0) {
            const { bmi, category } = calculateBmi(newProfile.weightKg, newProfile.heightCm);
            recs[0] = {
              ...recs[0],
              weightKg: newProfile.weightKg,
              heightCm: newProfile.heightCm,
              bmi,
              bmiCategory: category,
            };
            localStorage.setItem('smart_mealbox_records_real_accumulated_v4', JSON.stringify(recs));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Welcome Gate completion
  const handleWelcomeComplete = (partialProfile: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...userProfile,
      ...partialProfile,
    };
    setUserProfile(updated);
    localStorage.setItem('smart_mealbox_profile', JSON.stringify(updated));

    // Automatically synchronize Day 1 baseline in 14-day stats storage with the exact user inputs
    if (updated.weightKg && updated.heightCm) {
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date();
      const { bmi, category } = calculateBmi(updated.weightKg, updated.heightCm);

      let existingRecords: any[] = [];
      try {
        const saved = localStorage.getItem('smart_mealbox_records_real_accumulated_v4');
        if (saved) existingRecords = JSON.parse(saved);
      } catch {
        existingRecords = [];
      }

      if (!Array.isArray(existingRecords) || existingRecords.length === 0) {
        const day1 = {
          id: `real_record_day_1_${todayStr}`,
          date: todayStr,
          dayLabel: `วันที่ 1 (${today.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}) - ข้อมูลแรกเริ่ม`,
          dayOffset: 0,
          weightKg: updated.weightKg,
          heightCm: updated.heightCm,
          bmi,
          bmiCategory: category,
          totalKcal: 0,
          totalCarbsG: 0,
          totalSugarG: 0,
          totalSodiumMg: 0,
          complianceStatus: 'optimal',
          fastingGlucoseMgDl: updated.bloodSugarFastingMgDl || 0,
          meals: [],
          notes: `บันทึกเริ่มต้นจากข้อมูลผู้ใช้งานหน้าแรก (คุณ ${updated.nickname || 'ผู้ใช้งาน'})`,
        };
        localStorage.setItem('smart_mealbox_records_real_accumulated_v4', JSON.stringify([day1]));
      } else {
        // Update first record's baseline weight, height, BMI to match the user's inputs
        const updatedRecs = existingRecords.map((r: any, idx: number) => {
          if (idx === 0) {
            return {
              ...r,
              weightKg: updated.weightKg,
              heightCm: updated.heightCm,
              bmi,
              bmiCategory: category,
              notes: `บันทึกเริ่มต้นจากข้อมูลผู้ใช้งานหน้าแรก (คุณ ${updated.nickname || 'ผู้ใช้งาน'})`,
            };
          }
          return r;
        });
        localStorage.setItem('smart_mealbox_records_real_accumulated_v4', JSON.stringify(updatedRecs));
      }
    }

    setShowWelcomeGate(false);
  };

  // Reset / Switch User (re-open welcome flow from education modal -> profile input)
  const handleResetProfile = () => {
    setShowWelcomeGate(true);
  };
  const handleSwitchUser = handleResetProfile;

  // Clear 14-day logs only
  const handleClearLogsOnly = () => {
    try {
      localStorage.removeItem('smart_mealbox_logs');
      localStorage.removeItem('smart_mealbox_records_real_accumulated_v4');
      setMealLogs([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Factory reset all data
  const handleResetAllData = () => {
    try {
      localStorage.removeItem('smart_mealbox_profile');
      localStorage.removeItem('smart_mealbox_logs');
      localStorage.removeItem('smart_mealbox_records_real_accumulated_v4');
      setUserProfile(DEFAULT_PROFILE);
      setMealLogs([]);
      setShowWelcomeGate(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Add new meal log from Smart Meal Box or Scanner
  const handleSaveMeal = (newLog: MealLog) => {
    const updated = [newLog, ...mealLogs];
    setMealLogs(updated);
    localStorage.setItem('smart_mealbox_logs', JSON.stringify(updated));
  };

  // Transfer data from AI Photo Scanner to Smart Meal Box Simulator
  const handleApplyFromScanner = (
    scannedItems: {
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
  ) => {
    const totalW = scannedItems.reduce((sum, item) => sum + (item.weightGrams || 0), 0);
    const convertedIngredients: MealIngredientItem[] = scannedItems.map((item, idx) => ({
      id: `scanned_ing_${idx}_${Date.now()}`,
      name: item.foodName,
      category: item.slot,
      ratioPercent: totalW > 0 ? Math.round((item.weightGrams / totalW) * 100) : 25,
      weightGrams: item.weightGrams,
      density: item.density,
      gi: item.density.glycemicIndex || 'low',
      isSelected: true,
    }));

    setActiveMealName('มื้ออาหารตรวจจับจากภาพถ่าย AI');
    setActiveTotalWeightG(totalW || 350);
    setActiveIngredients(convertedIngredients);

    // Switch to simulator view to see live digital readout
    setCurrentTab('mealbox');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-24 md:pb-12">
      {/* Welcome Gate for First-Time Users or on site link entry */}
      {showWelcomeGate && (
        <WelcomeGateModal
          onComplete={handleWelcomeComplete}
          initialProfile={userProfile}
        />
      )}

      {/* Global Disease Education Modal */}
      <DiseaseEducationModal
        isOpen={showGlobalEducationModal}
        onClose={() => setShowGlobalEducationModal(false)}
      />

      {/* Top Header & Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userProfile={userProfile}
        onSwitchUser={handleSwitchUser}
        onOpenEducationModal={() => setShowGlobalEducationModal(true)}
      />

      {/* Main Content Area - Order: 1. สถิติ 14 วัน | 2. ประเมินเมนู | 3. ถ่ายภาพ | 4. แดชบอร์ด | 5. โปรไฟล์ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ช่อง 1: สถิติ 14 วัน */}
        {currentTab === 'fourteen_day_stats' && (
          <FourteenDayStatsView
            userProfile={userProfile}
            mealLogs={mealLogs}
            onOpenMealBox={() => setCurrentTab('mealbox')}
            onOpenPhotoScanner={() => setCurrentTab('scan_photo')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {/* ช่อง 2: ประเมินเมนู */}
        {currentTab === 'mealbox' && (
          <AIMealEstimatorView
            userProfile={userProfile}
            initialMealName={activeMealName}
            initialIngredients={activeIngredients}
            onSaveMeal={handleSaveMeal}
            onOpenFourteenDayStats={() => setCurrentTab('fourteen_day_stats')}
            onOpenPhotoScanner={() => setCurrentTab('scan_photo')}
          />
        )}

        {/* ช่อง 3: ถ่ายภาพ AI */}
        {currentTab === 'scan_photo' && (
          <MealPhotoScanner
            userProfile={userProfile}
            onApplyToSimulator={handleApplyFromScanner}
            onSaveMeal={handleSaveMeal}
          />
        )}

        {/* ช่อง 4: แดชบอร์ด */}
        {currentTab === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            mealLogs={mealLogs}
            onOpenMealBox={() => setCurrentTab('mealbox')}
            onOpenPhotoScanner={() => setCurrentTab('scan_photo')}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        )}

        {/* ช่อง 5: ข้อมูลสุขภาพ & โปรไฟล์ พร้อมช่องรีเซ็ตเด่นชัด */}
        {currentTab === 'profile' && (
          <ProfileRegistrationView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onResetProfile={handleResetProfile}
            onResetAllData={handleResetAllData}
            onClearLogsOnly={handleClearLogsOnly}
          />
        )}
      </main>
    </div>
  );
}
