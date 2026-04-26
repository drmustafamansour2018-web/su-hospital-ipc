import { useState, useEffect } from "react";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../firebase/config";

// 1. مكون الأيقونة المطور مع تأثير Hover
function DeviceIcon({ active, icon, label }) {
  return (
    <div 
      title={label}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl border-2 transition-all duration-300
      ${active ? 'border-blue-400 bg-blue-50 grayscale-0 scale-110 shadow-sm' : 'border-slate-100 bg-slate-50 grayscale opacity-20 hover:opacity-40'}`}
    >
      <span className="text-lg">{icon}</span>
    </div>
  );
}

export default function PatientTable({ onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const patientsRef = ref(db, "patients");
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // الحل الجذري لمشكلة التكرار والمفاتيح الفارغة
        const list = Object.keys(data)
          .filter(key => key && key.trim() !== "") // استبعاد المفاتيح الفارغة
          .map((key) => ({
            id: key,
            ...data[key],
          }));
        
        // ترتيب المرضى حسب درجة الخطورة (الأعلى أولاً)
        setPatients(list.sort((a, b) => (b.riskScore || b.risk || 0) - (a.riskScore || a.risk || 0)));
      } else {
        setPatients([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation(); 
    if (window.confirm("Are you sure you want to delete this record?")) {
      remove(ref(db, `patients/${id}`));
    }
  };

  const filteredPatients = patients.filter((p) =>
    (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (p.department?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (typeof p.department === 'string' && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Syncing Surveillance Data...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="text-left w-full">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              Surveillance <span className="text-blue-600">Registry</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
              Real-time Infection Control Monitoring
            </p>
          </div>
          
          <div className="relative w-full md:w-1/3 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 grayscale group-focus-within:grayscale-0 transition-all text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by name or department..."
              className="p-4 pl-12 w-full rounded-[1.5rem] border-2 border-transparent shadow-sm focus:border-blue-100 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-white font-bold text-slate-700 placeholder:text-slate-300"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Patient Details</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Location</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-center">Device Map</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-center">Risk Score</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Intervention</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPatients.map((patient) => {
                  const riskVal = patient.riskScore || patient.risk || 0;
                  // استخدام patient.id مع fallback عشوائي لمنع خطأ التكرار نهائياً
                  const rowKey = patient.id || `row-${Math.random()}`;

                  return (
                    <tr 
                      key={rowKey} 
                      onClick={() => onSelectPatient && onSelectPatient(patient.id)}
                      className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                    >
                      <td className="p-6">
                        <div className="font-black text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                          {patient.name}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">ID: {patient.nationalId || 'N/A'}</span>
                          <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase">{patient.age}Y • {patient.gender}</span>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                           <span className="text-xs font-black text-slate-600 uppercase tracking-tight">
                            {patient.department?.name || patient.department || 'General'}
                           </span>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="flex justify-center space-x-2">
                          <DeviceIcon active={patient.hasVentilator} icon="🫁" label="Ventilator" />
                          <DeviceIcon active={patient.hasCatheter} icon="🧪" label="Catheter" />
                          <DeviceIcon active={patient.hasCentralLine} icon="💉" label="Central Line" />
                        </div>
                      </td>

                      <td className="p-6 text-center">
                        <div className={`inline-flex flex-col items-center justify-center w-14 h-14 rounded-2xl font-black shadow-inner transition-transform group-hover:scale-110
                          ${riskVal >= 75 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                            riskVal >= 45 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          <span className="text-lg leading-none">{riskVal}</span>
                          <span className="text-[8px] uppercase opacity-60 mt-1">%</span>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase inline-block mb-1 shadow-sm
                          ${riskVal >= 75 ? 'text-white bg-rose-500 animate-pulse' : riskVal >= 45 ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'}`}>
                          {riskVal >= 75 ? '🚨 CRITICAL' : riskVal >= 45 ? '⚠️ CAUTION' : '✅ STABLE'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[150px] block mt-1 tracking-tighter">
                          {patient.action || 'Standard Monitoring'}
                        </div>
                      </td>

                      <td className="p-6 text-right">
                        <button 
                          onClick={(e) => handleDelete(e, patient.id)}
                          className="p-3 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPatients.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
               <div className="text-5xl mb-4 grayscale opacity-20">🔎</div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Patients Match Your Search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}