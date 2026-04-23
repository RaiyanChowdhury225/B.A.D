import { useEffect, useState } from "react";

function SettingsPanel({
  theme,
  onThemeChange,
  themeOptions = [],
  onCycleTheme,
  onReset,
  onExport,
  goals,
  onGoalsChange,
}) {
  const [draftGoals, setDraftGoals] = useState(goals);

  useEffect(() => {
    setDraftGoals(goals);
  }, [goals]);

  const handleGoalChange = (key) => (event) => {
    const value = Number(event.target.value);
    setDraftGoals((current) => ({
      ...current,
      [key]: Number.isFinite(value) && value > 0 ? value : current[key],
    }));
  };

  const handleSaveGoals = () => {
    onGoalsChange?.(draftGoals);
  };

  return (
    <div className="settings-grid">
      <article className="settings-card">
        <p className="eyebrow">Goals</p>
        <h3>Target settings</h3>
        <p>Set clear targets to compare behavior against daily and weekly expectations.</p>

        <div className="goal-grid">
          <label>
            Sleep goal (hours/day)
            <input
              type="number"
              min="1"
              max="14"
              step="0.5"
              value={draftGoals?.sleepHoursPerDay ?? ""}
              onChange={handleGoalChange("sleepHoursPerDay")}
            />
          </label>

          <label>
            Study goal (hours/day)
            <input
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              value={draftGoals?.studyHoursPerDay ?? ""}
              onChange={handleGoalChange("studyHoursPerDay")}
            />
          </label>

          <label>
            Workout goal (times/week)
            <input
              type="number"
              min="1"
              max="14"
              step="1"
              value={draftGoals?.workoutTimesPerWeek ?? ""}
              onChange={handleGoalChange("workoutTimesPerWeek")}
            />
          </label>
        </div>

        <div className="settings-actions">
          <button type="button" className="primary-button" onClick={handleSaveGoals}>
            Save goals
          </button>
        </div>
      </article>

      <article className="settings-card">
        <p className="eyebrow">Theme</p>
        <h3>{theme[0].toUpperCase() + theme.slice(1)} mode</h3>
        <p>Choose a color mood for your dashboard. Try lavender for a softer look.</p>

        <div className="theme-palette-grid">
          {themeOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`theme-swatch theme-${option} ${theme === option ? "is-active" : ""}`}
              onClick={() => onThemeChange(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <button type="button" className="ghost-button" onClick={onCycleTheme}>
          Cycle theme
        </button>
      </article>

      <article className="settings-card">
        <p className="eyebrow">Data</p>
        <h3>Manage logs</h3>
        <p>Export a backup or reset the dataset when you want a fresh start.</p>
        <div className="settings-actions">
          <button type="button" className="ghost-button" onClick={onExport}>
            Export JSON
          </button>
          <button type="button" className="ghost-button danger" onClick={onReset}>
            Reset data
          </button>
        </div>
      </article>
    </div>
  );
}

export default SettingsPanel;
