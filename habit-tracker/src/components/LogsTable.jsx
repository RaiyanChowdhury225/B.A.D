function LogsTable({ logs, onEdit, onDelete, limit = null }) {
  // Sort logs by timestamp descending (newest first) and apply limit
  const sortedLogs = [...logs].sort((left, right) => Number(right.timestamp || 0) - Number(left.timestamp || 0));
  const visibleLogs = limit ? sortedLogs.slice(0, limit) : sortedLogs;

  if (!visibleLogs.length) {
    return <p className="empty-state">No logs yet. Add your first entry to start the dashboard.</p>;
  }

  return (
    <div className="logs-table-wrap">
      <table className="logs-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Sleep</th>
            <th>Study</th>
            <th>Mood</th>
            <th>Stress</th>
            <th>Workout</th>
            <th>Water</th>
            <th>Focus</th>
            <th>Screen</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {visibleLogs.map((log) => (
            <tr key={log.id}>
              <td>{log.date}</td>
              <td>{log.sleep}h</td>
              <td>{log.study}h</td>
              <td>{log.mood}/10</td>
              <td>{log.stress}/10</td>
              <td>{log.workout ?? "-"}{log.workout != null ? "m" : ""}</td>
              <td>{log.water ?? "-"}{log.water != null ? "L" : ""}</td>
              <td>{log.focus ?? "-"}{log.focus != null ? "/5" : ""}</td>
              <td>{log.screenTime ?? "-"}{log.screenTime != null ? "h" : ""}</td>
              <td className="table-actions">
                <button type="button" className="ghost-button" onClick={() => onEdit(log)}>
                  Edit
                </button>
                <button type="button" className="ghost-button danger" onClick={() => onDelete(log.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LogsTable;
