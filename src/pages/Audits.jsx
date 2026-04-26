import React, { useState, useEffect } from 'react';
import { db, ref, push, set } from '../firebase/config';

const Audits = () => {
  const [activeTab, setActiveTab] = useState('OR'); 
  const [results, setResults] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [selectedDept, setSelectedDept] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");

  useEffect(() => {
    const savedDraft = localStorage.getItem('audit_draft');
    if (savedDraft) setResults(JSON.parse(savedDraft));
  }, []);

  const handleStatusChange = (pointEn, status) => {
    const updatedResults = { ...results, [pointEn]: status };
    setResults(updatedResults);
    localStorage.setItem('audit_draft', JSON.stringify(updatedResults));
  };

  const sections = {
    OR: [
      {
        title: "1. انضباط الفريق الطبي | Staff Discipline & PPE",
        points: [
          { en: "Surgical scrub performed correctly", ar: "أداء غسيل الأيدي الجراحي بطريقة صحيحة" },
          { en: "Proper wearing of surgical masks & caps", ar: "الالتزام بارتداء الواقيات (الماسك وغطاء الرأس)" },
          { en: "Sterile gowns and gloves technique", ar: "تقنية ارتداء الجاونت والقفازات المعقمة" },
          { en: "Limit personnel traffic in OR", ar: "تقليل حركة الأفراد داخل غرفة العمليات" }
        ]
      },
      {
        title: "2. تعقيم الآلات والمستلزمات | Instruments & Sterilization",
        points: [
          { en: "Integrity of sterile packaging", ar: "سلامة وجودة تغليف الآلات المعقمة" },
          { en: "Chemical indicators verified (Type 4/5/6)", ar: "التحقق من المؤشرات الكيميائية داخل العبوات" },
          { en: "Correct storage of sterile items", ar: "التخزين الصحيح للمستلزمات المعقمة" },
          { en: "Proper handling of contaminated tools", ar: "التعامل السليم مع الآلات الملوثة بعد الجراحة" }
        ]
      },
      {
        title: "3. نظافة وتطهير البيئة | Environmental Cleaning",
        points: [
          { en: "OR table and equipment disinfection", ar: "تطهير طاولة العمليات والأجهزة الطبية" },
          { en: "Floor cleaning between cases", ar: "نظافة الأرضيات بين الحالات الجراحية" },
          { en: "Suction canisters disposal/cleaning", ar: "تنظيف وتفريغ برطمانات التشفيط" },
          { en: "Disinfection of high-touch surfaces", ar: "تطهير الأسطح عالية الملامسة (مقابض، مفاتيح)" }
        ]
      },
      {
        title: "4. إدارة النفايات والمخلفات | Waste Management",
        points: [
          { en: "Proper segregation of medical waste", ar: "الفصل الصحيح للنفايات الطبية عن العادية" },
          { en: "Sharp containers safety and filling level", ar: "سلامة صناديق الآلات الحادة وعدم امتلائها" },
          { en: "Safe transport of infectious waste", ar: "النقل الآمن للنفايات المعدية خارج القسم" }
        ]
      },
      {
        title: "5. نظام التهوية والتكييف | Ventilation & HVAC",
        points: [
          { en: "Positive pressure maintained in OR", ar: "الحفاظ على ضغط الهواء الموجب داخل الغرفة" },
          { en: "OR doors kept closed during surgery", ar: "إغلاق أبواب الغرفة طوال فترة الجراحة" },
          { en: "Temperature and humidity control", ar: "التحكم في درجة الحرارة والرطوبة الموصى بها" }
        ]
      }
    ],
    HH: [
      {
        title: "لحظات نظافة الأيدي الخمس | WHO 5 Moments",
        points: [
          { en: "Moment 1: Before touching a patient", ar: "اللحظة 1: قبل ملامسة المريض" },
          { en: "Moment 2: Before clean aseptic procedure", ar: "اللحظة 2: قبل الإجراءات النظيفة أو المعقمة" },
          { en: "Moment 3: After body fluid exposure risk", ar: "اللحظة 3: بعد التعرض لخطر ملامسة سوائل الجسم" },
          { en: "Moment 4: After touching a patient", ar: "اللحظة 4: بعد ملامسة المريض" },
          { en: "Moment 5: After touching surroundings", ar: "اللحظة 5: بعد ملامسة المنطقة المحيطة بالمريض" },
          { en: "Covers all surfaces of hands", ar: "تغطية جميع أسطح اليدين أثناء الغسل" },
          { en: "Appropriate duration 40-60 sec", ar: "مدة الغسل كافية (40-60 ثانية)" }
        ]
      }
    ]
  };

  const saveAudit = async () => {
    const currentPoints = sections[activeTab].flatMap(g => g.points);
    const answeredCount = currentPoints.filter(p => results[p.en]).length;
    const isHeaderValid = activeTab === 'OR' ? selectedDept : (staffName && staffRole);

    if (answeredCount < currentPoints.length || !isHeaderValid) {
      setShowValidation(true);
      alert("⚠️ يرجى إكمال جميع البيانات والبنود المطلوبة.");
      return;
    }

    setIsSaving(true);
    try {
      const auditsRef = ref(db, 'audits');
      await set(push(auditsRef), {
        timestamp: new Date().toLocaleString('ar-EG'),
        type: activeTab,
        department: activeTab === 'OR' ? selectedDept : "N/A",
        staff: activeTab === 'HH' ? { name: staffName, role: staffRole } : "N/A",
        data: results
      });
      alert("تم الحفظ بنجاح! 🎉");
      setResults({});
      localStorage.removeItem('audit_draft');
      setShowValidation(false);
    } catch (e) { alert("Error: " + e.message); } finally { setIsSaving(false); }
  };

  return (
    <div dir="rtl" className={`${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen transition-all font-sans`}>
      <div className="max-w-5xl mx-auto pb-20 px-6 pt-12">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-blue-500 pb-8">
          <div className="text-right">
            <h2 className="text-3xl font-black italic tracking-tighter text-blue-600 uppercase">Integrity System</h2>
            <button onClick={() => setDarkMode(!darkMode)} className="mt-3 text-xs font-bold px-6 py-2 bg-slate-500/10 rounded-full transition-all">{darkMode ? '☀️ فاتح' : '🌙 ليلي'}</button>
          </div>
          <button onClick={saveAudit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl active:scale-95 disabled:opacity-50 transition-all">
            {isSaving ? "جاري المعالجة..." : "إرسال التقرير النهائي"}
          </button>
        </header>

        <div className="flex gap-4 mb-12">
          <button onClick={() => setActiveTab('OR')} className={`flex-1 p-6 rounded-[2.5rem] border-2 transition-all font-black text-lg ${activeTab === 'OR' ? 'border-blue-600 bg-blue-600 text-white shadow-xl scale-105' : 'border-transparent bg-white shadow-md opacity-40'}`}>🏥 أوديت العمليات</button>
          <button onClick={() => setActiveTab('HH')} className={`flex-1 p-6 rounded-[2.5rem] border-2 transition-all font-black text-lg ${activeTab === 'HH' ? 'border-blue-600 bg-blue-600 text-white shadow-xl scale-105' : 'border-transparent bg-white shadow-md opacity-40'}`}>🧼 غسيل الأيدي</button>
        </div>

        <div className="mb-16">
          {activeTab === 'OR' ? (
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={`w-full p-6 rounded-[2.5rem] shadow-xl border-2 font-bold text-lg focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 focus:border-blue-500'}`}>
              <option value="">اختر اسم قسم العمليات...</option>
              <option value="عمليات الميكرو">عمليات الميكرو</option>
              <option value="العمليات الكبرى">العمليات الكبرى</option>
              <option value="عمليات الطوارئ">عمليات الطوارئ</option>
              <option value="عمليات العظام">عمليات العظام</option>
            </select>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="اسم مقدم الرعاية الصحية" value={staffName} onChange={(e) => setStaffName(e.target.value)} className={`p-6 rounded-[2.5rem] shadow-xl border-2 font-bold text-lg focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 focus:border-blue-500'}`} />
              <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} className={`p-6 rounded-[2.5rem] shadow-xl border-2 font-bold text-lg focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 focus:border-blue-500'}`}>
                <option value="">الفئة الوظيفية...</option>
                <option value="طبيب">طبيب</option>
                <option value="ممرض">ممرض</option>
                <option value="فني أشعة">فني أشعة</option>
                <option value="فني تحاليل">فني تحاليل</option>
                <option value="عامل">عامل</option>
              </select>
            </div>
          )}
        </div>

        <div className="space-y-24">
          {sections[activeTab].map((group, gIdx) => (
            <div key={gIdx} className="space-y-10">
              <h3 className="text-2xl font-black text-blue-600 border-r-8 border-blue-600 pr-5 bg-blue-500/5 py-3 rounded-l-lg">{group.title}</h3>
              <div className="grid gap-8">
                {group.points.map((p, pIdx) => {
                  const isMissing = showValidation && !results[p.en];
                  return (
                    <div key={p.en} className={`p-8 rounded-[3rem] border-2 flex flex-col xl:flex-row justify-between items-center gap-8 transition-all shadow-sm ${isMissing ? 'border-red-500 bg-red-500/5 animate-pulse' : (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50')}`}>
                      <div className="text-right flex-1 w-full flex gap-6 items-center">
                        <span className="text-4xl font-black opacity-10 italic">{String(pIdx + 1).padStart(2, '0')}</span>
                        <div className="flex-1">
                          <p className={`text-xl font-black leading-snug ${isMissing ? 'text-red-500' : ''}`}>{p.ar}</p>
                          <p className="text-lg font-bold italic text-blue-400 mt-1">{p.en}</p>
                        </div>
                      </div>
                      
                      {/* لوحة الأزرار بالألوان المطلوبة */}
                      <div className={`flex gap-3 p-2.5 rounded-[2.2rem] ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        {[
                          { val: 'Pass', label: 'مطابق / PASS', color: 'bg-green-600' },
                          { val: 'Fail', label: 'سلبي / FAIL', color: 'bg-red-600' },
                          { val: 'N/A', label: 'N/A', color: 'bg-slate-600' }
                        ].map(btn => (
                          <button 
                            key={btn.val} 
                            onClick={() => handleStatusChange(p.en, btn.val)} 
                            className={`px-8 py-4 rounded-[1.5rem] font-black text-[10px] transition-all whitespace-nowrap ${results[p.en] === btn.val ? `${btn.color} text-white shadow-xl scale-110` : 'text-slate-400 hover:text-blue-500'}`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Audits;