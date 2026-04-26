import { useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebase/config";

export default function MicrobiologyForm({ patientId, onUpdate }) {
  const [labData, setLabData] = useState({
    cultureType: "Blood Culture",
    organism: "",
    isMDRO: false,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async () => {
    if (!labData.organism) return alert("Please enter organism name");
    
    const patientRef = ref(db, `patients/${patientId}/microbiology`);
    await update(patientRef, {
      lastResult: labData,
      isInfected: true // بمجرد إضافة مزرعة إيجابية، تتغير حالة المريض
    });
    alert("Lab result linked to patient surveillance record");
    onUpdate();
  };

  return (
    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 mt-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">🔬 Lab & Microbiology Integration</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select 
          className="p-3 rounded-xl border-none font-bold text-xs shadow-sm focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setLabData({...labData, cultureType: e.target.value})}
        >
          <option>Blood Culture</option>
          <option>Sputum (Respiratory)</option>
          <option>Urine Culture</option>
          <option>Wound Swab</option>
        </select>
        
        <input 
          placeholder="Organism (e.g. MRSA, Klebsiella)"
          className="p-3 rounded-xl border-none font-bold text-xs shadow-sm focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setLabData({...labData, organism: e.target.value})}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input 
          type="checkbox" 
          id="mdro"
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          onChange={(e) => setLabData({...labData, isMDRO: e.target.checked})}
        />
        <label htmlFor="mdro" className="text-[10px] font-black uppercase text-slate-500 italic">Mark as MDRO (Multi-Drug Resistant)</label>
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full mt-4 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
      >
        Link Lab Result
      </button>
    </div>
  );
}