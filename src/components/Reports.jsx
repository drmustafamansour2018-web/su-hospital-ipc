import React, { useState, useEffect } from 'react';
import { db, ref, onValue } from '../firebase/config';

const Reports = () => {
  const [haiReports, setHaiReports] = useState([]);
  const [bundleReports, setBundleReports] = useState([]);
  const [activeTab, setActiveTab] = useState('hai'); // للتبديل بين التقارير

  useEffect(() => {
    // 1. جلب تقارير العدوى HAI
    const haiRef = ref(db, 'hai_events');
    onValue(haiRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).reverse(); // الأحدث أولاً
        setHaiReports(list);
      }
    });

    // 2. جلب تقارير حزم الوقاية Bundles
    const bundleRef = ref(db, 'bundle_checks');
    onValue(bundleRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).reverse();
        setBundleReports(list);
      }
    });
  }, []);

  return (
    <div className="p-4 md:p-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="mb-10 text-center md:text-right">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">سجل تقارير مكافحة العدوى</h2>
        <p className="text-slate-500 font-bold mt-2">مستشفيات جامعة سوهاج - قاعدة البيانات المركزية</p>
      </div>

      {/* Tabs للتبديل */}
      <div className="flex gap-4 mb-8 bg-slate-100 p-2 rounded-[2rem] w-fit mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('hai')}
          className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'hai' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          سجل حالات HAI 🦠
        </button>
        <button 
          onClick={() => setActiveTab('bundles')}
          className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'bundles' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          سجل حزم الوقاية ✅
        </button>
      </div>

      {/* جدول تقارير العدوى */}
      {activeTab === 'hai' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-6 font-black text-sm">التاريخ</th>
                <th className="p-6 font-black text-sm">اسم المريض</th>
                <th className="p-6 font-black text-sm">القسم</th>
                <th className="p-6 font-black text-sm">نوع العدوى</th>
                <th className="p-6 font-black text-sm">الميكروب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {haiReports.map((report, index) => (
                <tr key={index} className="hover:bg-orange-50 transition-colors">
                  <td className="p-6 text-slate-500 font-bold text-xs">{new Date(report.timestamp).toLocaleDateString('ar-EG')}</td>
                  <td className="p-6 font-black text-slate-800">{report.patientName}</td>
                  <td className="p-6 font-bold text-blue-600">{report.department}</td>
                  <td className="p-6">
                    <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full font-black text-xs">{report.infectionType}</span>
                  </td>
                  <td className="p-6 font-bold text-slate-400 italic">{report.organism || 'غير محدد'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {haiReports.length === 0 && <p className="p-10 text-center font-bold text-slate-400">لا توجد حالات مسجلة بعد</p>}
        </div>
      )}

      {/* جدول تقارير الوقاية (Bundles) */}
      {activeTab === 'bundles' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-6 font-black text-sm">التاريخ</th>
                <th className="p-6 font-black text-sm">اسم المريض</th>
                <th className="p-6 font-black text-sm">النوع</th>
                <th className="p-6 font-black text-sm">نسبة الالتزام</th>
                <th className="p-6 font-black text-sm">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bundleReports.map((report, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="p-6 text-slate-500 font-bold text-xs">{new Date(report.checkDate).toLocaleDateString('ar-EG')}</td>
                  <td className="p-6 font-black text-slate-800">{report.patientName}</td>
                  <td className="p-6 font-bold text-slate-400">{report.type}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all" style={{ width: `${report.score}%` }}></div>
                      </div>
                      <span className="font-black text-blue-600">{report.score.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="p-6">
                    {report.score >= 80 ? 
                      <span className="text-emerald-600 font-black text-xs">✓ ممتاز</span> : 
                      <span className="text-red-500 font-black text-xs">! يحتاج مراجعة</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bundleReports.length === 0 && <p className="p-10 text-center font-bold text-slate-400">لم يتم إجراء مرور وقائي بعد</p>}
        </div>
      )}
    </div>
  );
};

export default Reports;