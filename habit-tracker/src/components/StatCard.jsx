function StatCard({ label, value, detail, tone = "default", emphasize = false }) {
  return (
    <article className={`stat-card tone-${tone} ${emphasize ? "is-emphasized" : ""}`} title={detail || label}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {detail ? <p className="stat-detail">{detail}</p> : null}
    </article>
  );
}

export default StatCard;
