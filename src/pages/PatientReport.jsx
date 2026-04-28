import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/config";
// 1. استدعاء المكون الجديد
import MicrobiologyForm from "../components/MicrobiologyForm.jsx";

export default function PatientReport({ patientId, onBack }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    const patientRef = ref(db, `patients_infections/${patientId}`);
    const unsubscribe = onValue(patientRef, (snapshot) => {
      setPatient(snapshot.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [patientId]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse">GENERATING CLINICAL REPORT...</div>;
  if (!patient) return <div className="p-20 text-center text-red-500">Patient not found.</div>;

  const riskVal = patient.riskScore || patient.risk || 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 mb-20" dir="ltr">
      
      {/* Header (نفس الكود بتاعك) */}
      <div className="flex justify-between items-start border-b pb-8 mb-8">
        <div>
          <button onClick={onBack} className="mb-4 text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 hover:gap-3 transition-all">
            ← Back to Surveillance
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Infection Risk <span className="text-blue-600">Report</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase mt-1">Generated on: {new Date(patient.createdAt).toLocaleString()}</p>
        </div>
        <div className={`px-6 py-4 rounded-3xl text-center border-4 ${riskVal >= 75 ? 'border-red-500 bg-red-50' : riskVal >= 45 ? 'border-orange-400 bg-orange-50' : 'border-emerald-500 bg-emerald-50'}`}>
          <div className={`text-3xl font-black ${riskVal >= 75 ? 'text-red-600' : riskVal >= 45 ? 'text-orange-600' : 'text-emerald-600'}`}>
            {riskVal}%
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Risk Score</div>
        </div>
      </div>

      {/* Patient Bio & Clinical Environment (نفس الكود بتاعك) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <SectionLabel label="Patient Demographics" />
          <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
            <DataField label="Full Name" value={patient.name} />
            <DataField label="National ID / MRN" value={patient.nationalId || 'N/A'} />
            <div className="grid grid-cols-2 gap-4">
              <DataField label="Age" value={`${patient.age} Years`} />
              <DataField label="Gender" value={patient.gender} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <SectionLabel label="Clinical Environment" />
          <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
            <DataField label="Department" value={patient.department?.name || patient.department} />
            <DataField label="Primary Diagnosis" value={patient.disease} />
            <DataField label="Admission Date" value={patient.admissionDate || 'N/A'} />
          </div>
        </div>
      </div>

      {/* Invasive Devices Section (نفس الكود بتاعك) */}
      <div className="mb-10">
        <SectionLabel label="Risk Factors & Invasive Procedures" />
        <div className="mt-4 flex flex-wrap gap-4">
          <DeviceBadge active={patient.hasVentilator} label="Mechanical Ventilator" icon="🫁" />
          <DeviceBadge active={patient.hasCatheter} label="Urinary Catheter" icon="🧪" />
          <DeviceBadge active={patient.hasCentralLine} label="Central Venous Line" icon="💉" />
        </div>
      </div>

      {/* Intervention Plan (نفس الكود بتاعك) */}
      <div className={`p-8 rounded-[2rem] border-l-[12px] mb-10 ${riskVal >= 75 ? 'bg-red-50 border-red-500' : riskVal >= 45 ? 'bg-orange-50 border-orange-400' : 'bg-emerald-50 border-emerald-500'}`}>
        <h3 className={`text-xl font-black uppercase mb-2 ${riskVal >= 75 ? 'text-red-700' : riskVal >= 45 ? 'text-orange-700' : 'text-emerald-700'}`}>
          Clinical Intervention Plan — {patient.level || 'Standard'}
        </h3>
        <p className="text-slate-700 leading-relaxed font-medium">
          {patient.action || 'Continue standard surveillance and hygiene protocols.'}
        </p>
      </div>

      {/* --- القسم الجديد: نتائج الميكروبيولوجي --- */}
      <div className="mb-10">
        <SectionLabel label="Microbiology & Lab Results" />
        
        {/* عرض النتيجة الحالية لو موجودة */}
        {patient.microbiology?.lastResult ? (
          <div className={`mt-4 p-6 rounded-3xl border-2 flex items-center justify-between ${patient.microbiology.lastResult.isMDRO ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🔬</span>
                <h4 className={`font-black uppercase ${patient.microbiology.lastResult.isMDRO ? 'text-purple-700' : 'text-blue-700'}`}>
                  {patient.microbiology.lastResult.organism}
                </h4>
                {patient.microbiology.lastResult.isMDRO && (
                  <span className="bg-purple-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">MDRO Alert</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                {patient.microbiology.lastResult.cultureType} • Date: {patient.microbiology.lastResult.date}
              </p>
            </div>
            <div className="text-right italic text-[10px] font-black text-slate-400 uppercase">
              Confirmed HAI Record
            </div>
          </div>
        ) : (
          <div className="mt-4 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            No active lab results found for this patient
          </div>
        )}

        {/* فورم إضافة نتيجة جديدة */}
        <MicrobiologyForm patientId={patientId} onUpdate={() => console.log("Report Refreshing...")} />
      </div>

      {/* Footer (نفس الكود بتاعك) */}
      <div className="mt-12 pt-8 border-t border-dashed flex justify-between items-center opacity-50">
        <div className="text-[10px] font-black uppercase tracking-widest">iPC Surveillance System v3.0</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-right">
          Department of Infection Control<br/>University Hospital
        </div>
      </div>
    </div>
  );
}

// Components (نفس الكود بتاعك)
function SectionLabel({ label }) {
  return <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 ml-2">{label}</h2>;
}
function DataField({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{label}</div>
      <div className="text-sm font-bold text-slate-800 uppercase">{value}</div>
    </div>
  );
}
function DeviceBadge({ active, label, icon }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-100 opacity-30 grayscale'}`}>
      <span className="text-xl">{icon}</span>
      <span className={`text-[11px] font-black uppercase ${active ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}