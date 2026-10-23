import React from 'react';
import { Utensils, LayoutDashboard, CalendarDays, User, RefreshCw, Activity, Camera, Sparkles, BookOpen } from 'lucide-react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/audio';

export type NavTab = 'fourteen_day_stats' | 'mealbox' | 'scan_photo' | 'dashboard' | 'profile';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userProfile: UserProfile;
  onSwitchUser: () => void;
  onOpenEducationModal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  userProfile,
  onSwitchUser,
  onOpenEducationModal,
}) => {
  const handleNavClick = (tab: NavTab) => {
    soundFx.playClickBeep();
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3 shrink-0 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          onClick={() => handleNavClick('fourteen_day_stats')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight uppercase">
                AI Nutrition Meal Estimator
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                ระบบประเมินแคลอรี AI
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden md:block">
              Diabetes Nutrition & 14-Day Health Analytics
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links - Order: 1. สถิติ14วัน | 2. ประเมินเมนู | 3. ถ่ายภาพ | 4. แดชบอร์ด | 5. โปรไฟล์ */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          {/* ช่อง 1: สถิติ 14 วัน */}
          <button
            onClick={() => handleNavClick('fourteen_day_stats')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === 'fourteen_day_stats'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarDays className={`w-3.5 h-3.5 ${currentTab === 'fourteen_day_stats' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>สถิติบันทึก 14 วัน</span>
          </button>

          {/* ช่อง 2: ประเมินเมนู */}
          <button
            onClick={() => handleNavClick('mealbox')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === 'mealbox'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Utensils className={`w-3.5 h-3.5 ${currentTab === 'mealbox' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>ประเมินแคลอรีตามเมนู</span>
          </button>

          {/* ช่อง 3: ถ่ายภาพ */}
          <button
            onClick={() => handleNavClick('scan_photo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === 'scan_photo'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 ${currentTab === 'scan_photo' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>AI ถ่ายภาพวิเคราะห์อาหาร</span>
          </button>

          {/* ช่อง 4: แดชบอร์ด */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-3.5 h-3.5 ${currentTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>แดชบอร์ดสุขภาพ</span>
          </button>

          {/* ช่อง 5: โปรไฟล์ */}
          <button
            onClick={() => handleNavClick('profile')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              currentTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className={`w-3.5 h-3.5 ${currentTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>ข้อมูลสุขภาพ & โปรไฟล์</span>
          </button>
        </nav>

        {/* Telemetry Status & User Pill */}
        <div className="flex items-center gap-3">
          {/* AI Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] text-emerald-800 font-bold tracking-wider">
              AI Nutritionist Ready
            </span>
          </div>

          {/* User Profile Pill */}
          <div
            onClick={() => handleNavClick('profile')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
              {userProfile.nickname ? userProfile.nickname.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {userProfile.nickname || 'ผู้รับบริการ'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {userProfile.age ? `${userProfile.age} ปี` : 'ยังไม่ระบุ'}
              </span>
            </div>
          </div>

          {onOpenEducationModal && (
            <button
              onClick={onOpenEducationModal}
              className="p-2 rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-teal-200 shadow-2xs"
              title="สื่อให้ความรู้เรื่องโรค (เบาหวาน/ไขมัน/ความดัน)"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden lg:inline">สื่อความรู้โรค</span>
            </button>
          )}

          <button
            onClick={onSwitchUser}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="เปลี่ยนผู้รับบริการ / เริ่มใหม่"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation - Order: 1. สถิติ14วัน | 2. ประเมินเมนู | 3. ถ่ายภาพ | 4. แดชบอร์ด | 5. โปรไฟล์ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 flex justify-around items-center shadow-lg">
        {/* ช่อง 1: สถิติ 14 วัน */}
        <button
          onClick={() => handleNavClick('fourteen_day_stats')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            currentTab === 'fourteen_day_stats' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-semibold">สถิติ 14 วัน</span>
        </button>

        {/* ช่อง 2: ประเมินเมนู */}
        <button
          onClick={() => handleNavClick('mealbox')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            currentTab === 'mealbox' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] font-semibold">ประเมินเมนู</span>
        </button>

        {/* ช่อง 3: ถ่ายภาพ AI */}
        <button
          onClick={() => handleNavClick('scan_photo')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            currentTab === 'scan_photo' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] font-semibold">ถ่ายภาพ AI</span>
        </button>

        {/* ช่อง 4: แดชบอร์ด */}
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            currentTab === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">แดชบอร์ด</span>
        </button>

        {/* ช่อง 5: โปรไฟล์ */}
        <button
          onClick={() => handleNavClick('profile')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            currentTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">โปรไฟล์</span>
        </button>
      </div>
    </header>
  );
};
