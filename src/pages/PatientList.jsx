import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/config";
import PatientCard from "../components/PatientCard";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const patientsRef = ref(db, "patients");

    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setPatients(list);
      } else {
        setPatients([]);
      }
    });
  }, []);

  const filtered = patients.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={container}>
      <h2>🏥 Patients List</h2>

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={input}
      />

      <div style={{ marginTop: 20 }}>
        {filtered.map((p) => (
          <PatientCard key={p.id} patient={p} />
        ))}
      </div>
    </div>
  );
}

const container = {
  padding: "20px",
};

const input = {
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #ccc",
};