function formatValue(value) {
  return Number(value || 0).toFixed(1);
}

function DetailPanel({ log, onClose }) {
  if (!log) {
    return null;
  }

  return (
    <aside className="detail-panel" aria-live="polite">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Daily detail</p>
          <h3>{log.date || "Selected day"}</h3>
        </div>
        <button className="ghost-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="detail-grid">
        <div>
          <span>Mood</span>
          <strong>{formatValue(log.mood)}</strong>
        </div>
        <div>
          <span>Sleep</span>
          <strong>{formatValue(log.sleep)} h</strong>
        </div>
        <div>
          <span>Stress</span>
          <strong>{formatValue(log.stress)}</strong>
        </div>
        <div>
          <span>Study</span>
          <strong>{formatValue(log.study)} h</strong>
        </div>
        <div>
          <span>Workout</span>
          <strong>{log.workout != null ? `${formatValue(log.workout)} min` : "n/a"}</strong>
        </div>
        <div>
          <span>Water Intake</span>
          <strong>{log.water != null ? `${formatValue(log.water)} L` : "n/a"}</strong>
        </div>
        <div>
          <span>Focus Quality</span>
          <strong>{log.focus != null ? `${formatValue(log.focus)}/5` : "n/a"}</strong>
        </div>
        <div>
          <span>Screen Time</span>
          <strong>{log.screenTime != null ? `${formatValue(log.screenTime)} h` : "n/a"}</strong>
        </div>
      </div>

      <div className="detail-notes">
        <p className="eyebrow">Notes</p>
        <p>{log.notes?.trim() || "No notes saved for this day."}</p>
      </div>
    </aside>
  );
}

export default DetailPanel;
