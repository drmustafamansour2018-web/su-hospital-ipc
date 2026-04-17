import { useState } from "react";
import { ref, push } from "firebase/database";
import { db } from "../firebase/config";
import { departments } from "../data/departments";

export default function PatientForm() {
  const [loading, setLoading] = useState(false);

  const [patient, setPatient] = useState({
    name: "",
    nationalId: "",
    ticketNo: "",
    age: "",
    gender: "",
    department: "",
    admissionDate: "",
    status: "active",
  });

  // handle normal inputs
  const handleChange = (e) => {
    setPatient({
      ...patient,
      [e.target.name]: e.target.value,
    });
  };

  // department selection (FIXED)
  const handleDepartmentChange = (value) => {
    const selected = departments.find((d) => d.name === value);

    setPatient({
      ...patient,
      department: selected || { name: value, code: "" },
    });
  };

  // validation
  const isValid =
    patient.name &&
    patient.age &&
    patient.gender &&
    patient.department?.name;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      alert("❌ Please fill required fields");
      return;
    }

    setLoading(true);

    try {
      await push(ref(db, "patients"), {
        ...patient,
        createdAt: new Date().toISOString(),
      });

      alert("✅ Patient saved successfully");

      // reset
      setPatient({
        name: "",
        nationalId: "",
        ticketNo: "",
        age: "",
        gender: "",
        department: "",
        admissionDate: "",
        status: "active",
      });
    } catch (err) {
      console.log(err);
      alert("❌ Error saving patient");
    }

    setLoading(false);
  };

  const inputStyle =
    "w-full p-3 text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-400 outline-none transition shadow-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">

      <div className="bg-white w-full max-w-5xl p-8 rounded-2xl shadow-xl">

        {/* HEADER */}
        <h2 className="text-3xl font-bold text-center mb-6">
          🏥 Patient Registration
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">

          {/* NAME */}
          <input
            name="name"
            placeholder="Patient Name *"
            value={patient.name}
            onChange={handleChange}
            className={inputStyle}
          />

          {/* AGE */}
          <input
            name="age"
            type="number"
            placeholder="Age *"
            value={patient.age}
            onChange={handleChange}
            className={inputStyle}
          />

          {/* NATIONAL ID */}
          <input
            name="nationalId"
            placeholder="National ID"
            value={patient.nationalId}
            onChange={handleChange}
            className={inputStyle}
          />

          {/* TICKET */}
          <input
            name="ticketNo"
            placeholder="Ticket Number"
            value={patient.ticketNo}
            onChange={handleChange}
            className={inputStyle}
          />

          {/* GENDER */}
          <select
            name="gender"
            value={patient.gender}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="">Select Gender *</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          {/* DEPARTMENT (IMPROVED) */}
          <input
            list="departments"
            placeholder="Search Department *"
            value={patient.department?.name || ""}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className={inputStyle}
          />

          <datalist id="departments">
            {departments.map((d, i) => (
              <option key={i} value={d.name} />
            ))}
          </datalist>

          {/* ADMISSION DATE */}
          <input
            type="date"
            name="admissionDate"
            value={patient.admissionDate}
            onChange={handleChange}
            className={inputStyle}
          />

          {/* STATUS */}
          <select
            name="status"
            value={patient.status}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
          </select>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`col-span-2 py-3 rounded-xl font-semibold text-white transition ${
              !isValid || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? "Saving..." : "Save Patient"}
          </button>

        </form>
      </div>
    </div>
  );
}