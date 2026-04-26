import React, { useState, useEffect } from 'react';
import { db, ref, onValue, push, set } from '../firebase/config';
import BundleCheck from '../components/BundleCheck';

const HAIForm = () => {
  const [patients, setPatients] = useState([]);
  const [showBundle, setShowBundle] = useState(false);
  const [step, setStep] = useState(1); 
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    infectionType: '',
    organism: '',
    detectionDate: new Date().toISOString().split('T')[0], 
    admissionDate: '', 
    department: '',
    wbc: '', 
    crp: '', // الحقل الجديد
  });

  const criteria = {
    VAP: [
      { id: 'oxy', text: 'زيادة احتياج الأكسجين أو ضغط الجهاز (FiO2/PEEP)' },
      { id: 'sputum', text: 'تغير لون أو كمية البلغم (Purulent)' },
      { id: 'xray', text: 'ارتشاح جديد في أشعة الصدر (New Infiltrate)' }
    ],
    CLABSI: [
      { id: 'chills', text: 'رعشة مفاجئة أو هبوط غير مبرر بالضغط' },
      { id: 'site', text: 'احمرار أو صديد مكان القسطرة المركزية' },
      { id: 'fever', text: 'حرارة > 38 بدون مصدر آخر معروف' }
    ],
    CAUTI: [
      { id: 'urine', text: 'تغير في شكل البول (عكر أو مدمم)' },
      { id: 'pain', text: 'ألم في الجنب أو أسفل البطن' },
      { id: 'pus', text: 'وجود صديد (Pus Cells) في تحليل البول' }
    ],
    SSI: [
      { id: 'pus_drain', text: 'خروج صديد من مكان الجرح الجراحي' },
      { id: 'opening', text: 'انفتاح الجرح تلقائياً أو سخونة شديدة حوله' }
    ]
  };

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setPatients(list);
      }
    });
  }, []);

  const handlePatientChange = (e) => {
    const selectedPatient = patients.find(p => p.id === e.target.value);
    if (selectedPatient) {
      setFormData({
        ...formData,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        department: selectedPatient.department,
        admissionDate: selectedPatient.admissionDate || new Date().toISOString()
      });
      setShowBundle(true);
      setStep(1); 
    } else {
      setShowBundle(false);
    }
  };

  const getAnalysis = () => {
    const symptomsCount = Object.values(selectedSymptoms).filter(v => v === true).length;
    // التحقق من المؤشرات الحيوية (WBC > 12000 أو CRP > 10)
    const hasHighMarkers = parseInt(formData.wbc) > 12000 || parseInt(formData.crp) > 10;

    const admission = new Date(formData.admissionDate);
    const onset = new Date(formData.detectionDate);
    const diffHours = (onset - admission) / (1000 * 60 * 60);

    // 1. منطق العدوى المجتمعية
    if (diffHours < 48) {
      return { 
        type: 'COMMUNITY',
        msg: "🏠 عدوى مجتمعية (Community)", 
        rec: "الأعراض ظهرت قبل مرور 48 ساعة. تُصنف عدوى خارجية ولا تُحسب كعدوى مكتسبة من المستشفى.",
        color: "bg-blue-50 border-blue-200 text-blue-700"
      };
    }

    // 2. تحديد التوصية المخصصة بناءً على نوع العدوى
    let specificRec = "يُنصح بسحب المزرعة فوراً وإبلاغ الطبيب.";
    if (formData.infectionType === 'VAP') {
      specificRec = "🚨 توصية: اطلب أشعة صدر (X-Ray) عاجلة، فحص غازات دم (ABG)، وسحب عينة بلغم للمزرعة.";
    } else if (formData.infectionType === 'CAUTI') {
      specificRec = "🚨 توصية: اطلب تحليل بول كامل (Urine Analysis) ومزرعة بول، وراجع ضرورة استمرار القسطرة.";
    } else if (formData.infectionType === 'CLABSI') {
      specificRec = "🚨 توصية: اسحب مزرعة دم (Blood Culture) مزدوجة (من القسطرة ومن وريد طرفي).";
    } else if (formData.infectionType === 'SSI') {
      specificRec = "🚨 توصية: طلب عرض جراحة لتقييم الجرح، واطلب مسحة (Swab) أو عينة صديد للمعمل.";
    }

    // 3. منطق الاشتباه (HAI)
    if (symptomsCount >= 2 || (symptomsCount === 1 && hasHighMarkers)) {
      return { 
        type: 'HAI',
        msg: `🚨 اشتباه مؤكد عدوى ${formData.infectionType}`, 
        rec: specificRec,
        color: "bg-red-50 border-red-200 text-red-700"
      };
    }

    return { 
      type: 'OBSERVATION',
      msg: "⚠️ حالة تحت الملاحظة", 
      rec: "المعايير غير مكتملة حالياً. استمر في مراقبة العلامات الحيوية وإعادة الفحص بعد 12 ساعة.",
      color: "bg-amber-50 border-amber-200 text-amber-700"
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const analysis = getAnalysis();
      const haiRef = ref(db, 'hai_events');
      await set(push(haiRef), {
        ...formData,
        symptoms: selectedSymptoms,
        analysisType: analysis.type,
        analysisResult: analysis.msg,
        timestamp: new Date().toISOString(),
      });
      alert("✅ تم تسجيل تقرير الاشتباه والتوصيات بنجاح");
      setStep(1); setShowBundle(false); setSelectedSymptoms({});
      setFormData({ ...formData, infectionType: '', organism: '', patientId: '', wbc: '', crp: '' });
    } catch (err) { alert("خطأ: " + err.message); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans mt-5" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-r-8 border-orange-600 pr-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic">سفير سلامة المرضى 🛡️</h2>
          <p className="text-slate-500 font-bold">نظام الترصد الذكي - مستشفيات جامعة سوهاج</p>
        </div>
      </div>

      {/* اختيار المريض */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8">
        <label className="text-xs font-black text-slate-400 mr-4 mb-2 block uppercase">تحديد مريض المتابعة</label>
        <select 
          className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700"
          onChange={handlePatientChange}
          value={formData.patientId}
        >
          <option value="">-- ابحث في قائمة القسم --</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.department})</option>)}
        </select>
      </div>

      {/* مرحلة حزمة الوقاية */}
      {formData.patientId && showBundle && (
        <div className="space-y-6 animate-in slide-in-from-top duration-500">
           <BundleCheck patientId={formData.patientId} patientName={formData.patientName} />
           <button 
             onClick={() => setShowBundle(false)}
             className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all"
           >
             تم تطبيق الوقاية.. انتقال لتقييم الاشتباه ←
           </button>
        </div>
      )}

      {/* المساعد الذكي */}
      {formData.patientId && !showBundle && (
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-orange-100 space-y-8 animate-in zoom-in">
          
          {step === 1 && (
            <div className="space-y-6 text-center">
              <h3 className="text-xl font-black">ما هو مصدر الشك الإكلينيكي؟</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(criteria).map(type => (
                  <button key={type} onClick={() => { setFormData({...formData, infectionType: type}); setStep(2); }}
                    className="p-8 bg-orange-50/50 border-2 border-transparent hover:border-orange-500 rounded-[2.5rem] font-black text-orange-700 text-xl transition-all">
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <button onClick={() => setStep(1)} className="text-orange-600 font-bold underline text-sm pr-2">تغيير النوع</button>
                <span className="bg-orange-600 text-white px-6 py-1 rounded-full font-black">{formData.infectionType}</span>
              </div>
              
              <div className="space-y-3">
                {criteria[formData.infectionType].map(item => (
                  <label key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-orange-50">
                    <input type="checkbox" className="w-6 h-6 accent-orange-600"
                      onChange={(e) => setSelectedSymptoms({...selectedSymptoms, [item.id]: e.target.checked})} />
                    <span className="font-bold text-slate-700">{item.text}</span>
                  </label>
                ))}
              </div>

              {/* المؤشرات الحيوية والتحاليل */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-black text-slate-400 text-xs mb-2 mr-2">تاريخ بدء الأعراض</label>
                  <input type="date" className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none"
                    value={formData.detectionDate} onChange={(e) => setFormData({...formData, detectionDate: e.target.value})} />
                </div>
                <div>
                  <label className="block font-black text-slate-400 text-xs mb-2 mr-2">WBCs (كرات البيضاء)</label>
                  <input type="number" placeholder="مثلاً: 14000" className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={(e) => setFormData({...formData, wbc: e.target.value})} />
                </div>
                <div>
                  <label className="block font-black text-slate-400 text-xs mb-2 mr-2">CRP (بروتين سي)</label>
                  <input type="number" placeholder="مثلاً: 24" className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-red-400"
                    onChange={(e) => setFormData({...formData, crp: e.target.value})} />
                </div>
              </div>

              <button onClick={() => setStep(3)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">تحليل الحالة واستعراض التوصية ←</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
               <div className={`p-8 rounded-[2.5rem] border-2 shadow-inner ${getAnalysis().color}`}>
                  <h3 className="text-xl font-black mb-2">{getAnalysis().msg}</h3>
                  <p className="font-bold text-slate-700 leading-relaxed italic underline underline-offset-4">
                    {getAnalysis().rec}
                  </p>
               </div>

               <div className="space-y-4">
                  <label className="block text-sm font-black text-slate-400 mr-4">الميكروب (في حال ظهور المزرعة)</label>
                  <input type="text" placeholder="مثلاً: Klebsiella pneumoniae" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none ring-2 ring-slate-100 focus:ring-orange-500 font-bold"
                    onChange={(e) => setFormData({...formData, organism: e.target.value})} />
                  <button onClick={handleSubmit} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-orange-600 transition-all shadow-2xl">حفظ التقرير النهائي 💾</button>
                  <button onClick={() => setStep(2)} className="w-full text-slate-400 font-bold text-sm underline text-center block">تعديل البيانات</button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HAIForm;