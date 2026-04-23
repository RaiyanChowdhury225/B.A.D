const FILTER_OPTIONS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

function FilterBar({ value = "all", onChange }) {
  return (
    <div className="filter-bar" role="tablist" aria-label="Date range">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.key}
          className={`filter-chip ${value === option.key ? "is-active" : ""}`}
          type="button"
          role="tab"
          aria-selected={value === option.key}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default FilterBar;
