const METRICS = [
  { key: "mood", label: "Mood" },
  { key: "sleep", label: "Sleep" },
  { key: "stress", label: "Stress" },
  { key: "study", label: "Study" },
  { key: "workout", label: "Workout" },
  { key: "water", label: "Water" },
  { key: "focus", label: "Focus" },
  { key: "screenTime", label: "Screen time" },
];

function MetricToggle({ toggles, onToggle }) {
  return (
    <div className="metric-toggle-row" aria-label="Metrics visibility">
      {METRICS.map((metric) => (
        <button
          key={metric.key}
          type="button"
          className={`metric-chip ${toggles[metric.key] ? "is-active" : ""}`}
          onClick={() => onToggle(metric.key)}
          aria-pressed={Boolean(toggles[metric.key])}
        >
          {metric.label}
        </button>
      ))}
    </div>
  );
}

export default MetricToggle;
