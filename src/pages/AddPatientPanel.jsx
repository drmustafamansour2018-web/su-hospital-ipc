import { useState } from "react";
import { ref, push } from "firebase/database";
import { db } from "../firebase/config";

export default function AddPatientPanel({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    id: "",
    department: "ICU",
    disease: "",
    symptoms: "",
  });

  // ================= RISK ENGINE (simple version) =================
  const calculateRisk = () => {
    let risk = 10;

    if (form.age > 60) risk += 25;
    if (form.department === "ICU") risk += 20;
    if (form.disease === "Pneumonia") risk += 25;
    if (form.disease === "COVID-19") risk += 35;

    return Math.min(risk, 100);
  };

  const risk = calculateRisk();

  const getColor = () => {
    if (risk < 40) return "🟢";
    if (risk < 70) return "🟡";
    return "🔴";
  };

  // ================= SAVE =================
  const handleSave = () => {
    push(ref(db, "patients"), {
      ...form,
      age: Number(form.age),
      riskScore: risk,
      status: "active",
      hai: risk > 70,
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>

        {/* HEADER */}
        <div style={styles.header}>
          <h2>🏥 Add New Patient</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>

          {/* LEFT INPUTS */}
          <div style={styles.left}>

            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />

            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              placeholder="National ID"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />

            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option>ICU</option>
              <option>ER</option>
              <option>CCU</option>
              <option>LAB</option>
            </select>

            <select
              value={form.disease}
              onChange={(e) => setForm({ ...form, disease: e.target.value })}
            >
              <option value="">Disease</option>
              <option>Pneumonia</option>
              <option>COVID-19</option>
              <option>Sepsis</option>
            </select>

          </div>

          {/* RIGHT RISK PANEL */}
          <div style={styles.right}>

            <h3>⚡ Live Risk Preview</h3>

            <div style={styles.riskBox}>
              <h1>
                {getColor()} {risk}
              </h1>
              <p>
                {risk < 40
                  ? "Low Risk"
                  : risk < 70
                  ? "Medium Risk"
                  : "High Risk"}
              </p>
            </div>

            <div style={styles.suggestion}>
              {risk > 70
                ? "⚠ ICU recommended immediately"
                : "Patient stable"}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <button style={styles.saveBtn} onClick={handleSave}>
          Save Patient
        </button>

      </div>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
     direction: "rtl",
  },

  panel: {
    width: "800px",
    background: "#fff",
    borderRadius: 12,
    padding: 20,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  body: {
    display: "flex",
    gap: 20,
  },

  left: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  right: {
    flex: 1,
    background: "#f5f6fa",
    padding: 15,
    borderRadius: 10,
  },

  riskBox: {
    textAlign: "center",
    padding: 20,
    borderRadius: 10,
    background: "#fff",
  },

  suggestion: {
    marginTop: 15,
    padding: 10,
    background: "#fff",
    borderRadius: 10,
  },

  saveBtn: {
    width: "100%",
    marginTop: 20,
    padding: 12,
    background: "#E53846",
    color: "#fff",
    border: "none",
    borderRadius: 8,
  },
};