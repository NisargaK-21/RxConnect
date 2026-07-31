export default function DashboardCards({
  title,
  value,
}) {
  return (
    <div
      style={{
        border: "1px solid gray",
        padding: 20,
        marginBottom: 20,
      }}
    >
      <h3>{title}</h3>

      <h1>{value}</h1>
    </div>
  );
}