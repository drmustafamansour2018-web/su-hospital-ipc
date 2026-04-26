import React, { useState, useEffect } from 'react';
import { db, ref, onValue, remove } from '../firebase/config';

const Reports = () => {
  const [haiReports, setHaiReports] = useState([]);
  const [bundleReports, setBundleReports] = useState([]);
  const [activeTab, setActiveTab] = useState('hai');

  useEffect(() => {
    // 1. جلب تقارير العدوى HAI
    const haiRef = ref(db, 'hai_events');
    onValue(haiRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
        setHaiReports(list);
      } else {
        setHaiReports([]);
      }
    });

    // 2. جلب تقارير حزم الوقاية Bundles
    const bundleRef = ref(db, 'bundle_checks');
    onValue(bundleRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
        setBundleReports(list);
      } else {
        setBundleReports([]);
      }
    });
  }, []);

  // --- دالة حذف سجل واحد فقط ---
  const deleteSingleRecord = (id, type) => {
    const password = prompt("قفل الأمان: أدخل الرقم السري للحذف (1234):");
    
    if (password === "1234") {
      const path = type === 'hai' ? `hai_events/${id}` : `bundle_checks/${id}`;
      if (window.confirm("هل أنت متأكد من حذف هذا السجل؟")) {
        remove(ref(db, path))
          .catch((err) => alert("خطأ: " + err.message));
      }
    } else if (password !== null) {
      alert("⚠️ الرقم السري خطأ");
    }
  };

  // --- دالة الحذف الشامل ---
  const clearHistory = (type) => {
    const password = prompt(`تنبيه: سيتم مسح سجل ${type === 'hai' ? 'العدوى' : 'الوقاية'} بالكامل. أدخل الباسورد:`);
    if (password === "1234") {
      const path = type === 'hai' ? 'hai_events' : 'bundle_checks';
      if (window.confirm("هل أنت متأكد حقاً؟ لا يمكن التراجع عن هذه الخطوة.")) {
        remove(ref(db, path))
          .then(() => alert("✅ تم تصفير السجل بنجاح"))
          .catch((err) => alert("❌ خطأ: " + err.message));
      }
    } else if (password !== null) {
      alert("⚠️ باسوورد غير صحيح");
    }
  };

  return (
    <div className="p-4 md:p-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">سجل التقارير المركزي</h2>
          <p className="text-slate-500 font-bold mt-2">وحدة مكافحة العدوى - مستشفى سوهاج الجامعي</p>
        </div>
        
        {((activeTab === 'hai' && haiReports.length > 0) || (activeTab === 'bundles' && bundleReports.length > 0)) && (
          <button 
            onClick={() => clearHistory(activeTab)}
            className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            🗑️ تصفير قائمة {activeTab === 'hai' ? 'العدوى' : 'الوقاية'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-slate-100 p-2 rounded-[2rem] w-fit">
        <button onClick={() => setActiveTab('hai')} className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'hai' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}>
          سجل HAI 🦠
        </button>
        <button onClick={() => setActiveTab('bundles')} className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'bundles' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}>
          سجل الحزم ✅
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase tracking-widest">
              <th className="p-6 font-black">التاريخ</th>
              <th className="p-6 font-black">اسم المريض</th>
              {activeTab === 'hai' ? (
                <>
                  <th className="p-6 font-black">القسم</th>
                  <th className="p-6 font-black">العدوى</th>
                  <th className="p-6 font-black">الميكروب</th>
                </>
              ) : (
                <>
                  <th className="p-6 font-black">النوع</th>
                  <th className="p-6 font-black">الالتزام</th>
                  <th className="p-6 font-black">النتيجة</th>
                </>
              )}
              <th className="p-6 font-black text-center">إدارة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'hai' ? (
              haiReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6 text-slate-400 font-bold text-[10px]">{new Date(report.timestamp).toLocaleDateString('ar-EG')}</td>
                  <td className="p-6 font-black text-slate-800">{report.patientName}</td>
                  <td className="p-6 font-bold text-blue-600">{report.department}</td>
                  <td className="p-6"><span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-black text-[10px]">{report.infectionType}</span></td>
                  <td className="p-6 font-bold text-slate-400 italic text-sm">{report.organism || '---'}</td>
                  <td className="p-6 text-center">
                    <button onClick={() => deleteSingleRecord(report.id, 'hai')} className="w-9 h-9 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto opacity-0 group-hover:opacity-100">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              bundleReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6 text-slate-400 font-bold text-[10px]">{new Date(report.checkDate).toLocaleDateString('ar-EG')}</td>
                  <td className="p-6 font-black text-slate-800">{report.patientName}</td>
                  <td className="p-6 font-bold text-slate-400 text-sm">{report.type}</td>
                  <td className="p-6"><span className="font-black text-blue-600">{report.score?.toFixed(0)}%</span></td>
                  <td className="p-6 text-[10px] font-black">{report.score >= 80 ? '✓' : '⚠️'}</td>
                  <td className="p-6 text-center">
                    <button onClick={() => deleteSingleRecord(report.id, 'bundles')} className="w-9 h-9 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto opacity-0 group-hover:opacity-100">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;