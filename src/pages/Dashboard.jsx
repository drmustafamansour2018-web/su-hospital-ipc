import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase/config';
import { update } from "firebase/database"; // الاستيراد الصحيح للدالة
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    highRiskCount: 0,
    criticalPercentage: 0,
    totalHAI: 0,
    recentHistory: []
  });

  const [alerts, setAlerts] = useState([]);

  // 1. وظيفة تشغيل التنبيه الصوتي
  const playAlarm = () => {
    const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
    audio.play().catch(() => console.log("بانتظار تفاعل المستخدم لتشغيل الصوت"));
  };

  // 2. وظيفة تحديث الحالة (جاري المتابعة / تم الإنهاء)
  const handleUpdateStatus = (alertId, newStatus) => {
    const alertRef = ref(db, `hai_events/${alertId}`);
    update(alertRef, { status: newStatus });
  };

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    const haiRef = ref(db, 'hai_events');

    // جلب بيانات المرضى
    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const patientList = Object.values(data);
        const total = patientList.length;
        const highRisk = patientList.filter(p => p.riskScore === 'High Risk').length;
        
        setStats(prev => ({
          ...prev,
          totalPatients: total,
          highRiskCount: highRisk,
          criticalPercentage: total > 0 ? ((highRisk / total) * 100).toFixed(1) : 0,
          recentHistory: [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            return { name: dateStr, count: patientList.filter(p => p.timestamp?.startsWith(dateStr)).length };
          }).reverse()
        }));
      }
    });

    // جلب بيانات العدوى مع المراقبة الصوتية والفلترة
    onValue(haiRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fullList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        
        // تصفية الحالات: إخفاء الحالات التي تم وضع علامة "تم الإنهاء" (completed) عليها
        const activeAlerts = fullList.filter(item => item.status !== 'completed');

        // تشغيل الصوت عند وجود تنبيه جديد تماماً (ليس قيد المعالجة)
        const hasNewUnseen = activeAlerts.some(a => !a.status || a.status === 'pending');
        if (hasNewUnseen && activeAlerts.length > alerts.length) {
          playAlarm();
        }

        setAlerts(activeAlerts.reverse().slice(0, 4));
        setStats(prev => ({ ...prev, totalHAI: fullList.length }));
      }
    });
  }, [alerts.length]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans p-2" dir="rtl">
      
      {/* Welcome Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">نظام المراقبة الذكي</h2>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">متابعة ترصد العدوى - مستشفيات جامعة سوهاج</p>
        </div>
        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">حالة الترصد</p>
            <p className="text-sm font-black text-emerald-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              متصل الآن
            </p>
        </div>
      </div>

      {/* Smart Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-700 mr-2 flex items-center gap-2 tracking-tight">
            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
            التنبيهات النشطة على الشاشة
          </h3>
          {alerts.map((alert) => (
            <div key={alert.id} className={`bg-white border-r-[12px] ${alert.status === 'processing' ? 'border-blue-500' : 'border-orange-500'} p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center justify-between group border border-slate-100 animate-in slide-in-from-right transition-all`}>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${alert.status === 'processing' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>
                  {alert.status === 'processing' ? '⏳' : '🦠'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-slate-900 font-black text-xl">{alert.patientName}</h4>
                    <span className={`px-4 py-1 text-white text-[10px] font-black rounded-full ${alert.status === 'processing' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                      {alert.status === 'processing' ? 'جاري المتابعة' : 'تنبيه عدوى'}
                    </span>
                  </div>
                  <p className="text-slate-600 font-bold mt-1 text-sm">
                    القسم: <span className="text-blue-600">{alert.department}</span> | النوع: <span className="text-slate-800">{alert.infectionType}</span>
                  </p>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-2 mt-4 md:mt-0">
                {alert.status !== 'processing' && (
                  <button 
                    onClick={() => handleUpdateStatus(alert.id, 'processing')}
                    className="bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-100 transition-all border border-blue-200"
                  >
                    جاري المتابعة
                  </button>
                )}
                <button 
                  onClick={() => handleUpdateStatus(alert.id, 'completed')}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                >
                  تم الإنهاء ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">إجمالي المرضى</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-5xl font-black text-blue-600">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">عالي الخطورة</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-5xl font-black text-red-600">{stats.highRiskCount}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-sm transition-all hover:shadow-orange-200 group">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">حالات HAI</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-5xl font-black text-orange-600 group-hover:scale-110 transition-transform">{stats.totalHAI}</p>
            <span className="text-orange-300 font-bold text-sm mr-1">حالة</span>
          </div>
        </div>

        <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 text-white">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">معدل الخطورة</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-5xl font-black">{stats.criticalPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-10">
            <div>
                <h3 className="font-black text-slate-800 text-xl italic">Patient Admissions Trend</h3>
                <p className="text-sm text-slate-400">معدل تسجيل المرضى خلال الأسبوع الحالي</p>
            </div>
            <div className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full uppercase">Live Analytics</div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.recentHistory}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#64748b'}} dy={15} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', textAlign: 'right'}} />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;