import React, { useState, useEffect } from 'react';
import { db, ref, onValue, remove } from '../firebase/config';

// مصفوفة الأقسام الموحدة لضمان دقة الفلترة
const hospitalDepartments = {
  "Critical Care (العنايات)": [
    "عناية التخدير — ANES-ICU", "PICU — عناية أطفال مركزة", "CCU — عناية قلب",
    "Stroke Unit — وحدة السكتة الدماغية", "المبتسرين (الحضانة) — NICU", "IMCU — عناية متوسطة"
  ],
  "Operating Rooms (العمليات)": [
    "GS-OR — عمليات جراحة عامة", "ORTHO-OR — عمليات عظام", "NS-OR — عمليات مخ وأعصاب",
    "ENT-OR — عمليات أنف وأذن", "GYN-OR — عمليات نساء وتوليد", "URO-OR — عمليات مسالك",
    "OPH-OR — عمليات رمد", "PLS-OR — عمليات تجميل", "MICRO-OR — جراحات ميكروسكوبية", "CATH LAB — قسطرة القلب"
  ],
  "Medical Wards (أقسام الباطنة)": [
    "IM-M — باطنة رجال", "IM-F — باطنة سيدات", "CARD — قلب", "CHEST — صدرية", "NEURO — عصبية",
    "DERM — جلدية", "RHEUM — روماتيزم", "ONC — أورام", "VASC — أوعية دموية", "NEPH-A — كلى كبار", "NEPH-P — كلى أطفال"
  ],
  "Surgical Wards (أقسام الجراحة)": [
    "GS — جراحة عامة", "ORTHO — عظام", "NS — مخ وأعصاب", "URO — مسالك", "ENT — أنف وأذن", 
    "OPH — رمد", "PLS — تجميل", "PED-SURG — جراحة أطفال", "GYN — نساء وتوليد"
  ],
  "Specialized Units (وحدات خاصة)": ["قسم أطفال حرجة — PED-ICU", "ENDO — مناظير", "TROP — متوطنة", "PED — أطفال"],
  "Outpatient Clinics (العيادات)": ["CLINIC-GS", "CLINIC-IM", "CLINIC-PED", "CLINIC-ORTHO", "CLINIC-ENT", "CLINIC-OPH", "CLINIC-DERM", "CLINIC-NEURO"]
};

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setPatients(list.reverse());
      } else {
        setPatients([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (id, name) => {
    const isConfirmed = window.confirm(
      `⚠️ WARNING | تحذير\n\nAre you sure you want to delete patient: "${name}"?\nهل أنت متأكد من مسح بيانات المريض: "${name}"؟`
    );
    if (isConfirmed) {
      remove(ref(db, `patients/${id}`)).catch((error) => alert("Error: " + error.message));
    }
  };

  // دالة معالجة القيم لعرضها بشكل نصي (تدعم المصفوفات والأوبجكت)
  const renderValue = (val) => {
    if (Array.isArray(val)) return val.join(" • "); 
    if (val && typeof val === 'object') return val.name || val.label || "---";
    return val || "---";
  };

  const filteredPatients = patients.filter(p => {
    const name = renderValue(p.name).toLowerCase();
    const id = renderValue(p.medicalId).toString();
    const dept = renderValue(p.department);
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    const matchesDept = filterDept === "All" || dept === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6" dir="ltr">
      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Surveillance</p>
          <h3 className="text-4xl font-black mt-1">{patients.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Risk Cases</p>
          <h3 className="text-4xl font-black text-red-600 mt-1">
            {patients.filter(p => String(renderValue(p.riskScore)) === 'High Risk').length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Entries</p>
          <h3 className="text-4xl font-black text-slate-800 mt-1">
            {patients.filter(p => new Date(p.timestamp).toDateString() === new Date().toDateString()).length}
          </h3>
        </div>
      </div>

      {/* 2. البحث والفلترة */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name or ID..."
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3 px-6 text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer w-full md:w-auto transition-colors shadow-lg shadow-blue-100"
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="All">All Departments | كل الأقسام</option>
          {Object.keys(hospitalDepartments).map((category) => (
            <optgroup key={category} label={category}>
              {hospitalDepartments[category].map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 3. الجدول المطور */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Patient Details</th>
              <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Dept</th>
              <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Diagnosis</th>
              <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Safety Risk</th>
              <th className="p-6 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p, index) => {
              const risk = String(renderValue(p.riskScore));
              const pName = renderValue(p.name);
              return (
                <tr key={p.id || index} className="border-b border-slate-50 hover:bg-blue-50/30 transition-all group">
                  <td className="p-6">
                    <div className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors capitalize">{pName}</div>
                    <div className="text-[10px] text-blue-600 font-bold tracking-tighter">ID: {renderValue(p.medicalId)}</div>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase border border-slate-200">
                      {renderValue(p.department)}
                    </span>
                  </td>
                  {/* عرض التشخيصات المتعددة في شكل Tags */}
                  <td className="p-6">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {Array.isArray(p.diagnosis) ? (
                        p.diagnosis.map((diag, i) => (
                          <span key={i} className="text-[8px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md font-black border border-blue-100 uppercase italic">
                            {diag}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">{renderValue(p.diagnosis)}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      {risk === 'High Risk' && <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>}
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                        risk === 'High Risk' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {risk}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={() => handleDelete(p.id, pName)} className="text-slate-300 hover:text-red-600 transition-all p-2 rounded-xl hover:bg-red-50">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredPatients.length === 0 && (
          <div className="p-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
            No patients found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;