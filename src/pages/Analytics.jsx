import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/config";

export default function Analytics() {
  const [stats, setStats] = useState({
    total: 0,
    vent: 0,
    cath: 0,
    line: 0,
    critical: 0,
    depts: {},
    // إحصائيات المزارع الجديدة
    infected: 0,
    mdro: 0,
    organisms: {} 
  });

  useEffect(() => {
    const patientsRef = ref(db, "patients");
    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        const deptCounts = {};
        const organismCounts = {};
        
        list.forEach(p => {
          // توزيع الأقسام
          const dName = p.department?.name || p.department || "Unknown";
          deptCounts[dName] = (deptCounts[dName] || 0) + 1;

          // تحليل المزارع والميكروبات
          if (p.microbiology?.lastResult) {
            const bug = p.microbiology.lastResult.organism;
            if (bug) {
              organismCounts[bug] = (organismCounts[bug] || 0) + 1;
            }
          }
        });

        setStats({
          total: list.length,
          vent: list.filter(p => p.hasVentilator).length,
          cath: list.filter(p => p.hasCatheter).length,
          line: list.filter(p => p.hasCentralLine).length,
          critical: list.filter(p => (p.riskScore || p.risk) >= 75).length,
          depts: deptCounts,
          // تصفية بيانات المزارع
          infected: list.filter(p => p.microbiology?.lastResult).length,
          mdro: list.filter(p => p.microbiology?.lastResult?.isMDRO).length,
          organisms: organismCounts
        });
      }
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20" dir="ltr">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Infection <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Epidemiological Surveillance Data</p>
        </div>
      </div>

      {/* 1. Top Stats Cards (New: MDRO & Infection Rates) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Confirmed HAI" count={stats.infected} color="text-rose-600" bg="bg-rose-50" icon="🦠" />
        <StatCard label="MDRO Alerts" count={stats.mdro} color="text-purple-600" bg="bg-purple-50" icon="🚨" />
        <StatCard label="Critical Risk" count={stats.critical} color="text-amber-600" bg="bg-amber-50" icon="⚠️" />
        <StatCard label="Total Census" count={stats.total} color="text-blue-600" bg="bg-blue-50" icon="🏥" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Device Utilization (نفس الكود بتاعك مع تحسين) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-8 font-serif italic">Device Burden Analysis</h3>
          <div className="space-y-6">
            <ChartBar label="Ventilator (VAP Risk)" count={stats.vent} total={stats.total} color="bg-blue-600" icon="🫁" />
            <ChartBar label="Urinary Catheter (CAUTI Risk)" count={stats.cath} total={stats.total} color="bg-indigo-600" icon="🧪" />
            <ChartBar label="Central Line (CLABSI Risk)" count={stats.line} total={stats.total} color="bg-cyan-500" icon="💉" />
          </div>
        </div>

        {/* 3. Pathogen Distribution (الجديد: توزيع الميكروبات) */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Top Pathogens</h3>
           <div className="space-y-4 flex-1">
              {Object.entries(stats.organisms).length > 0 ? (
                Object.entries(stats.organisms).map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold italic">{name}</span>
                    <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-black">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-600 uppercase font-bold italic">No organisms detected yet</p>
              )}
           </div>
           <div className="mt-6 p-4 bg-rose-600/20 rounded-2xl border border-rose-600/30">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">AI Alert: Cross-Infection Risk</p>
           </div>
        </div>
      </div>

      {/* 4. Departmental Distribution (نفس الكود بتاعك) */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-6">Departmental Census</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.depts).map(([name, count]) => (
              <div key={name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-hover hover:border-blue-200 group">
                <p className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{count}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{name}</p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

// مكونات مساعدة
function StatCard({ label, count, color, bg, icon }) {
  return (
    <div className={`${bg} p-6 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-black ${color}`}>{count}</span>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function ChartBar({ label, count, total, color, icon }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-[11px] font-black uppercase text-slate-700">{label}</span>
        </div>
        <span className="text-xs font-black text-slate-400">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-lg`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}