export default function PatientCard({ patient }) {
  const getColor = () => {
    if (patient.status === "active") return "#22c55e";
    if (patient.status === "discharged") return "#3b82f6";
    return "#999";
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "15px",
        borderRadius: "12px",
        marginBottom: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        borderLeft: `6px solid ${getColor()}`,
      }}
    >
      <h3>{patient.name}</h3>

      <p>Age: {patient.age}</p>
      <p>Department: {patient.departmentCode}</p>

      <span
        style={{
          background: getColor(),
          color: "#fff",
          padding: "4px 10px",
          borderRadius: "8px",
          fontSize: "12px",
        }}
      >
        {patient.status}
      </span>
    </div>
  );
}