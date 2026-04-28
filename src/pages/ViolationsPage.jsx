/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config'; 
import { ref, onValue, update, push, get, remove } from "firebase/database"; 
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

// --- الإعدادات الثابتة ونظام النقاط والمستوى ---
const ADMIN_PASSWORD = "1234"; 

const INFECTION_TEAM = [
  "م / مصطفي منصور محمد", 
  "د / اسماء محمد جودة", 
  "د / تغريد هاشم", 
  "د / رضوه فضل", 
  "م / محمود محمد محمود", 
  "م / محمود السيد الجندي", 
  "م / زينا محمد عبد اللاه", 
  "م / اسماء عبدالعزيز حسين", 
  "م / ندي خيري مختار", 
  "م / عزيزة محمود محمد"
];

const VIOLATION_MAP = {
  'إهمال لحظات غسيل الأيدي الـ 5': { cat: '🧼 Hand Hygiene', points: 5, sev: 'M' },
  'عدم توفر أو استخدام الكحول/المطهر': { cat: '🧼 Hand Hygiene', points: 2, sev: 'L' },
  'عدم ارتداء الواقيات الشخصية المطلوبة (PPE)': { cat: '🧤 PPE Compliance', points: 10, sev: 'H' },
  'إعادة استخدام أدوات الاستخدام الواحد': { cat: '🧤 PPE Compliance', points: 20, sev: 'H' },
  'ارتداء الواقيات بشكل غير صحيح': { cat: '🧤 PPE Compliance', points: 3, sev: 'L' },
  'خرق بروتوكول العزل (تلامس/رذاذ/هواء)': { cat: '🏥 Isolation', points: 15, sev: 'H' },
  'التعامل الخطر مع الإبر (تغطية السن/تركها)': { cat: '💉 Sharps Safety', points: 15, sev: 'H' },
  'امتلاء أو غياب صندوق الآلات الحادة': { cat: '💉 Sharps Safety', points: 5, sev: 'M' },
  'استخدام أدوات غير معقمة / منتهية التعقيم': { cat: '🧪 Sterilization', points: 25, sev: 'H' },
  'عدم تطهير الأجهزة الطبية بين المرضى': { cat: '🧪 Sterilization', points: 5, sev: 'M' },
  'سوء نظافة بيئة المريض أو تراكم مخلفات': { cat: '🧹 Cleaning', points: 2, sev: 'L' },
  'خلط النفايات الطبية مع النفايات العادية': { cat: '🗑️ Waste Management', points: 5, sev: 'M' },
  'عدم التحقق من هوية المريض / دواء خاطئ': { cat: '🚑 Safety', points: 30, sev: 'H' }
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState(null);
  
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionSub, setActionSub] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [archiveLimit, setArchiveLimit] = useState(10);

  const initialViolationState = { 
    id: null, 
    staffName: '', 
    staffRole: '', 
    department: '', 
    type: 'إهمال لحظات غسيل الأيدي الـ 5', 
    initialNote: '',
    observer: '',
    source: 'hai_events'
  };
  
  const [newViolation, setNewViolation] = useState(initialViolationState);

  const getRepetitionCount = (staffName, violationType) => {
    return documentedReports.filter(r => r.staffName === staffName && r.infectionType === violationType).length;
  };

  const checkAuth = () => {
    const pass = prompt("برجاء إدخال الرقم السري للصلاحية:");
    return pass === ADMIN_PASSWORD;
  };

  useEffect(() => {
  onValue(ref(db, 'field_violations'), (snapshot) => {
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

  const filteredStaffNames = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return Object.keys(staffDatabase).filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, staffDatabase]);

const saveViolation = async () => {
  if(!newViolation.staffName) return alert("يرجى إدخال اسم الشخص المعني");
  
  try {
    const dataToSave = {
      staffName: newViolation.staffName,
      staffRole: newViolation.staffRole,
      department: newViolation.department,
      infectionType: newViolation.type,
      initialNote: newViolation.initialNote,
      observer: newViolation.observer,
      timestamp: new Date().toLocaleString('ar-EG'),
      status: 'pending'
    };

    if (newViolation.id) {
      if (!checkAuth()) return;
      const targetPath = newViolation.source === 'violation_reports' 
        ? `violation_reports/${newViolation.id}` 
        : `field_violations/${newViolation.id}`;
      
      await update(ref(db, targetPath), dataToSave);
      alert("تم تحديث البيانات بنجاح");
    } else {
      await push(ref(db, 'field_violations'), dataToSave); 
      // تم إزالة alert النجاح هنا بناءً على طلبك
    }
    setShowAddModal(false);
  } catch (e) {
    console.error(e);
    alert("خطأ في الحفظ");
  }
};

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
    const approverName = prompt("برجاء إدخال اسم المسؤول الذي يؤكد الامتثال:");
    if (!approverName) return;
    if (!checkAuth()) return alert("عفواً، الرقم السري غير صحيح");

    const refundPoints = Math.ceil(report.pointsDeducted * 0.8);
    const currentStaffScore = staffDatabase[report.staffName]?.score || 100;
    const updatedScore = Math.min(100, currentStaffScore + refundPoints);
    
    if (window.confirm(`هل تؤكد امتثال ${report.staffName}؟ سيتم رد ${refundPoints} نقطة لرصيده.`)) {
      try {
        await update(ref(db, `violation_reports/${report.id}`), { 
          isComplied: true,
          compliedBy: approverName,
          complianceDate: new Date().toLocaleString('ar-EG')
        });
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
              new TextRun({ text: `نرفع لسيادتكم تقرير الرصد الميداني ليوم (${report.actionDate || report.timestamp})، حيث تلاحظ قيام السيد/ `, size: 28 }),
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
          new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: report.processedBy || "وحدة مكافحة العدوى", size: 24 })] }),
        ],
      }],
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, `مذكرة_عرض_مكافحة_العدوى_${report.staffName}.docx`));
  };

  const confirmAction = async () => {
    if(!actionSub && !customNote) return alert("يرجى اختيار سبب");
    const adminUser = prompt("برجاء إدخل اسم المسؤول عن مراجعة الإجراء:");
    if (!adminUser) return alert("يجب تسجيل اسم المسؤول لمتابعة الإجراء");

    try {
      const repetitionCount = getRepetitionCount(selectedAlert.staffName, selectedAlert.infectionType);
      
      if (repetitionCount === 2) {
        alert(`⚠️ تنبيه هـام: هذه هي المخالفة الثالثة للموظف (${selectedAlert.staffName}). يرجى اتخاذ إجراء إداري مشدد.`);
      }

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
        isComplied: false,
        processedBy: adminUser,
        repetitionIndex: repetitionCount + 1,
        severity: VIOLATION_MAP[selectedAlert.infectionType]?.sev || 'L'
      };

      setShowActionModal(false);
      await push(ref(db, 'violation_reports'), reportData);
      await update(ref(db, `field_violations/${selectedAlert.id}`), { status: 'completed' });
      await update(ref(db, `staff_scores/${selectedAlert.staffName}`), { score: newScore });
      
      alert("تم توثيق المخالفة بنجاح");
    } catch (e) { 
      console.error(e); 
      alert("حدث خطأ أثناء حفظ البيانات");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 font-sans text-right bg-slate-50 min-h-screen" dir="rtl">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center shadow-sm gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight flex items-center gap-3">
            رصد المخالفات والامتثال 🛡️
          </h1>
          <p className="text-red-600 font-bold text-sm mt-1">نظام تتبع سياسات مكافحة العدوى - مستشفيات جامعة سوهاج</p>
        </div>
        <button onClick={() => { setNewViolation(initialViolationState); setShowAddModal(true); }} className="w-full md:w-auto bg-red-600 text-white px-10 py-5 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2">
            <span className="text-xl">+</span> تسجيل مخالفة ميدانية
        </button>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-[10px] mb-1">إجمالي الحالات المرصودة</p>
          <h4 className="text-3xl font-black text-blue-700">{stats.total}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-[10px] mb-1">القسم الأكثر رصداً</p>
          <h4 className="text-lg font-black text-slate-800 truncate">{stats.topDept[0]}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-[10px] mb-1">معدل الامتثال الفني</p>
          <h4 className="text-3xl font-black text-emerald-600">{stats.rate}%</h4>
        </div>
        
        <div className="bg-blue-900 p-6 rounded-[2rem] shadow-xl text-white border-b-4 border-blue-600">
          <p className="opacity-80 font-bold text-[10px] mb-1">التقييم العام للمنشأة</p>
          <h4 className="text-lg font-black text-white">{stats.rate > 60 ? "✅ وضع آمن" : "⚠️ يحتاج تدخل"}</h4>
        </div>
      </section>

      {/* Active Alerts */}
      <div className="flex items-center gap-3 mr-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
          <h2 className="font-black text-slate-800">بلاغات قيد المعالجة</h2>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeAlerts.length === 0 && <p className="text-slate-400 font-bold p-8 text-center col-span-full bg-white rounded-3xl border-2 border-dashed">لا يوجد بلاغات نشطة حالياً..</p>}
        {activeAlerts.map(alert => (
          <div key={alert.id} className="bg-white p-6 rounded-[2.5rem] shadow-md border-r-[12px] border-orange-500 relative transition-transform hover:shadow-xl">
              <div className="absolute top-4 left-4 flex gap-2">
                 <button 
                  onClick={() => {
                    setNewViolation({
                      id: alert.id,
                      staffName: alert.staffName,
                      staffRole: alert.staffRole,
                      department: alert.department,
                      type: alert.infectionType,
                      initialNote: alert.initialNote || '',
                      observer: alert.observer || '',
                      source: 'hai_events'
                    });
                    setShowAddModal(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-xs" title="تعديل البيانات">✏️</button>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">الرصيد: {staffDatabase[alert.staffName]?.score || 100}</div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                    VIOLATION_MAP[alert.infectionType]?.sev === 'H' ? 'bg-red-100 text-red-600' : 
                    VIOLATION_MAP[alert.infectionType]?.sev === 'M' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {VIOLATION_MAP[alert.infectionType]?.sev === 'H' ? '🔴 خطورة عالية' : 
                     VIOLATION_MAP[alert.infectionType]?.sev === 'M' ? '🟡 متوسطة' : '🟢 بسيطة'}
                  </span>
                  {getRepetitionCount(alert.staffName, alert.infectionType) > 0 && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold animate-pulse">
                      ⚠️ تكرار ({getRepetitionCount(alert.staffName, alert.infectionType)})
                    </span>
                  )}
              </div>

              <h3 className="font-black text-xl text-slate-800">{alert.staffName}</h3>
              <p className="text-slate-500 font-bold text-xs mb-3">{alert.staffRole} | {alert.department}</p>
              <div className="bg-orange-50 p-4 rounded-2xl mb-2 text-orange-700 font-bold text-xs leading-relaxed border border-orange-100">{alert.infectionType}</div>
              <p className="text-[10px] mb-3 text-blue-600 font-bold italic">👤 الراصد: {alert.observer}</p>
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
          <span>📂 سجل المخالفات الموثقة</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50">
              <tr className="text-slate-400 text-xs">
                <th className="p-4">الموظف والراصد</th>
                <th className="p-4 text-center">الخصم</th>
                <th className="p-4 text-center">الرصيد</th>
                <th className="p-4 text-center">التكرار</th>
                <th className="p-4 text-center">سجل التتبع</th>
                <th className="p-4 text-center">حالة الامتثال</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {documentedReports.slice(0, archiveLimit).map(report => (
                <tr key={report.id} className="border-t hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-black text-slate-900">{report.staffName}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{report.department}</span>
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">الراصد: {report.observer}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-red-500 font-black">-{report.pointsDeducted}</td>
                  <td className="p-4 text-center font-black text-slate-700">{report.newTotalScore}</td>
                  <td className="p-4 text-center">
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold">مرة {report.repetitionIndex || 1}</span>
                  </td>
                  <td className="p-4 text-center">
                      <button onClick={() => { setSelectedReportForDetails(report); setShowDetailsModal(true); }} className="text-xl hover:scale-110 transition-transform">👁️</button>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleCompliance(report)} disabled={report.isComplied} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${report.isComplied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}>
                      {report.isComplied ? '✅ تم الامتثال' : '🔔 طلب امتثال'}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3 items-center">
                      <button 
                        onClick={() => {
                          setNewViolation({
                            id: report.id,
                            staffName: report.staffName,
                            staffRole: report.staffRole,
                            department: report.department,
                            type: report.infectionType,
                            initialNote: report.initialNote || report.customNote || '',
                            observer: report.observer,
                            source: 'violation_reports'
                          });
                          setShowAddModal(true);
                        }}
                        className="text-xl hover:scale-110" title="تعديل السجل">📝</button>
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

      {/* MODAL: سجل التتبع */}
      {showDetailsModal && selectedReportForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative text-right" dir="rtl">
                <button onClick={() => setShowDetailsModal(false)} className="absolute top-6 left-6 text-slate-300 hover:text-slate-600 font-black">✕</button>
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">🔍 تفاصيل سجل المخالفة</h2>
                
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">الموظف والمخالفة</p>
                        <p className="font-black text-slate-700 text-sm">{selectedReportForDetails.staffName} ({selectedReportForDetails.department})</p>
                        <p className="text-xs mt-1 text-red-600 font-bold">{selectedReportForDetails.infectionType}</p>
                    </div>

                    <div className="relative border-r-2 border-slate-100 mr-4 pr-6 space-y-6 py-2">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase">1. مرحلة الرصد الميداني</p>
                            <p className="text-xs font-bold text-slate-700">الراصد: {selectedReportForDetails.observer}</p>
                            <p className="text-[9px] text-slate-400 italic">بتاريخ: {selectedReportForDetails.timestamp}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-orange-600 uppercase">2. مرحلة التوثيق والخصم</p>
                            <p className="text-xs font-bold text-slate-700">المسؤول: {selectedReportForDetails.processedBy}</p>
                            <p className="text-xs text-slate-500">القرار: {selectedReportForDetails.subAction}</p>
                            <p className="text-[9px] text-slate-400 italic">التوقيت: {selectedReportForDetails.fullTimestamp}</p>
                        </div>
                        <div>
                            <p className={`text-[10px] font-black ${selectedReportForDetails.isComplied ? 'text-green-600' : 'text-slate-300'} uppercase`}>3. حالة الامتثال النهائي</p>
                            {selectedReportForDetails.isComplied ? (
                                <p className="text-xs font-bold text-slate-700">تم التأكيد بواسطة: {selectedReportForDetails.compliedBy} في {selectedReportForDetails.complianceDate}</p>
                            ) : <p className="text-[10px] text-slate-400">لا يزال في انتظار الامتثال..</p>}
                        </div>
                    </div>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="w-full mt-6 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs">إغلاق النافذة</button>
            </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl space-y-6 text-right" dir="rtl">
              <h2 className="text-2xl font-black text-slate-800 text-center">{actionType}</h2>
              <p className="text-red-500 font-bold text-sm text-center">سيتم خصم {VIOLATION_MAP[selectedAlert?.infectionType]?.points} نقطة</p>
              
              {getRepetitionCount(selectedAlert?.staffName, selectedAlert?.infectionType) > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl text-center">
                  <p className="text-orange-700 font-black text-xs">⚠️ تنبيه تكرار المخالفة</p>
                  <p className="text-[10px] text-orange-600 mt-1">هذا الموظف سجل {getRepetitionCount(selectedAlert.staffName, selectedAlert.infectionType)} حالة سابقة لنفس النوع.</p>
                </div>
              )}

              <div className="space-y-4">
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-sm outline-none" onChange={(e) => setActionSub(e.target.value)}>
                    <option value="">-- اختر السبب الرئيسي --</option>
                    {actionType === 'توجيه فني' ? (
                      <>
                        <option value="تنبيه شفهي مع توضيح الإجراء الصحيح">تنبيه شفهي مع توضيح الإجراء الصحيح</option>
                        <option value="تدريب عملي سريع وإعادة شرح البروتوكول المعتمد">تدريب عملي سريع وإعادة شرح البروتوكول المعتمد</option>
                        <option value="المتابعة المستمرة للتأكد من الالتزام تصحيح المسار">المتابعة المستمرة للتأكد من الالتزام تصحيح المسار</option>
                      </>
                    ) : (
                      <>
                        <option value="رفض اتباع تعليمات مكافحة العدوى">رفض اتباع تعليمات مكافحة العدوى</option>
                        <option value="إهمال متعمد وتكرار المخالفة">إهمال متعمد وتكرار المخالفة</option>
                        <option value="عدم الالتزام ببروتوكول مكافحة العدوى">عدم الالتزام ببروتوكول مكافحة العدوى</option>
                      </>
                    )}
                </select>
                <textarea placeholder="ملاحظات فنية إضافية..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none h-24 resize-none text-sm outline-none" onChange={(e) => setCustomNote(e.target.value)} />
              </div>
              <button onClick={confirmAction} className={`w-full py-5 rounded-2xl font-black text-white shadow-lg ${actionType === 'مذكرة إدارية' ? 'bg-red-600' : 'bg-emerald-600'}`}>تأكيد الإجراء</button>
              <button onClick={() => setShowActionModal(false)} className="w-full text-slate-400 font-bold text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl space-y-4 text-right max-h-[90vh] overflow-y-auto" dir="rtl">
            <h2 className="text-2xl font-black text-slate-900">{newViolation.id ? 'تعديل بيانات السجل ✏️' : 'تسجيل مخالفة جديدة 🛡️'}</h2>
            
            <div className="relative">
              <label className="block text-xs font-black text-slate-500 mb-1 mr-2">اسم الشخص المعني:</label>
              <input 
                type="text" 
                placeholder="اكتب الاسم او ابحث عنه..." 
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-blue-50 focus:border-blue-400 outline-none transition-all text-right"
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
                  <option value="">حدد الوظيفة...</option>
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 mr-2">القسم:</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none" value={newViolation.department} onChange={(e) => setNewViolation({...newViolation, department: e.target.value})}>
                  <option value="">حدد القسم...</option>
                  {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1 mr-2">نوع المخالفة المكتشفة:</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none" value={newViolation.type} onChange={(e) => setNewViolation({...newViolation, type: e.target.value})}>
                {Object.keys(VIOLATION_MAP).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1 mr-2">الراصد من فريق مكافحة العدوي:</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none" value={newViolation.observer} onChange={(e) => setNewViolation({...newViolation, observer: e.target.value})}>
                <option value="">حدد الاسم...</option>
                {INFECTION_TEAM.map(member => <option key={member} value={member}>{member}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1 mr-2">ملاحظات ميدانية (اختياري):</label>
              <textarea 
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none h-24 resize-none" 
                placeholder="اكتب تفاصيل ما تم رصده..."
                value={newViolation.initialNote}
                onChange={(e) => setNewViolation({...newViolation, initialNote: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={saveViolation} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
                {newViolation.id ? 'حفظ التعديلات' : 'تأكيد التسجيل'}
              </button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationsPage;