import React from 'react';
import { X, BookOpen, Heart, Activity, Syringe, Droplets, CheckCircle, ArrowRight } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface DiseaseEducationModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const DiseaseEducationModal: React.FC<DiseaseEducationModalProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    soundFx.playClickBeep();
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      {/* Floating Card - Not Full Screen (แบบไม่เต็มหน้าเว็บ สวยงาม) */}
      <div className="bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header with Title & Cross (กากบาท) Button */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-2xs">
              <BookOpen className="w-5 h-5 text-emerald-50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  สื่อให้ความรู้เกี่ยวกับโรค
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-bold">
                  ก่อนใส่ข้อมูล
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                ทำความเข้าใจโรคเบาหวาน ไขมัน และความดันโลหิตสูง
              </p>
            </div>
          </div>

          {/* ปุ่มกากบาท (X) ออก เพื่อไม่อ่านแล้วและไปใส่ข้อมูลต่อ */}
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-rose-500 hover:text-white text-white flex items-center justify-center transition-all cursor-pointer hover:rotate-90 shadow-2xs"
            title="กากบาทออก เพื่อไปใส่ข้อมูลผู้ใช้งาน"
            aria-label="กากบาทออก เพื่อไปใส่ข้อมูลผู้ใช้งาน"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
          {/* Section 1: 💉 โรคเบาหวานมี 2 ชนิด */}
          <div className="bg-emerald-50/70 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 space-y-3.5">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm sm:text-base">
              <span className="text-xl">💉</span>
              <span>โรคเบาหวานมี 2 ชนิด</span>
            </div>

            {/* Type 1 */}
            <div className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-2xs space-y-2">
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>ชนิดที่ 1 ร่างกาย “สร้างอินซูลินไม่ได้”</span>
              </div>
              <ul className="space-y-1 text-slate-600 text-xs pl-3.5 list-disc font-medium">
                <li><strong className="text-slate-800">มักพบใน:</strong> เด็กและวัยรุ่น แต่ผู้ใหญ่ก็เป็นได้</li>
                <li><strong className="text-slate-800">เกิดจาก:</strong> ภูมิคุ้มกันผิดปกติ</li>
                <li><strong className="text-slate-800">การรักษา:</strong> ต้องใช้อินซูลิน ในการรักษา</li>
                <li><strong className="text-slate-800">ข้อเท็จจริง:</strong> ไม่ได้เกิดจากการกินหวานหรือพฤติกรรมการใช้ชีวิต</li>
              </ul>
            </div>

            {/* Type 2 */}
            <div className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-2xs space-y-2">
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>ชนิดที่ 2 ร่างกาย “มีอินซูลิน แต่ใช้ได้ไม่ดี”</span>
              </div>
              <ul className="space-y-1 text-slate-600 text-xs pl-3.5 list-disc font-medium">
                <li><strong className="text-slate-800">มักพบใน:</strong> ผู้ใหญ่และผู้สูงอายุ</li>
                <li><strong className="text-slate-800">เกี่ยวข้องกับ:</strong> พันธุกรรม อายุ น้ำหนัก และพฤติกรรมการใช้ชีวิต</li>
                <li><strong className="text-slate-800">อาการแรกเริ่ม:</strong> เริ่มแรกอาจ ไม่มีอาการ</li>
                <li><strong className="text-slate-800">การรักษา:</strong> รักษาด้วย ปรับอาหาร ออกกำลังกาย ยา และบางรายใช้อินซูลิน</li>
              </ul>
            </div>
          </div>

          {/* Section 2: 🩸 ไขมันในเลือดสูง */}
          <div className="bg-rose-50/70 rounded-2xl p-4 sm:p-5 border border-rose-200/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-950 font-black text-sm sm:text-base">
              <span className="text-xl">🩸</span>
              <span>ไขมันในเลือดสูง</span>
            </div>
            <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
              คือ <strong>มีไขมันในเลือดมากเกินไป</strong> เช่น คอเลสเตอรอลหรือไตรกลีเซอไรด์สูง ซึ่งส่วนใหญ่มัก <strong>ไม่มีอาการ</strong> ต้องตรวจเลือดและให้แพทย์ประเมินจึงจะทราบได้
            </p>
          </div>

          {/* Section 3: ❤️ ความดันโลหิตสูง */}
          <div className="bg-red-50/70 rounded-2xl p-4 sm:p-5 border border-red-200/80 space-y-2">
            <div className="flex items-center gap-2 text-red-950 font-black text-sm sm:text-base">
              <span className="text-xl">❤️</span>
              <span>ความดันโลหิตสูง</span>
            </div>
            <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-red-100 shadow-2xs">
              คือ <strong>ภาวะที่ความดันเลือดสูงกว่าปกติอย่างต่อเนื่อง</strong> ส่วนใหญ่มักไม่มีอาการ ต้อง <strong>วัดความดันและให้แพทย์ประเมิน</strong> จึงจะทราบว่าเป็นหรือไม่ หากปล่อยไว้ อาจเพิ่มความเสี่ยงโรคหัวใจ หลอดเลือดสมอง และโรคไต
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 sm:px-7 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
            กดปุ่มกากบาท (✕) หรือปุ่มนี้เพื่อเริ่มกรอกข้อมูลสุขภาพ
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>กดเข้าใส่ข้อมูลผู้ใช้งาน</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
