import React, { useState, useEffect } from 'react';
import { db, ref, push, set } from '../firebase/config';

const hospitalDepartments = {
  "Critical Care (العنايات)": [
    "عناية التخدير — ANES-ICU", "PICU — عناية أطفال مركزة", "CCU — عناية قلب",
    "Stroke Unit — وحدة السكتة الدماغية", "المبتسرين (الحضانة) — NICU", "IMCU — عناية متوسطة"
  ],
  "Operating Rooms (العمليات)": [
    "GS-OR — عمليات جراحة عامة", "ORTHO-OR — عمليات عظام", "NS-OR — عمليات مخ وأعصاب",
    "ENT-OR — عمليات أنف وأذن", "GYN-OR — عمليات نساء وتوليد", "URO-OR — عمليات مسالك",
    "OPH-OR — عمليات رمد", "PLS-OR — عمليات تجميل", "MICRO-OR — جراحات ميكروسكوبية", "CATH LAB — قسطرة القلب"
  ],
  "Medical & Surgical Wards": [
    "باطنة رجال — IM-M", "باطنة سيدات — IM-F", "قسم القلب — CARD", "صدرية — CHEST", "جراحة عامة — GS", "عظام — ORTHO", "مسالك بولية — URO"
  ],
  "Outpatient Clinics (العيادات الخارجية)": [
    "عيادة الجراحة العامة", "عيادة الباطنة العامة", "عيادة الأطفال", "عيادة العظام", 
    "عيادة المسالك البولية", "عيادة الأنف والأذن", "عيادة الرمد", "عيادة الجلدية", 
    "عيادة المخ والأعصاب", "عيادة النساء والتوليد", "عيادة القلب", "عيادة الصدرية"
  ],
  "Specialized Clinics (العيادات المتخصصة)": [
    "عيادة الذكورة والعقم", "عيادة جراحة الأطفال", "عيادة جراحة المسالك التخصصية", 
    "عيادة الأورام", "عيادة الروماتيزم والتأهيل", "عيادة جراحة الأوعية الدموية", 
    "عيادة الغدد الصماء", "عيادة جراحة التجميل"
  ]
};

const diagnosesOptions = {
  "Respiratory (تنفسي)": ["Pneumonia (HCAP/VAP)", "COBA Exacerbation", "ARDS", "Pulmonary Embolism"],
  "Sepsis & Blood (دم)": ["Septic Shock", "Sepsis", "Bacteremia", "MDR Infection (عدوى مقاومة)"],
  "Neurology (أعصاب)": ["Stroke (جلطة/نزيف)", "Meningitis", "Encephalitis", "Post-Craniotomy"],
  "Cardiac (قلب)": ["Myocardial Infarction (MI)", "Heart Failure", "Post-Cardiac Arrest"],
  "Others (أخرى)": ["DKA", "Renal Failure", "Multi-Organ Failure", "Trauma (إصابات حوادث)"]
};

const invasiveDevicesList = [
  "Mechanical Ventilation (جهاز تنفس)", "Central Line (CVC)", 
  "Urinary Catheter (Foley)", "Surgical Drain (درنقة)", "Tracheostomy"
];

const PatientEntry = () => {
  const [patient, setPatient] = useState({
    name: '', medicalId: '', department: '', diagnosis: [], devices: [], riskScore: 'Low Risk'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isHighRisk = 
      patient.department.includes('ICU') || 
      patient.devices.length > 0 || 
      patient.diagnosis.some(d => d.includes('Sepsis') || d.includes('MDR') || d.includes('Shock'));
    
    setPatient(prev => ({ ...prev, riskScore: isHighRisk ? 'High Risk' : 'Low Risk' }));
  }, [patient.department, patient.devices, patient.diagnosis]);

  const toggleSelection = (item, field) => {
    const list = patient[field] || [];
    const updated = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setPatient({ ...patient, [field]: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (patient.name.length < 3 || !patient.medicalId || !patient.department) {
      alert("الرجاء استكمال البيانات الأساسية بشكل صحيح.");
      return;
    }

    setIsSubmitting(true);
    try {
     const patientsRef = ref(db, 'patients_infections'); // غيرنا patients لـ patients_infections
await set(push(patientsRef), {
  ...patient,
  timestamp: new Date().toISOString(),
});
      
      alert("✅ تم تسجيل المريض بنجاح في قاعدة البيانات");
      setPatient({ name: '', medicalId: '', department: '', diagnosis: [], devices: [], riskScore: 'Low Risk' });
    } catch (error) {
      alert("خطأ في الاتصال: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 font-sans" dir="rtl">
  
  {/* Header الاحترافي - Midnight Clinical Design */}
  <div className="relative overflow-hidden bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-white/5">
    {/* لمسة إضاءة خلفية خافتة */}
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none"></div>
    
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="text-right space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            ترصد عدوى المنشآت الصحية
          </h1>
        </div>
        <p className="text-slate-400 font-bold pr-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          نموذج تسجيل بيانات مريض جديد — مستشفيات جامعة سوهاج
        </p>
      </div>

      {/* مؤشر الحالة الذكي */}
      <div className={`px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl border transition-all duration-500 ${
        patient.riskScore === 'High Risk' 
        ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10 animate-pulse' 
        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10'
      }`}>
        {patient.riskScore === 'High Risk' ? '⚠ High Risk Case' : '✓ Normal Case'}
      </div>
    </div>
  </div>

  {/* Form التصميم الحديث - Clean Glass Effect */}
  <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[4rem] p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-white/5 space-y-12 transition-all">
    
    {/* قسم البيانات التعريفية بلمسة UI عصرية */}
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">General Info</span>
        <div className="h-[1px] flex-1 bg-slate-100"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* حقل اسم المريض */}
        <div className="md:col-span-2 group">
          <label className="block text-[11px] font-black text-slate-400 pr-6 mb-3 uppercase tracking-tighter group-focus-within:text-blue-600 transition-colors">
            اسم المريض الرباعي
          </label>
          <div className="relative">
            <input 
              type="text" required placeholder="ادخل الاسم بالكامل كما في البطاقة..."
              className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-bold outline-none transition-all text-lg shadow-sm"
              value={patient.name} onChange={(e) => setPatient({...patient, name: e.target.value})}
            />
          </div>
        </div>

        {/* حقل الرقم الطبي */}
        <div className="group">
          <label className="block text-[11px] font-black text-slate-400 pr-6 mb-3 uppercase tracking-tighter group-focus-within:text-blue-600 transition-colors">
            الرقم الطبي (Medical ID)
          </label>
          <input 
            type="number" required placeholder="000000"
            className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-bold outline-none transition-all text-lg text-center tracking-widest shadow-sm"
            value={patient.medicalId} onChange={(e) => setPatient({...patient, medicalId: e.target.value})}
          />
        </div>
      </div>
    </div>
        {/* اختيار القسم */}
        <div className="space-y-3">
          <label className="text-sm font-black text-slate-400 pr-4">القسم أو العيادة التابع لها</label>
          <select 
            required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold outline-none cursor-pointer text-lg appearance-none"
            value={patient.department} onChange={(e) => setPatient({...patient, department: e.target.value})}
          >
            <option value="">-- اختر القسم/العيادة من القائمة --</option>
            {Object.keys(hospitalDepartments).map(cat => (
              <optgroup key={cat} label={cat} className="font-black text-blue-800 bg-slate-100">
                {hospitalDepartments[cat].map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* التشخيص الطبي */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 border-r-4 border-blue-600 pr-4">التشخيص الطبي الحالي</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(diagnosesOptions).map(cat => (
              <div key={cat} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black text-blue-600 uppercase mb-4 px-2 tracking-widest">{cat}</h4>
                <div className="flex flex-wrap gap-2">
                  {diagnosesOptions[cat].map(diag => (
                    <button 
                      key={diag} type="button"
                      onClick={() => toggleSelection(diag, 'diagnosis')}
                      className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                        patient.diagnosis.includes(diag) 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
                      }`}
                    >
                      {diag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* الأجهزة الغازية */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 border-r-4 border-red-600 pr-4">الأجهزة الغازية (Invasive Devices)</h3>
          <div className="flex flex-wrap gap-3 p-8 bg-red-50/30 rounded-[3rem] border border-red-100">
            {invasiveDevicesList.map(device => (
              <button 
                key={device} type="button"
                onClick={() => toggleSelection(device, 'devices')}
                className={`px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all border-2 ${
                  patient.devices.includes(device) 
                  ? 'bg-red-600 text-white border-red-600 shadow-xl scale-105' 
                  : 'bg-white text-red-600 border-red-100 hover:bg-red-200'
                }`}
              >
                {device}
              </button>
            ))}
          </div>
        </div>

        {/* زر الحفظ المحدث */}
        <button 
          disabled={isSubmitting}
          className="w-full py-8 bg-blue-700 text-white rounded-[2.5rem] font-black text-2xl uppercase tracking-tighter hover:bg-blue-800 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري مزامنة البيانات...
            </span>
          ) : (
            <>
              حفظ تسجيل المريض 
              <span className="text-3xl group-hover:translate-x-[-10px] transition-transform">💾</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
};

export default PatientEntry;