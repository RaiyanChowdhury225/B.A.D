import React from "react";
import { getMetricLabel, getMetricUnit } from "../../lib/chartUtils";

function getCellColor(value, metric, theme) {
  const numeric = Number(value || 0);
  const max = 10;
  const intensity = Math.max(0.15, Math.min(1, numeric / max));

  if (metric === "stress" || metric === "screenTime") {
    return theme === "dark"
      ? `rgba(244, 114, 182, ${intensity})`
      : `rgba(220, 38, 38, ${intensity})`;
  }

  return theme === "dark"
    ? `rgba(96, 165, 250, ${intensity})`
    : `rgba(37, 99, 235, ${intensity})`;
}

function MetricHeatmap({ logs = [], metric = "mood", theme = "light" }) {
  if (!logs.length) {
    return <p className="empty-state">Add more logs to see a heatmap.</p>;
  }

  const sortedLogs = [...logs].sort((left, right) => Number(left.timestamp || 0) - Number(right.timestamp || 0));

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-grid">
        {sortedLogs.map((log) => (
          <div
            key={log.id}
            className="heatmap-cell"
            title={`${log.date}: ${getMetricLabel(metric)} ${Number(log[metric] || 0).toFixed(1)}${getMetricUnit(metric) ? ` ${getMetricUnit(metric)}` : ""}`}
            style={{ background: getCellColor(log[metric], metric, theme) }}
          >
            <span>{log.date?.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MetricHeatmap;
