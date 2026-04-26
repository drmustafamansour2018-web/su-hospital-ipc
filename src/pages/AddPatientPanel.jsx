import { useState } from "react";
import { ref, push } from "firebase/database";
import { db } from "../firebase/config";

export default function AddPatientPanel({ onClose }) {
  const [form, setForm] = useState({
    name: "", age: "", gender: "Male", id: "", department: "ICU", disease: "",
  });

  const calculateRisk = () => {
    let risk = 10;
    const ageNum = Number(form.age) || 0;
    if (ageNum > 60) risk += 25;
    if (form.department === "ICU") risk += 20;
    if (form.disease === "Pneumonia") risk += 25;
    if (form.disease === "COVID-19") risk += 35;
    if (form.disease === "Sepsis") risk += 40;
    return Math.min(risk, 100);
  };

  const risk = calculateRisk();

  const handleSave = () => {
    if (!form.name || !form.id) { alert("Please enter Name and ID"); return; }

    const patientData = {
      ...form,
      age: Number(form.age),
      riskScore: risk,
      // 🔥 هذه الحقول هي التي تُحدث العدادات في الداشبورد
      hai: risk >= 70 || form.disease === "Sepsis",
      mdro: form.disease === "COVID-19" || risk > 80,
      createdAt: new Date().toISOString()
    };

    push(ref(db, "patients"), patientData)
      .then(() => onClose())
      .catch((err) => console.error("Firebase Error:", err));
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-black uppercase italic">Add <span className="text-blue-600">Patient</span></h2>
          <button onClick={onClose} className="font-bold">✕</button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <input className="w-full p-4 rounded-2xl bg-slate-100 font-bold" placeholder="Patient Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" className="p-4 rounded-2xl bg-slate-100 font-bold" placeholder="Age" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} />
            <select className="p-4 rounded-2xl bg-slate-100 font-bold" value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}><option>Male</option><option>Female</option></select>
          </div>
          <input className="w-full p-4 rounded-2xl bg-slate-100 font-bold" placeholder="National ID" value={form.id} onChange={(e) => setForm({...form, id: e.target.value})} />
          <select className="w-full p-4 rounded-2xl bg-slate-100 font-bold" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}><option>ICU</option><option>ER</option><option>Surgical Ward</option></select>
          <select className="w-full p-4 rounded-2xl bg-slate-100 font-bold" value={form.disease} onChange={(e) => setForm({...form, disease: e.target.value})}>
            <option value="">Select Disease</option>
            <option>Pneumonia</option><option>COVID-19</option><option>Sepsis</option>
          </select>

          {/* Risk Preview Card */}
          <div className="p-6 rounded-[2rem] bg-slate-900 text-white text-center">
            <div className="text-4xl font-black text-blue-500">{risk}%</div>
            <div className="text-[10px] uppercase tracking-widest mt-2">Live Risk Assessment</div>
          </div>
        </div>

        <div className="p-8 border-t bg-white">
          <button onClick={handleSave} className="w-full p-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirm & Save</button>
        </div>
      </div>
    </div>
  );
} 