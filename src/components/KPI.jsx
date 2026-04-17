export default function KPI({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 15,
        borderRadius: 10,
        borderLeft: `5px solid ${color}`,
      }}
    >
      <p style={{ margin: 0, fontSize: 12 }}>{title}</p>
      <h2 style={{ margin: 0 }}>{value}</h2>
    </div>
  );
}