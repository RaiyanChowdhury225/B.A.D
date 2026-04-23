const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "logs", label: "Logs" },
  { key: "analytics", label: "Analytics" },
  { key: "insights", label: "Insights" },
  { key: "settings", label: "Settings" },
];

function Sidebar({ activePage, onNavigate, appName = "Habit Tracker", isOpen = false, onClose }) {
  return (
    <>
      <aside className={`sidebar-shell ${isOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <p className="brand-kicker">Personal analytics</p>
          <h1>{appName}</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`sidebar-link ${activePage === item.key ? "is-active" : ""}`}
              onClick={() => onNavigate(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {isOpen && <button className="sidebar-overlay" type="button" aria-label="Close navigation" onClick={onClose} />}
    </>
  );
}

export default Sidebar;
