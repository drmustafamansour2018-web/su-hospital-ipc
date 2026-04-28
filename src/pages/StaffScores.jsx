/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react'; 
import { db } from '../firebase/config'; 
import { ref, onValue, update, increment, remove } from "firebase/database"; 
import html2canvas from 'html2canvas'; 

// 1. مكون البطاقات مع وظيفة الحذف
function PodiumItem({ data, rankText, isWinner, colorClass, onDelete }) {
  if (!data) return null;

  return (
    <div className={`relative group transition-all duration-500 hover:-translate-y-4 ${isWinner ? 'scale-110 z-10' : 'scale-100'}`}>
      <button 
        onClick={() => onDelete(data.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full z-20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700 font-bold"
      >
        ×
      </button>

      <div className={`absolute -inset-1 bg-gradient-to-r ${colorClass} rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000`}></div>
      <div className={`relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 h-full flex flex-col items-center text-center`}>
        <div className={`-mt-12 mb-4 px-6 py-2 rounded-full text-white font-black shadow-lg bg-gradient-to-r ${colorClass}`}>
          {rankText}
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-1 truncate w-full">{data.name}</h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold mb-4 uppercase tracking-wider">
          {data.dept || 'بدون قسم'} • {data.role || 'موظف'}
        </span>
        <div className="bg-blue-50/50 rounded-2xl p-3 mb-4 w-full min-h-[60px] flex items-center justify-center">
          <p className="text-blue-700 text-[11px] font-bold leading-relaxed italic text-center">
              " {data.heroicAction || 'التزام مثالي بمعايير الجودة'} "
          </p>
        </div>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 ${isWinner ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
          {data.score || 0}
        </div>
      </div>
    </div>
  );
}

const StaffScores = () => {
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const printRef = useRef(); 

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const monthKey = `${selectedYear}-${selectedMonth}`;
  const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  const [formData, setFormData] = useState({
    name: '', dept: '', role: '', action: '', heroicAction: ''
  });

  const positiveActions = {
    'غسل الأيدي': 5, 'الالتزام بالزي الواقي': 5, 'تعقيم الأدوات': 10, 'الإبلاغ عن خطر': 15, 'نظافة البيئة المحيطة': 5
  };

  useEffect(() => {
    setLoading(true);
    let isMounted = true;
    const monthlyRef = ref(db, `monthly_scores/${monthKey}`);
    
    const unsubscribe = onValue(monthlyRef, (snapshot) => {
      if (!isMounted) return;
      try {
        const data = snapshot.val();
        if (data) {
          const formattedData = Object.entries(data)
            .map(([id, info]) => ({ 
              id, 
              ...info, 
              score: Number(info.score) || 0 
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);
          setStaffData(formattedData);
        } else {
          setStaffData([]);
        }
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    });

    return () => { isMounted = false; unsubscribe(); };
  }, [monthKey]);

  // دالة الحذف المعدلة بالرقم السري
  const handleDelete = async (userId) => {
    const password = window.prompt("برجاء إدخال الرقم السري لإتمام عملية الحذف:");

    if (password === "1234") {
      if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا الإدخال نهائياً؟")) {
        try {
          await remove(ref(db, `monthly_scores/${monthKey}/${userId}`));
          alert("تم الحذف بنجاح ✅");
        } catch {
          alert("حدث خطأ أثناء محاولة الحذف");
        }
      }
    } else if (password !== null) {
      alert("عذراً، الرقم السري غير صحيح. لا تملك صلاحية الحذف ❌");
    }
  };

  const exportAsImage = async () => {
    const element = printRef.current;
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#f8fafc',
        scale: 2, 
        logging: false,
        useCORS: true,
        allowTaint: false
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `أبطال_مكافحة_العدوى_${monthsAr[selectedMonth-1]}_${selectedYear}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("عذراً، فشل تجهيز الصورة للتحميل.");
    }
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    if (!cleanName || !formData.dept || !formData.role || !formData.action) {
        return alert("يرجى تحديد كافة البيانات المطلوبة");
    }
    
    const points = positiveActions[formData.action] || 5;
    const actualMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const updates = {};
    const basePath = `monthly_scores/${actualMonthKey}/${cleanName}`;
    
    updates[`${basePath}/score`] = increment(points);
    updates[`${basePath}/name`] = cleanName;
    updates[`${basePath}/dept`] = formData.dept;
    updates[`${basePath}/role`] = formData.role;
    updates[`${basePath}/heroicAction`] = formData.heroicAction.trim() || 'الالتزام بمعايير مكافحة العدوى';
    updates[`${basePath}/updatedAt`] = new Date().toLocaleString('ar-EG');
    updates[`total_lifetime_scores/${cleanName}/score`] = increment(points);

    try {
      await update(ref(db), updates);
      setFormData({ name: '', dept: '', role: '', action: '', heroicAction: '' });
      setShowAddForm(false);
      alert("تم الحفظ بنجاح ✅");
    } catch {
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const topThree = staffData.slice(0, 3);
  const others = staffData.slice(3);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-right" dir="rtl">
      
      {/* Header Section */}
      <div className="max-w-[1400px] mx-auto mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b border-slate-200 pb-8">
        <div className="flex-1">
          <div className="mb-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-800">
              لوحة التميز - <span className="text-blue-600 italic font-black">أبطال شهر {monthsAr[selectedMonth-1]}</span>
            </h2>
          </div>
          <p className="text-slate-500 font-bold text-sm mb-4">
            الكوادر الطبية المتميزة في تطبيق معايير مكافحة العدوى
          </p>
          <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-5 py-2 rounded-2xl shadow-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-xs md:text-sm font-bold">مستشفيات جامعة سوهاج • وحدة مكافحة العدوى</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent border-none font-black text-slate-700 outline-none">
              {monthsAr.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent border-none font-black text-slate-700 outline-none">
              {[2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-2">
            <span>تسجيل إنجاز جديد</span>
            <span className="bg-white/20 rounded-lg px-2">+</span>
          </button>
        </div>
      </div>

      {/* Main Board Section */}
      <div ref={printRef} className="p-2 md:p-6 rounded-[3rem]">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-300 font-black text-xl italic">جاري جلب القائمة...</div>
        ) : staffData.length > 0 ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-4 pt-2">
              <div className="md:order-1 md:mt-8">
                {topThree[1] && <PodiumItem data={topThree[1]} rankText="المركز الثاني" colorClass="from-slate-300 to-slate-500" onDelete={handleDelete} />}
              </div>
              <div className="md:order-2">
                {topThree[0] && <PodiumItem data={topThree[0]} rankText="المركز الأول" isWinner colorClass="from-yellow-400 to-orange-500" onDelete={handleDelete} />}
              </div>
              <div className="md:order-3 md:mt-8">
                {topThree[2] && <PodiumItem data={topThree[2]} rankText="المركز الثالث" colorClass="from-amber-600 to-amber-800" onDelete={handleDelete} />}
              </div>
            </div>
            
            <div className="max-w-5xl mx-auto mb-20">
              <div className="flex items-center gap-4 mb-8 px-4">
                 <div className="h-px flex-1 bg-slate-200"></div>
                 <span className="text-slate-400 font-black text-sm uppercase tracking-widest px-4">القائمة الإضافية</span>
                 <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {others.map((staff, i) => (
                  <div key={staff.id || i} className="bg-white p-5 rounded-3xl flex justify-between items-center border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex items-center gap-4">
                      <span className="bg-slate-50 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm">#{i + 4}</span>
                      <div>
                        <h4 className="font-black text-slate-800 text-base">{staff.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{staff.dept}</span>
                          <span className="text-[10px] font-bold text-blue-400">{staff.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl font-black text-lg">{staff.score}</div>
                      <button 
                        onClick={() => handleDelete(staff.id)}
                        className="text-red-300 hover:text-red-600 p-2 transition-colors"
                        title="حذف الإدخال"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-300 font-bold italic">
            لا توجد بيانات مسجلة لشهر {monthsAr[selectedMonth-1]} {selectedYear}
          </div>
        )}
      </div>

      {/* WhatsApp Export Section at Bottom */}
      <div className="max-w-4xl mx-auto mt-20 mb-32">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <h3 className="text-white text-3xl font-black mb-4 italic">مشاركة التميز على الواتساب 📱</h3>
            <p className="text-slate-400 font-bold mb-10 max-w-lg mx-auto leading-relaxed">
              يمكنك تصدير لوحة الشرف الحالية كصورة عالية الجودة لمشاركتها فوراً في مجموعات الواتساب الرسمية.
            </p>
            
            <button 
              onClick={exportAsImage}
              className="inline-flex items-center gap-4 bg-green-500 hover:bg-green-600 text-white px-12 py-5 rounded-3xl shadow-[0_20px_50px_rgba(34,197,94,0.3)] transition-all active:scale-95 font-black text-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>حفظ كصورة للواتساب</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50">
                <button onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-slate-900">توثيق إنجاز</h2>
                </div>
            </div>
            <div className="p-8 pt-6 overflow-y-auto">
              <form onSubmit={handleAddPoints} className="space-y-6">
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="الاسم بالكامل..." />
                <div className="grid grid-cols-2 gap-4">
                  <select required value={formData.dept} onChange={(e) => setFormData({...formData, dept: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none">
                    <option value="" disabled>القسم</option>
                    <option>الرعاية المركزة</option><option>العمليات</option><option>المبتسرين</option><option>الطوارئ</option>
                  </select>
                  <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none">
                    <option value="" disabled>الوظيفة</option>
                    <option>طبيب</option><option>تمريض</option><option>عامل</option><option>فني</option>
                  </select>
                </div>
                <select required value={formData.action} onChange={(e) => setFormData({...formData, action: e.target.value})} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black outline-none">
                  <option value="" disabled>تحديد المعيار</option>
                  {Object.keys(positiveActions).map(act => <option key={act} value={act}>{act}</option>)}
                </select>
                <textarea value={formData.heroicAction} onChange={(e) => setFormData({...formData, heroicAction: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold h-32 resize-none outline-none" placeholder="وصف التميز..." />
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-900 transition-all">اعتماد الإنجاز</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffScores;