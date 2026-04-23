import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { getBaseChartOptions, getDatasetStyle, formatLogTooltipLines, getMetricLabel } from "../../lib/chartUtils";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, Filler);

/**
 * Single metric line chart (e.g., Mood over time, Sleep over time)
 * Shows the trend of one metric across all logged days
 */
function LineChart({ 
  series = [],
  metric = "mood", 
  theme = "light",
  title = "Trend",
  enabled = true,
  selectedLogId,
  hoveredLogId,
  bestThreshold,
  highStressThreshold,
  onPointClick,
  onPointHover,
}) {
  if (!enabled) {
    return <p className="empty-state">This metric is currently hidden by toggle.</p>;
  }

  if (!series.length) {
    return <p className="empty-state">No data points available for this trend yet.</p>;
  }

  const labels = series.map((item, index) => item.date || item.label || `Day ${index + 1}`);
  const values = series.map((item) => {
    const value = item[metric];
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const pointBackgroundColor = series.map((item) => {
    if (item.id && item.id === selectedLogId) {
      return "#f59e0b";
    }

    if (item.id && item.id === hoveredLogId) {
      return "#f97316";
    }

    if (metric === "sleep" && typeof bestThreshold === "number" && Number(item.sleep || 0) >= bestThreshold) {
      return "#16a34a";
    }

    if (metric === "stress" && typeof highStressThreshold === "number" && Number(item.stress || 0) >= highStressThreshold) {
      return "#dc2626";
    }

    return getDatasetStyle(theme, metric).pointBackgroundColor;
  });

  const pointRadius = series.map((item) => {
    if (item.id && (item.id === selectedLogId || item.id === hoveredLogId)) {
      return 6;
    }

    return 3;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: `${getMetricLabel(metric)} over time`,
        data: values,
        ...getDatasetStyle(theme, metric),
        pointBackgroundColor,
        pointRadius,
        borderWidth: 2.5,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    ...getBaseChartOptions(theme, title),
    animation: {
      duration: 480,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    onHover: (_, elements) => {
      if (!onPointHover) {
        return;
      }

      if (!elements.length) {
        onPointHover(null);
        return;
      }

      const idx = elements[0].index;
      onPointHover(series[idx]?.id || null);
    },
    onClick: (_, elements) => {
      if (!onPointClick || !elements.length) {
        return;
      }

      const idx = elements[0].index;
      const clicked = series[idx];
      if (clicked) {
        onPointClick(clicked);
      }
    },
    plugins: {
      ...getBaseChartOptions(theme, title).plugins,
      tooltip: {
        ...getBaseChartOptions(theme, title).plugins.tooltip,
        callbacks: {
          title: (items) => {
            if (!items.length) {
              return "";
            }

            return series[items[0].dataIndex]?.date || items[0].label;
          },
          label: (context) => {
            const item = series[context.dataIndex] || {};
            return formatLogTooltipLines(item);
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "300px" }}>
      {series.length === 1 && <p className="empty-state">Only one point logged. Add more days to reveal a trend line.</p>}
      <Line data={chartData} options={options} />
    </div>
  );
}

export default LineChart;
