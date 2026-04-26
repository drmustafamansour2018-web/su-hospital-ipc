import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase/config';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    highRiskCount: 0,
    criticalPercentage: 0,
    totalHAI: 0, // إضافة عداد الـ HAI
    recentHistory: []
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    const haiRef = ref(db, 'hai_events'); // مرجع بيانات العدوى

    // 1. جلب بيانات المرضى والإحصائيات العامة
    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const patientList = Object.values(data);
        const total = patientList.length;
        const highRisk = patientList.filter(p => p.riskScore === 'High Risk').length;
        const criticalPerc = total > 0 ? ((highRisk / total) * 100).toFixed(1) : 0;

        // معالجة التنبيهات الذكية (الحالات الحرجة من السجل الطبي)
        const criticalAlerts = patientList.filter(p => {
          const isCriticalDiag = p.diagnosis?.some(d => 
            d.includes('Sepsis') || d.includes('Shock') || d.includes('MDR')
          );
          const hasVentilator = p.devices?.some(dev => dev.includes('Ventilation'));
          return isCriticalDiag || hasVentilator;
        }).reverse().slice(0, 2).map(p => ({ ...p, alertType: 'Clinical' }));

        // تجهيز بيانات الشارت
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const count = patientList.filter(p => p.timestamp?.startsWith(dateStr)).length;
          return { name: dateStr, count: count };
        }).reverse();

        setStats(prev => ({
          ...prev,
          totalPatients: total,
          highRiskCount: highRisk,
          criticalPercentage: criticalPerc,
          recentHistory: last7Days
        }));
        
        setAlerts(prev => [...criticalAlerts, ...prev.filter(a => a.alertType === 'HAI')].slice(0, 4));
      }
    });

    // 2. جلب بيانات الـ HAI المكتسبة
    onValue(haiRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const haiList = Object.values(data);
        setStats(prev => ({ ...prev, totalHAI: haiList.length }));

        const haiAlerts = haiList.map(event => ({
          name: event.patientName,
          department: event.department,
          diagnosis: [`عدوى مكتسبة: ${event.infectionType}`],
          alertType: 'HAI',
          isUrgent: true
        })).reverse().slice(0, 2);

        setAlerts(prev => [...haiAlerts, ...prev.filter(a => a.alertType === 'Clinical')].slice(0, 4));
      }
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans" dir="rtl">
      
      {/* Welcome Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">نظام المراقبة الذكي</h2>
          <p className="text-slate-500 font-medium mt-1">متابعة ترصد العدوى - مستشفيات جامعة سوهاج</p>
        </div>
        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase">حالة الاتصال</p>
            <p className="text-sm font-black text-emerald-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              متصل الآن
            </p>
        </div>
      </div>

      {/* Smart Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div key={index} className={`bg-white border-r-[12px] ${alert.alertType === 'HAI' ? 'border-orange-500' : 'border-red-600'} p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center justify-between group hover:bg-slate-50 transition-all border border-slate-100 animate-in slide-in-from-right`}>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-pulse ${alert.alertType === 'HAI' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                  {alert.alertType === 'HAI' ? '🦠' : '🚨'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-slate-900 font-black text-xl">{alert.name}</h4>
                    <span className={`px-4 py-1 text-white text-[10px] font-black rounded-full ${alert.alertType === 'HAI' ? 'bg-orange-500' : 'bg-red-600'}`}>
                      {alert.alertType === 'HAI' ? 'تنبيه عدوى' : 'حالة حرجة'}
                    </span>
                  </div>
                  <p className="text-slate-600 font-bold mt-1">
                    القسم: <span className="text-blue-600">{alert.department}</span> | 
                    التشخيص: <span className="text-slate-800 italic">{alert.diagnosis?.join(' - ')}</span>
                  </p>
                </div>
              </div>
              <button className={`mt-4 md:mt-0 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-lg active:scale-95 ${alert.alertType === 'HAI' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-900 hover:bg-red-600'}`}>
                {alert.alertType === 'HAI' ? 'مراجعة حزمة الوقاية' : 'مراجعة البروتوكول'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> {/* غيرت الـ grid لـ 4 أعمدة */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">إجمالي المرضى</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-5xl font-black text-blue-600">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">High Risk</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-5xl font-black text-red-600">{stats.highRiskCount}</p>
          </div>
        </div>

        {/* الكارت الجديد الخاص بالـ HAI */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-sm transition-all hover:shadow-orange-200 group">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">حالات HAI</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-5xl font-black text-orange-600 group-hover:scale-110 transition-transform">{stats.totalHAI || 0}</p>
            <span className="text-orange-300 font-bold text-sm">حالة</span>
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