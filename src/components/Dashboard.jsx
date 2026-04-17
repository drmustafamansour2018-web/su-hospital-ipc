import { useEffect, useState } from "react";
import { ref, onValue, push } from "firebase/database";
import { db } from "../firebase/config";
import PatientCard from "../components/PatientCard";
import KPI from "../components/KPI";

/* ================= RISK ENGINE ================= */
function calculateRisk(patient) {
  let score = 0;

  const age = Number(patient.age || 0);

  if (age > 65) score += 30;
  else if (age > 45) score += 15;

  const highRisk = ["COVID-19", "Sepsis", "Tuberculosis", "Pneumonia"];
  if (highRisk.includes(patient.disease)) score += 40;

  if (patient.department?.includes("ICU")) score += 25;

  return Math.min(score, 100);
}

export default function Dashboard() {
  /* ================= STATES ================= */
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    nationalId: "",
    address: "",
    department: "",
    disease: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ================= FIREBASE ================= */
  useEffect(() => {
    const patientsRef = ref(db, "patients");

    return onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();

      setPatients(
        data
          ? Object.entries(data).map(([id, value]) => ({
              id,
              ...value,
            }))
          : []
      );
    });
  }, []);

  /* ================= KPIs ================= */
  const critical = patients.filter((p) => p.riskScore > 70).length;

  const avgRisk =
    patients.length > 0
      ? (
          patients.reduce((s, p) => s + (p.riskScore || 0), 0) /
          patients.length
        ).toFixed(1)
      : 0;

  /* ================= ADD PATIENT ================= */
  const handleAdd = async () => {
    const riskScore = calculateRisk(form);

    const newPatient = {
      ...form,
      age: Number(form.age),
      riskScore,
      status: "active",
      hai: riskScore > 70,
      createdAt: new Date().toISOString(),
    };

    await push(ref(db, "patients"), newPatient);

    setForm({
      name: "",
      age: "",
      gender: "",
      phone: "",
      nationalId: "",
      address: "",
      department: "",
      disease: "",
    });

    setStep(1);
    setShowAdd(false);
  };

  /* ================= FILTER ================= */
  const filtered = patients
    .filter((p) =>
      selectedDept === "all" ? true : p.department === selectedDept
    )
    .filter((p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase())
    );

  /* ================= UI ================= */
  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🏥 IPC RED MEDICAL DASHBOARD</h2>

      {/* ALERT */}
      {critical > 0 && (
        <div style={styles.alert}>
          ⚠️ Critical Patients: {critical}
        </div>
      )}

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <KPI title="Patients" value={patients.length} color="#ef4444" />
        <KPI title="Critical" value={critical} color="#dc2626" />
        <KPI title="Avg Risk" value={avgRisk + "%"} color="#f97316" />
        <KPI title="HAI Risk" value={critical} color="#b91c1c" />
      </div>

      {/* FILTER */}
      <div style={styles.toolbar}>
        <input
          placeholder="Search patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={styles.input}
        >
          <option value="all">All Departments</option>
          <option value="ICU">ICU</option>
          <option value="ER">ER</option>
        </select>

        <button onClick={() => setShowAdd(true)} style={styles.addBtn}>
          + Add Patient
        </button>
      </div>

      {/* PATIENT LIST */}
      <div style={styles.list}>
        {filtered.map((p) => (
          <PatientCard key={p.id} patient={p} />
        ))}
      </div>

      {/* DRAWER */}
      {showAdd && (
        <div style={styles.overlay}>
          <div style={styles.drawer}>
            <h2 style={{ color: "#dc2626" }}>➕ Add Patient</h2>

            {/* STEPS */}
            <div style={styles.steps}>
              <button onClick={() => setStep(1)} style={styles.stepBtn}>1</button>
              <button onClick={() => setStep(2)} style={styles.stepBtn}>2</button>
              <button onClick={() => setStep(3)} style={styles.stepBtn}>3</button>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <div>
                <input name="name" placeholder="Name" onChange={handleChange} style={styles.inputFull} />
                <input name="age" placeholder="Age" onChange={handleChange} style={styles.inputFull} />
                <input name="gender" placeholder="Gender" onChange={handleChange} style={styles.inputFull} />

                <button onClick={() => setStep(2)} style={styles.nextBtn}>Next</button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div>
                <input name="department" placeholder="Department" onChange={handleChange} style={styles.inputFull} />
                <input name="disease" placeholder="Disease" onChange={handleChange} style={styles.inputFull} />

                <div style={styles.risk}>
                  🔥 Risk Preview: {calculateRisk(form)}%
                </div>

                <button onClick={() => setStep(1)} style={styles.btn}>Back</button>
                <button onClick={() => setStep(3)} style={styles.nextBtn}>Next</button>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div>
                <h4>Confirm</h4>
                <p>{form.name}</p>
                <p>{form.disease}</p>

                <button onClick={() => setStep(2)} style={styles.btn}>Back</button>

                <button onClick={handleAdd} style={styles.saveBtn}>
                  Save Patient
                </button>
              </div>
            )}

            <button onClick={() => setShowAdd(false)} style={styles.close}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= RED MEDICAL STYLES ================= */
const styles = {
  page: {
    padding: 20,
    background: "#fff5f5",
    minHeight: "100vh",
    color: "#1f2937",
  },

  title: {
    background: "linear-gradient(90deg,#ef4444,#dc2626)",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
    fontWeight: "bold",
  },

  alert: {
    background: "#dc2626",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    fontWeight: "bold",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 10,
    marginTop: 15,
  },

  toolbar: {
    display: "flex",
    gap: 10,
    marginTop: 15,
    flexWrap: "wrap",
  },

  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #fecaca",
  },

  inputFull: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    border: "1px solid #fecaca",
  },

  addBtn: {
    background: "#ef4444",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
  },

  list: {
    marginTop: 15,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "flex-end",
  },

  drawer: {
    width: 420,
    background: "#fff",
    padding: 20,
    borderLeft: "5px solid #ef4444",
  },

  steps: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },

  stepBtn: {
    padding: 8,
    background: "#fee2e2",
  },

  risk: {
    background: "#fff1f2",
    padding: 10,
    borderRadius: 10,
    color: "#b91c1c",
    marginBottom: 10,
    fontWeight: "bold",
  },

  nextBtn: {
    background: "#ef4444",
    color: "#fff",
    padding: 10,
    marginRight: 5,
  },

  btn: {
    background: "#fecaca",
    padding: 10,
    marginRight: 5,
  },

  saveBtn: {
    background: "linear-gradient(90deg,#ef4444,#dc2626)",
    color: "#fff",
    padding: 12,
    width: "100%",
  },

  close: {
    marginTop: 10,
    background: "#fee2e2",
    padding: 8,
  },
};