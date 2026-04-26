import React, { useState } from 'react';
import { db, ref, push } from '../firebase/config';

const VAP_BUNDLE_ITEMS = [
  { id: 'head_up', text: 'رفع رأس السرير (30-45 درجة)', ar: 'Elevation of Head of Bed' },
  { id: 'sedation_vacation', text: 'تقييم يومي لفصل الجهاز (Sedation Vacation)', ar: 'Daily Sedation Assessment' },
  { id: 'peptic_ulcer', text: 'الوقاية من قرحة المعدة', ar: 'Peptic Ulcer Prophylaxis' },
  { id: 'dvt_prophylaxis', text: 'الوقاية من جلطات الأوردة العميقة', ar: 'DVT Prophylaxis' },
  { id: 'oral_care', text: 'نظافة الفم بالكلورهيكسيدين', ar: 'Daily Oral Care' }
];

const BundleCheck = ({ patientId, patientName }) => {
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(false);

  const handleCheck = (id) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveBundle = async () => {
    setLoading(true);
    const complianceScore = (Object.values(checks).filter(Boolean).length / VAP_BUNDLE_ITEMS.length) * 100;
    
    const bundleData = {
      patientId,
      patientName,
      checkDate: new Date().toISOString(),
      items: checks,
      score: complianceScore,
      type: 'VAP'
    };

    try {
      await push(ref(db, 'bundle_checks'), bundleData);
      alert(`تم الحفظ بنجاح! نسبة الالتزام: ${complianceScore}%`);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-2xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h3 className="text-2xl font-black text-slate-900">حزمة الوقاية من VAP</h3>
        <p className="text-blue-600 font-bold">المريض: {patientName}</p>
      </div>

      <div className="space-y-4">
        {VAP_BUNDLE_ITEMS.map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleCheck(item.id)}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              checks[item.id] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <div>
              <p className="font-black text-slate-800">{item.text}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{item.ar}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checks[item.id] ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200'}`}>
              {checks[item.id] && '✓'}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={saveBundle}
        disabled={loading}
        className="w-full mt-8 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-50"
      >
        {loading ? 'جاري الحفظ...' : 'اعتماد تقرير المرور اليومي'}
      </button>
    </div>
  );
};

export default BundleCheck;