import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config'; 
import { ref, onValue, update, push, get, remove } from "firebase/database"; 
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

// --- الإعدادات الثابتة ونظام النقاط ---
const ADMIN_PASSWORD = "1234"; 

const VIOLATION_MAP = {
  'إهمال لحظات غسيل الأيدي الـ 5': { cat: '🧼 Hand Hygiene', points: 5 },
  'عدم توفر أو استخدام الكحول/المطهر': { cat: '🧼 Hand Hygiene', points: 2 },
  'عدم ارتداء الواقيات الشخصية المطلوبة (PPE)': { cat: '🧤 PPE Compliance', points: 10 },
  'إعادة استخدام أدوات الاستخدام الواحد': { cat: '🧤 PPE Compliance', points: 20 },
  'ارتداء الواقيات بشكل غير صحيح': { cat: '🧤 PPE Compliance', points: 3 },
  'خرق بروتوكول العزل (تلامس/رذاذ/هواء)': { cat: '🏥 Isolation', points: 15 },
  'التعامل الخطر مع الإبر (تغطية السن/تركها)': { cat: '💉 Sharps Safety', points: 15 },
  'امتلاء أو غياب صندوق الآلات الحادة': { cat: '💉 Sharps Safety', points: 5 },
  'استخدام أدوات غير معقمة / منتهية التعقيم': { cat: '🧪 Sterilization', points: 25 },
  'عدم تطهير الأجهزة الطبية بين المرضى': { cat: '🧪 Sterilization', points: 5 },
  'سوء نظافة بيئة المريض أو تراكم مخلفات': { cat: '🧹 Cleaning', points: 2 },
  'خلط النفايات الطبية مع النفايات العادية': { cat: '🗑️ Waste Management', points: 5 },
  'عدم التحقق من هوية المريض / دواء خاطئ': { cat: '🚑 Safety', points: 30 }
};

const ALL_DEPARTMENTS = ["العناية المركزة", "العمليات الكبرى", "الاستقبال والطوارئ", "المبتسرين", "الغسيل الكلوي", "المناظير", "التعقيم", "المعمل", "الأشعة"];
const STAFF_ROLES = ["طبيب", "تمريض", "فني تحاليل", "فني أشعة", "عامل", "أخرى"];

const ViolationsPage = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [documentedReports, setDocumentedReports] = useState([]);
  const [staffDatabase, setStaffDatabase] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionSub, setActionSub] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [archiveLimit, setArchiveLimit] = useState(10);

  const initialViolationState = { staffName: '', staffRole: 'تمريض', department: 'العناية المركزة', type: 'إهمال لحظات تطهير الأيدي الـ 5 (WHO)', initialNote: '' };
  const [newViolation, setNewViolation] = useState(initialViolationState);

  const checkAuth = () => {
    const pass = prompt("برجاء إدخال الرقم السري للصلاحية:");
    return pass === ADMIN_PASSWORD;
  };

  useEffect(() => {
    onValue(ref(db, 'hai_events'), (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })).filter(i => i.status !== 'completed') : [];
      setActiveAlerts(list.reverse());
    });

    onValue(ref(db, 'violation_reports'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setDocumentedReports(list.sort((a,b) => (b.timestamp_ms || 0) - (a.timestamp_ms || 0)));
      } else {
        setDocumentedReports([]);
      }
    });

    onValue(ref(db, 'staff_scores'), (snapshot) => {
      setStaffDatabase(snapshot.val() || {});
    });
  }, []);

  const stats = useMemo(() => {
    const total = documentedReports.length + activeAlerts.length;
    const deptMap = {};
    [...documentedReports, ...activeAlerts].forEach(r => { deptMap[r.department] = (deptMap[r.department] || 0) + 1; });
    const topDept = Object.entries(deptMap).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    const complied = documentedReports.filter(r => r.isComplied).length;
    const rate = total > 0 ? Math.round((complied / total) * 100) : 0;
    return { total, topDept, rate };
  }, [activeAlerts, documentedReports]);

  const topPerformers = useMemo(() => {
    return Object.entries(staffDatabase).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.score - a.score).slice(0, 2);
  }, [staffDatabase]);

  const filteredStaffNames = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return Object.keys(staffDatabase).filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, staffDatabase]);

  const deleteFinal = async (report) => {
    if (!report.id) return alert("خطأ: المعرف الخاص بهذا السجل غير موجود");
    if (!checkAuth()) return alert("عفواً، الرقم السري غير صحيح");

    if (window.confirm(`هل أنت متأكد من حذف مخالفة الموظف "${report.staffName}" نهائياً؟`)) {
      try {
        if (!report.isComplied) {
          const currentScore = staffDatabase[report.staffName]?.score || 100;
          const restoredScore = Math.min(100, currentScore + (report.pointsDeducted || 0));
          await update(ref(db, `staff_scores/${report.staffName}`), { score: restoredScore });
        }
        await remove(ref(db, `violation_reports/${report.id}`));
        alert("تم الحذف بنجاح");
      } catch (e) { console.error(e); }
    }
  };

  const handleCompliance = async (report) => {
    if (report.isComplied) return;
    if (!checkAuth()) return alert("عفواً، الرقم السري غير صحيح");

    const refundPoints = Math.ceil(report.pointsDeducted * 0.8);
    const currentStaffScore = staffDatabase[report.staffName]?.score || 100;
    const updatedScore = Math.min(100, currentStaffScore + refundPoints);
    
    if (window.confirm(`هل تؤكد امتثال ${report.staffName}؟ سيتم رد ${refundPoints} نقطة لرصيده.`)) {
      try {
        await update(ref(db, `violation_reports/${report.id}`), { isComplied: true });
        await update(ref(db, `staff_scores/${report.staffName}`), { score: updatedScore });
      } catch (e) { console.error(e); }
    }
  };

  const exportToWord = (report) => {
    const doc = new Document({
      sections: [{
        properties: { textDirection: "rtl" },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "مستشفيات جامعة سوهاج", bold: true, size: 32 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "وحدة مكافحة العدوى", bold: true, size: 28 })] }),
          new Paragraph({ text: "\n" }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "مذكرة عرض", bold: true, size: 30, underline: {} })] }),
          new Paragraph({ text: "\n" }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "السيد الأستاذ الدكتور/ مدير وحدة مكافحة العدوى", bold: true, size: 28 })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "تحية طيبة وبعد،،", size: 28 })] }),
          new Paragraph({ text: "\n" }),
          new Paragraph({ 
            alignment: AlignmentType.RIGHT, 
            spacing: { line: 440 },
            children: [
              new TextRun({ text: `نرفع لسيادتكم تقرير الرصد الميداني ليوم (${report.actionDate})، حيث تلاحظ قيام السيد/ `, size: 28 }),
              new TextRun({ text: report.staffName, bold: true, size: 28 }),
              new TextRun({ text: `، بوظيفة (${report.staffRole}) بقسم (${report.department})، بارتكاب مخالفة صريحة لسياسات مكافحة العدوى المعتمدة، والمتمثلة في: `, size: 28 }),
              new TextRun({ text: report.infectionType, bold: true, color: "FF0000", size: 28 }),
            ] 
          }),
          new Paragraph({ text: "\n" }),
          new Paragraph({ 
            alignment: AlignmentType.RIGHT, 
            spacing: { line: 440 },
            children: [
              new TextRun({ text: `تفاصيل الرصد: ${report.initialNote || report.customNote || "لا توجد ملاحظات إضافية"}`, size: 24, italic: true }),
            ] 
          }),
          new Paragraph({ text: "\n" }),
          new Paragraph({ 
            alignment: AlignmentType.RIGHT, 
            spacing: { line: 440 },
            children: [
              new TextRun({ text: "وحيث إن هذا المسلك يعد خرقاً لبروتوكولات مكافحة العدوى، وإهمالاً قد يؤدي لتفشي العدوى المكتسبة داخل المنشأة، فإننا نوصي باتخاذ الإجراءات التأديبية اللازمة لضمان عدم التكرار.", size: 28 })
            ] 
          }),
          new Paragraph({ text: "\n" }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "وتفضلوا بقبول فائق الاحترام،،", size: 28 })] }),
          new Paragraph({ text: "\n\n" }),
          new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "مقدمه لسيادتكم/ ", size: 28 })] }),
        ],
      }],
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, `مذكرة_عرض_مكافحة_العدوى_${report.staffName}.docx`));
  };

  const confirmAction = async () => {
    if(!actionSub && !customNote) return alert("يرجى اختيار سبب");
    const pointsToDeduct = VIOLATION_MAP[selectedAlert.infectionType]?.points || 5;
    const currentScore = staffDatabase[selectedAlert.staffName]?.score || 100;
    const newScore = Math.max(0, currentScore - pointsToDeduct);
    const reportData = {
      ...selectedAlert,
      action: actionType,
      subAction: actionSub || "ملاحظة خاصة",
      customNote, 
      pointsDeducted: pointsToDeduct,
      newTotalScore: newScore,
      actionDate: new Date().toLocaleDateString('ar-EG'),
      fullTimestamp: new Date().toLocaleString('ar-EG'),
      timestamp_ms: Date.now(),
      status: 'documented',
      isComplied: false 
    };
    setShowActionModal(false);
    try {
      await push(ref(db, 'violation_reports'), reportData);
      await update(ref(db, `hai_events/${selectedAlert.id}`), { status: 'completed' });
      await update(ref(db, `staff_scores/${selectedAlert.staffName}`), { score: newScore });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 font-sans text-right bg-slate-50 min-h-screen" dir="rtl">
      
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-[2rem] text-white shadow-xl">
           <h2 className="text-lg font-black mb-3">🏆 لوحة الشرف</h2>
           <div className="flex gap-4">
             {topPerformers.map((p, idx) => (
               <div key={idx} className="bg-white/20 p-3 rounded-2xl flex-1 backdrop-blur-md border border-white/10">
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">المركز {idx+1}</p>
                 <p className="font-black truncate">{p.name}</p>
                 <p className="text-2xl font-black">{p.score} <span className="text-xs">نقطة</span></p>
               </div>
             ))}
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border flex justify-between items-center shadow-sm">
            <div>
      {/* العنوان الرئيسي المحدث */}
      <h1 className="text-2xl font-black text-slate-900 leading-tight">رصد المخالفات والامتثال 🛡️</h1>
      {/* الوصف المحدث */}
      <p className="text-red-600 font-bold text-sm">نظام تتبع سياسات مكافحة العدوى</p>
    </div>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-800 transition-all active:scale-95">تسجيل مخالفة</button>
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-[10px] mb-1">إجمالي المخالفات</p>
          <h4 className="text-3xl font-black text-blue-700">{stats.total}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-[10px] mb-1">الأكثر مخالفة</p>
          <h4 className="text-lg font-black text-slate-800 truncate">{stats.topDept[0]}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-[10px] mb-1">معدل الامتثال</p>
          <h4 className="text-3xl font-black text-emerald-600">{stats.rate}%</h4>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-lg text-white">
          <p className="opacity-60 font-bold text-[10px] mb-1">حالة المنشأة</p>
          <h4 className="text-lg font-black">{stats.rate > 60 ? "✅ مستقرة" : "⚠️ تحت الرصد"}</h4>
        </div>
      </section>

      {/* Active Alerts */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeAlerts.length === 0 && <p className="text-slate-400 font-bold p-8 text-center col-span-full">لا يوجد بلاغات نشطة حالياً..</p>}
        {activeAlerts.map(alert => (
          <div key={alert.id} className="bg-white p-6 rounded-[2.5rem] shadow-md border-r-[12px] border-orange-500 relative transition-transform hover:shadow-xl">
              <div className="absolute top-4 left-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">رصيده: {staffDatabase[alert.staffName]?.score || 100}</div>
              <h3 className="font-black text-xl mt-4 text-slate-800">{alert.staffName}</h3>
              <p className="text-slate-500 font-bold text-xs mb-3">{alert.staffRole} | {alert.department}</p>
              <div className="bg-orange-50 p-4 rounded-2xl mb-4 text-orange-700 font-bold text-xs leading-relaxed border border-orange-100">{alert.infectionType}</div>
              {alert.initialNote && <p className="text-[10px] mb-3 text-slate-400 italic">📝 {alert.initialNote}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setSelectedAlert(alert); setActionType('توجيه فني'); setShowActionModal(true); }} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl font-bold text-xs shadow-md">🎓 توجيه</button>
                <button onClick={() => { setSelectedAlert(alert); setActionType('مذكرة إدارية'); setShowActionModal(true); }} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold text-xs shadow-md">📝 مذكرة</button>
              </div>
          </div>
        ))}
      </section>

      {/* Archive */}
      <section className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-100">
        <h2 className="p-6 font-black text-xl border-b bg-slate-50/50 flex justify-between items-center">
          <span>📂 أرشيف المخالفات الموثقة</span>
          <span className="text-[10px] text-blue-600 font-bold">يتم تتبع المعرفات الفريدة لضمان الحذف</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50">
              <tr className="text-slate-400 text-xs">
                <th className="p-4">الموظف المعني</th>
                <th className="p-4 text-center">الخصم</th>
                <th className="p-4 text-center">الرصيد</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {documentedReports.slice(0, archiveLimit).map(report => (
                <tr key={report.id} className="border-t hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-black text-slate-900">{report.staffName}</p>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{report.department}</span>
                  </td>
                  <td className="p-4 text-center text-red-500 font-black">-{report.pointsDeducted}</td>
                  <td className="p-4 text-center font-black text-slate-700">{report.newTotalScore}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleCompliance(report)} disabled={report.isComplied} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${report.isComplied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}>
                      {report.isComplied ? '✅ تم' : '🔔 امتثال'}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3 items-center">
                      <button onClick={() => exportToWord(report)} className="text-xl hover:scale-110" title="تحميل Word">📄</button>
                      <button onClick={() => deleteFinal(report)} className="text-xl hover:scale-110 grayscale hover:grayscale-0" title="حذف نهائي">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {documentedReports.length > archiveLimit && (
            <div className="p-6 text-center border-t bg-slate-50/30">
               <button onClick={() => setArchiveLimit(prev => prev + 20)} className="text-blue-600 font-black text-sm hover:underline">عرض المزيد من السجلات (+20)</button>
            </div>
          )}
        </div>
      </section>

      {/* Action Modal (هنا تم استبدال الكلمات بمكافحة العدوى) */}
      {showActionModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl space-y-6 text-right" dir="rtl">
             <h2 className="text-2xl font-black text-slate-800 text-center">{actionType}</h2>
             <p className="text-red-500 font-bold text-sm text-center">سيتم خصم {VIOLATION_MAP[selectedAlert?.infectionType]?.points} نقطة</p>
             <div className="space-y-4">
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-sm outline-none" onChange={(e) => setActionSub(e.target.value)}>
                    <option value="">-- اختر السبب الرئيسي --</option>
                    <option value="رفض اتباع تعليمات مكافحة العدوى">رفض اتباع تعليمات مكافحة العدوى</option>
                    <option value="إهمال متعمد وتكرار المخالفة">إهمال متعمد وتكرار المخالفة</option>
                    <option value="عدم الالتزام ببروتوكول مكافحة العدوى">عدم الالتزام ببروتوكول مكافحة العدوى</option>
                </select>
                <textarea placeholder="ملاحظات فنية إضافية..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none h-24 resize-none text-sm outline-none" onChange={(e) => setCustomNote(e.target.value)} />
             </div>
             <button onClick={confirmAction} className={`w-full py-5 rounded-2xl font-black text-white shadow-lg ${actionType === 'مذكرة إدارية' ? 'bg-red-600' : 'bg-emerald-600'}`}>تأكيد الإجراء</button>
             <button onClick={() => setShowActionModal(false)} className="w-full text-slate-400 font-bold text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl space-y-4 text-right" dir="rtl">
            <h2 className="text-2xl font-black text-slate-900">تسجيل مخالفة جديدة</h2>
            <div className="relative">
              <label className="block text-xs font-black text-slate-500 mb-1 mr-2">اسم الموظف المخالف:</label>
              <input 
                type="text" 
                placeholder="اكتب أول حروف من الاسم..." 
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-blue-50 focus:border-blue-400 outline-none transition-all"
                value={newViolation.staffName}
                onChange={(e) => { 
                  setSearchTerm(e.target.value); 
                  setNewViolation({...newViolation, staffName: e.target.value}); 
                }}
              />
              {filteredStaffNames.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-blue-100 shadow-2xl rounded-2xl mt-2 z-[150] max-h-48 overflow-y-auto">
                  {filteredStaffNames.map(name => (
                    <div key={name} className="p-4 hover:bg-blue-50 cursor-pointer font-bold border-b border-slate-50 flex justify-between items-center"
                      onClick={() => {
                        const data = staffDatabase[name];
                        setNewViolation({ ...newViolation, staffName: name, staffRole: data.role, department: data.dept });
                        setSearchTerm('');
                      }}>
                      <span className="text-slate-800">👤 {name}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">{staffDatabase[name].dept}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 mr-2">الوظيفة:</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none" value={newViolation.staffRole} onChange={(e) => setNewViolation({...newViolation, staffRole: e.target.value})}>
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 mr-2">القسم:</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none" value={newViolation.department} onChange={(e) => setNewViolation({...newViolation, department: e.target.value})}>
                  {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1 mr-2">نوع المخالفة:</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[11px] border-none outline-none" onChange={(e) => setNewViolation({...newViolation, type: e.target.value})}>
                {Object.keys(VIOLATION_MAP).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1 mr-2">ملاحظات المعاينة الفورية:</label>
              <textarea 
                placeholder="صف ما رأيته باختصار..." 
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none h-20 resize-none text-sm outline-none" 
                value={newViolation.initialNote}
                onChange={(e) => setNewViolation({...newViolation, initialNote: e.target.value})} 
              />
            </div>

            <button onClick={async () => {
                if(!newViolation.staffName) return alert("يرجى كتابة اسم الموظف");
                setShowAddModal(false);
                setSearchTerm('');
                try {
                  const staffRef = ref(db, `staff_scores/${newViolation.staffName}`);
                  const snap = await get(staffRef);
                  if (!snap.exists()) {
                    await update(staffRef, { score: 100, role: newViolation.staffRole, dept: newViolation.department });
                  }
                  await push(ref(db, 'hai_events'), { 
                    ...newViolation, 
                    infectionType: newViolation.type, 
                    timestamp: new Date().toLocaleDateString('ar-EG'), 
                    timestamp_ms: Date.now(),
                    status: 'pending' 
                  });
                  setNewViolation(initialViolationState);
                } catch (e) { console.error(e); }
            }} className="w-full bg-blue-700 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-blue-800 transition-all mt-4">حفظ المخالفة 🛡️</button>
            <button onClick={() => { setShowAddModal(false); setSearchTerm(''); setNewViolation(initialViolationState); }} className="w-full text-slate-400 font-bold">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationsPage;