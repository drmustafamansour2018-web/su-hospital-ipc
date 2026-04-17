import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase/config";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const patientRef = ref(db, `patients/${id}`);

    onValue(patientRef, (snapshot) => {
      const data = snapshot.val();
      setPatient(data);
    });
  }, [id]);

  const handleDischarge = () => {
    const patientRef = ref(db, `patients/${id}`);

    update(patientRef, {
      status: "discharged",
      dischargeDate: new Date().toISOString().split("T")[0],
    });

    alert("Patient discharged ✅");
  };

  if (!patient) return <p>Loading...</p>;

  return (
    <div style={container}>
      {/* Header */}
      <div style={header}>
        <button onClick={() => navigate(-1)} style={btnBack}>
          ← Back
        </button>

        <h2>Patient Details</h2>
      </div>

      {/* Card */}
      <div style={card}>
        <h1>{patient.name}</h1>

        <div style={grid}>
          <p><b>Age:</b> {patient.age}</p>
          <p><b>Gender:</b> {patient.gender}</p>
          <p><b>Status:</b> {patient.status}</p>
          <p><b>Department:</b> {patient.department?.name || patient.departmentCode}</p>
          <p><b>Admission:</b> {patient.admissionDate}</p>
          <p><b>Discharge:</b> {patient.dischargeDate || "Not discharged"}</p>
        </div>

        {patient.status === "active" && (
          <button onClick={handleDischarge} style={btnDanger}>
            Discharge Patient
          </button>
        )}
      </div>
    </div>
  );
}

/* Styles */

const container = {
  padding: "20px",
  background: "#f5f7fb",
  minHeight: "100vh",
};

const header = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
};

const btnBack = {
  padding: "8px 12px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "15px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "10px",
  marginTop: "10px",
};

const btnDanger = {
  marginTop: "20px",
  background: "#ef4444",
  color: "white",
  padding: "10px 15px",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};