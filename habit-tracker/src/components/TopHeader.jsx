function TopHeader({ title, subtitle, theme, onThemeChange, themeOptions = [], onOpenMenu }) {
  return (
    <header className="top-header card-shell">
      <button className="menu-toggle" onClick={onOpenMenu} type="button" aria-label="Open navigation">
        Menu
      </button>

      <div>
        <p className="eyebrow">Analytics dashboard</p>
        <h2>{title}</h2>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      <label className="theme-picker" htmlFor="theme-picker">
        <span>Theme</span>
        <select id="theme-picker" value={theme} onChange={(event) => onThemeChange(event.target.value)}>
          {themeOptions.map((option) => (
            <option key={option} value={option}>
              {option[0].toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

export default TopHeader;
