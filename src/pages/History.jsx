import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase/config';

const History = () => {
  const [auditHistory, setAuditHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const translateKey = (key) => {
    const translations = {
      'Hand Hygiene': 'نظافة وتطهير الأيدي',
      'PPE Compliance': 'الالتزام بمهمات الوقاية الشخصية',
      'Sterilization': 'إجراءات التعقيم المتبعة',
      'Waste Management': 'التخلص الآمن من النفايات الطبية',
      'Environmental Cleaning': 'تطهير ونظافة البيئة المحيطة',
      'Instrument Handling': 'تداول الآلات الجراحية المعقمة',
      'Sharps Safety': 'التعامل الآمن مع الآلات الحادة',
      'Operating Room Protocol': 'بروتوكول الانضباط داخل غرفة العمليات',
      'Staff Health': 'صحة وسلامة العاملين',
      'Ventilation System': 'كفاءة نظام التهوية والتكييف',
      'Anesthesia Safety': 'معايير مكافحة العدوى بالتخدير'
    };
    return translations[key] || key; 
  };

  useEffect(() => {
    const auditsRef = ref(db, 'audits');
    onValue(auditsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.keys(data).map(key => ({ 
          id: key, 
          ...data[key] 
        })).reverse();
        setAuditHistory(formattedData);
      }
      setLoading(false);
    });
  }, []);

  const downloadWord = (id) => {
    const content = document.getElementById(`report-${id}`).innerHTML;
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page WordSection1 {size: 595.3pt 841.9pt; margin: 72.0pt 72.0pt 72.0pt 72.0pt;}
          div.WordSection1 {page: WordSection1;}
          body {font-family: "Arial", sans-serif; direction: rtl; text-align: right;}
          table {width: 100%; border-collapse: collapse; margin-top: 10px;}
          th {border: 1px solid black; padding: 8px; font-size: 13pt; background-color: #f2f2f2;}
          td {border: 1px solid black; padding: 6px; font-size: 12pt;}
          h1 {font-size: 18pt; text-align: center; margin-bottom: 20px;}
          h2 {font-size: 18pt; text-align: center;}
          p {font-size: 14pt; line-height: 1.5;}
        </style>
      </head>
      <body><div class="WordSection1">${content}</div></body>
      </html>
    `;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Compliance_Report_${id.slice(-5)}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const getStatusText = (val) => {
    if (val === 'Pass') return { text: 'مطابق', color: '#059669' };
    if (val === 'Fail') return { text: 'سلبي', color: '#dc2626' };
    return { text: 'غير مطبق', color: '#64748b' };
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>جاري التحميل...</div>;

  return (
    <div dir="rtl" style={{ padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Arial' }}>
      {auditHistory.map((audit) => {
        const results = audit.data ? Object.values(audit.data) : [];
        const pass = results.filter(s => s === 'Pass').length;
        const score = results.length > 0 ? Math.round((pass / results.length) * 100) : 0;

        return (
          <div key={audit.id} style={{ marginBottom: '60px' }}>
            <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 10px', display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} style={btnStyle}>طباعة التقرير</button>
              <button onClick={() => downloadWord(audit.id)} style={{...btnStyle, backgroundColor: '#2b6cb0'}}>تحميل Word</button>
            </div>

            <div id={`report-${audit.id}`} style={{ backgroundColor: '#fff', maxWidth: '850px', margin: '0 auto', padding: '50px', border: '1px solid #000' }}>
              
              <table style={{ width: '100%', borderBottom: '2px solid #000', marginBottom: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '20%', border: 'none', textAlign: 'right' }}>
                      <div style={{ width: '80px', height: '80px', border: '1px dashed #eee' }}></div>
                    </td>
                    <td style={{ width: '60%', border: 'none', textAlign: 'center' }}>
                      <h2 style={{ margin: '0', fontSize: '18pt' }}>جامعة سوهاج</h2>
                      <h2 style={{ margin: '0', fontSize: '18pt' }}>مستشفيات جامعة سوهاج</h2>
                      <h3 style={{ margin: '0', fontSize: '14pt' }}>وحدة مكافحة العدوى</h3>
                    </td>
                    <td style={{ width: '20%', border: 'none', textAlign: 'left' }}>
                      <div style={{ width: '80px', height: '80px', border: '1px dashed #eee' }}></div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'left', fontSize: '12pt', marginBottom: '20px', fontWeight: 'bold' }}>
                <span>تاريخ التحرير: {audit.timestamp?.split(',')[0]}</span>
              </div>

              <h1 style={{ marginBottom: '25px', fontSize: '18pt', textAlign: 'center', fontWeight: 'bold' }}>
                تقرير تدقيق معايير مكافحة العدوى
              </h1>
              
              <p style={{ fontSize: '14pt' }}>إلى السيد الأستاذ الدكتور / مدير عام المستشفى الجامعي</p>
              <p style={{ fontSize: '14pt' }}>
                تحية طيبة وبعد،، نرفق لسيادتكم نتائج <strong>مراجعة الامتثال</strong> بمعايير مكافحة العدوى بـ <strong>قسم: ( عمليات .................... )</strong>، حيث بلغت نسبة الالتزام: <strong>{score}%</strong>
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'right', fontSize: '13pt' }}>عنصر التقييم والتدقيق</th>
                    <th style={{ border: '1.5px solid #000', padding: '8px', width: '110px', textAlign: 'center', fontSize: '13pt' }}>النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.data && Object.entries(audit.data).map(([item, status], idx) => {
                    const { text, color } = getStatusText(status);
                    return (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12pt' }}>{translateKey(item)}</td>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', color: color, fontSize: '12pt' }}>
                          {text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '14pt' }}>
                <div style={{ textAlign: 'center' }}>
                  <strong>أخصائي مكافحة العدوى</strong><br />
                  <span style={{ fontSize: '11pt' }}>(القائم بالتدقيق)</span><br /><br />
                  ..........................
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong>يعتمد،،</strong><br />
                  <strong>مدير وحدة مكافحة العدوى</strong><br /><br />
                  ..........................
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <style>{`@media print { .no-print { display: none !important; } body { background-color: white !important; } }`}</style>
    </div>
  );
};

const btnStyle = { padding: '10px 20px', cursor: 'pointer', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' };

export default History;