import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import PatientList from "./pages/PatientList.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div>
      {/* NAV BAR بسيطة */}
      <div style={{ padding: 10 }}>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("patients")}>Patients</button>
      </div>

      {/* RENDER */}
      {page === "dashboard" && <Dashboard />}
      {page === "patients" && <PatientList />}
    </div>
  );
}