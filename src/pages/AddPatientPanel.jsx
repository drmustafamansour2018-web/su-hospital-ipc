/* eslint-disable no-undef */
import { useState } from "react";
import { addPatientService } from "../services/patientService";

export default function AddPatient() {
const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    nationalId: "",
    address: "",
    department: "",
    disease: "",
    ticketNo: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await addPatientService(form);
      alert("Patient added successfully");

      navigate("/"); // رجوع للداشبورد
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>

      <h2 style={{ marginBottom: 20 }}>🏥 Add New Patient</h2>

      <div style={styles.form}>

        <input name="name" placeholder="Full Name" onChange={handleChange} />
        <input name="age" placeholder="Age" onChange={handleChange} />

        <select name="gender" onChange={handleChange}>
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <input name="phone" placeholder="Phone" onChange={handleChange} />
        <input name="nationalId" placeholder="National ID" onChange={handleChange} />
        <input name="address" placeholder="Address" onChange={handleChange} />

        <select name="department" onChange={handleChange}>
          <option value="">Department</option>
          <option>ICU</option>
          <option>ER</option>
          <option>CCU</option>
        </select>

        <select name="disease" onChange={handleChange}>
          <option value="">Disease</option>
          <option>COVID-19</option>
          <option>Sepsis</option>
          <option>Pneumonia</option>
          <option>Meningitis</option>
        </select>

        <input name="ticketNo" placeholder="Ticket No" onChange={handleChange} />

        <button onClick={handleSubmit} style={styles.button}>
          Save Patient
        </button>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 30,
    maxWidth: 600,
    margin: "auto",
    fontFamily: "Arial",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  button: {
    padding: 12,
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};