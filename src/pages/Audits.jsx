import React, { useState, useEffect } from 'react';
import { db, ref, push, set } from '../firebase/config';

const Audits = () => {
  const [results, setResults] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // 1. استعادة المسودة المخزنة عند فتح الصفحة
  useEffect(() => {
    const savedDraft = localStorage.getItem('audit_draft');
    if (savedDraft) {
      setResults(JSON.parse(savedDraft));
    }
  }, []);

  // 2. تحديث الإجابات وحفظ مسودة تلقائياً
  const handleStatusChange = (point, status) => {
    const updatedResults = { ...results, [point]: status };
    setResults(updatedResults);
    localStorage.setItem('audit_draft', JSON.stringify(updatedResults));
  };

  // مصفوفة البنود الكاملة (يمكنك زيادة البنود هنا بنفس التنسيق)
  const auditGroups = [
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
  ];

  // دالة البحث (تبحث في النص العربي والإنجليزي)
  const filteredGroups = auditGroups.map(group => ({
    ...group,
    points: group.points.filter(p => 
      p.ar.includes(searchTerm) || p.en.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.points.length > 0);

  const allPoints = auditGroups.flatMap(group => group.points);
  const totalPointsCount = allPoints.length;

  const saveAudit = async () => {
    const answeredCount = Object.keys(results).length;
    if (answeredCount < totalPointsCount) {
      setShowValidation(true);
      alert(`عذراً، يوجد ${totalPointsCount - answeredCount} بند لم يتم تقييمهم بعد.`);
      return;
    }

    setIsSaving(true);
    try {
      const auditsRef = ref(db, 'audits');
      const entries = Object.values(results);
      const relevantEntries = entries.filter(s => s !== 'N/A');
      
      await set(push(auditsRef), {
        timestamp: new Date().toLocaleString('ar-EG'),
        inspector: "Safety Ambassador - Sohag University",
        data: results,
        totalPoints: relevantEntries.length, 
        passCount: relevantEntries.filter(s => s === 'Pass').length
      });
      
      alert("تم حفظ التقرير بنجاح وإرساله لقاعدة البيانات! 🎉");
      setResults({});
      localStorage.removeItem('audit_draft');
      setSearchTerm("");
      setShowValidation(false);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className={`${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen transition-colors duration-500 font-sans`}>
      <div className="max-w-5xl mx-auto pb-20 px-6 pt-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-slate-200 pb-8">
          <div className="text-right">
            <h2 className="text-3xl font-black italic tracking-tighter">OR AUDIT | تدقيق العمليات</h2>
            <p className="text-blue-500 font-bold text-sm mt-1">سفير سلامة المرضى - مستشفيات جامعة سوهاج</p>
            <button onClick={() => setDarkMode(!darkMode)} className="mt-3 text-xs font-bold px-4 py-1.5 bg-slate-500/10 rounded-full transition-all hover:bg-slate-500/20">
              {darkMode ? 'الوضع الفاتح ☀️' : 'الوضع الليلي 🌙'}
            </button>
          </div>
          <button 
            onClick={saveAudit} 
            disabled={isSaving} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl transition-all disabled:opacity-50 mt-6 md:mt-0 uppercase tracking-tighter text-sm active:scale-95"
          >
            {isSaving ? "جاري الحفظ..." : "إرسال التقرير النهائي"}
          </button>
        </div>

        {/* Search Bar - Fixed Top (Non-Sticky) */}
        <div className="mb-16">
          <div className="relative">
            <input 
              type="text"
              placeholder="ابحث عن أي بند (تعقيم، أيدي، نفايات)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-7 rounded-[2.5rem] shadow-xl focus:outline-none border-2 transition-all font-bold text-right text-lg ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-100 focus:border-blue-500'
              }`}
            />
            <span className="absolute left-8 top-1/2 -translate-y-1/2 opacity-30 text-2xl">🔍</span>
          </div>
        </div>

        {/* Audit Groups */}
        <div className="space-y-24">
          {filteredGroups.map((group, gIndex) => (
            <div key={gIndex} className="space-y-10">
              <h3 className="text-2xl font-black text-blue-600 border-r-8 border-blue-600 pr-5 bg-blue-500/5 py-3 rounded-l-lg">{group.title}</h3>
              
              <div className="grid gap-8">
                {group.points.map((point, pIndex) => {
                  const isMissing = showValidation && !results[point.en];
                  return (
                    <div 
                      key={point.en} 
                      className={`p-8 rounded-[3rem] flex flex-col xl:flex-row justify-between items-center gap-8 border-2 transition-all shadow-sm ${
                        isMissing ? 'border-red-500 bg-red-500/5 animate-pulse' : (darkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-50 hover:border-blue-100')
                      }`}
                    >
                      <div className="flex gap-6 items-center flex-1 w-full">
                        <span className="text-4xl font-black opacity-10 italic">{String(pIndex + 1).padStart(2, '0')}</span>
                        <div className="space-y-3 text-right flex-1">
                          {/* النص العربي والإنجليزي بأحجام متقاربة جداً كما طلبت */}
                          <p className={`text-xl font-black leading-snug ${isMissing ? 'text-red-500' : ''}`}>{point.ar}</p>
                          <p className={`text-lg font-bold tracking-tight italic ${isMissing ? 'text-red-400' : 'text-blue-400'}`}>{point.en}</p>
                        </div>
                      </div>

                      {/* أزرار الاختيار ثنائية اللغة */}
                      <div className={`flex gap-3 p-2.5 rounded-[2.2rem] ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        {[
                          {val: 'Pass', label: 'مطابق / PASS', color: 'bg-green-600'},
                          {val: 'Fail', label: 'سلبي / FAIL', color: 'bg-red-600'},
                          {val: 'N/A', label: 'N/A', color: 'bg-slate-600'}
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            onClick={() => handleStatusChange(point.en, btn.val)}
                            className={`px-8 py-4 rounded-[1.5rem] font-black text-[11px] transition-all whitespace-nowrap ${
                              results[point.en] === btn.val 
                                ? `${btn.color} text-white shadow-xl scale-110` 
                                : 'text-slate-400 hover:text-blue-500'
                            }`}
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
          
          {/* رسالة عند عدم وجود نتائج بحث */}
          {filteredGroups.length === 0 && (
            <div className="text-center py-20 opacity-40">
              <p className="text-2xl font-bold italic">لا توجد نتائج تطابق بحثك..</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Audits;