import React from "react";
import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, Title, Tooltip, Legend } from "chart.js";
import { getBaseChartOptions, getDatasetStyle, formatScatterData, formatLogTooltipLines, getMetricLabel } from "../../lib/chartUtils";

ChartJS.register(LinearScale, PointElement, Title, Tooltip, Legend);

/**
 * Scatter plot for 2D correlation analysis
 * Shows relationship between two variables (e.g., Sleep vs Mood)
 * Points closer to a diagonal line indicate stronger correlation
 */
function ScatterChart({ 
  logs = [], 
  xMetric = "sleep", 
  yMetric = "mood",
  correlation = 0,
  theme = "light",
  title = "Correlation Analysis",
  enabled = true,
  selectedLogId,
  hoveredLogId,
  bestSleepThreshold,
  highStressThreshold,
  onPointClick,
  onPointHover,
}) {
  if (!enabled) {
    return <p className="empty-state">This scatter pair is hidden by toggle.</p>;
  }

  const data = formatScatterData(logs, xMetric, yMetric);

  const pointBackgroundColor = data.map((point) => {
    const log = point.meta || {};

    if (log.id && log.id === selectedLogId) {
      return "#f59e0b";
    }

    if (log.id && log.id === hoveredLogId) {
      return "#f97316";
    }

    if (xMetric === "sleep" && typeof bestSleepThreshold === "number" && Number(log.sleep || 0) >= bestSleepThreshold) {
      return "#16a34a";
    }

    if (xMetric === "stress" && typeof highStressThreshold === "number" && Number(log.stress || 0) >= highStressThreshold) {
      return "#dc2626";
    }

    return getDatasetStyle(theme, yMetric).pointBackgroundColor;
  });

  const chartData = {
    datasets: [
      {
        label: `${getMetricLabel(xMetric)} vs ${getMetricLabel(yMetric)}`,
        data,
        ...getDatasetStyle(theme, yMetric),
        pointBackgroundColor,
        borderWidth: 0,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBorderWidth: 2,
      },
    ],
  };

  const colors = theme === "dark" 
    ? { text: "#e8eef5", grid: "#3a4a5c" }
    : { text: "#2c3e50", grid: "#e0e6ed" };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 500,
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
      const log = data[idx]?.meta;
      onPointHover(log?.id || null);
    },
    onClick: (_, elements) => {
      if (!onPointClick || !elements.length) {
        return;
      }

      const idx = elements[0].index;
      const log = data[idx]?.meta;
      if (log) {
        onPointClick(log);
      }
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: colors.text,
          font: { size: 12, weight: "600" },
          padding: 16,
        },
      },
      title: {
        display: !!title,
        text: title,
        color: colors.text,
        font: { size: 14, weight: "700" },
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          title: (items) => {
            if (!items.length) {
              return "";
            }

            return data[items[0].dataIndex]?.meta?.date || "Selected day";
          },
          label: (context) => {
            const log = data[context.dataIndex]?.meta || {};
            return formatLogTooltipLines(log);
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: getMetricLabel(xMetric),
          color: colors.text,
          font: { size: 12, weight: "600" },
        },
        ticks: {
          color: colors.text,
          font: { size: 11 },
        },
        grid: {
          color: `${colors.grid}40`,
          drawBorder: false,
        },
      },
      y: {
        title: {
          display: true,
          text: getMetricLabel(yMetric),
          color: colors.text,
          font: { size: 12, weight: "600" },
        },
        ticks: {
          color: colors.text,
          font: { size: 11 },
        },
        grid: {
          color: `${colors.grid}40`,
          drawBorder: false,
        },
      },
    },
  };

  return (
    <div>
      <div style={{ height: "300px" }}>
        <Scatter data={chartData} options={options} />
      </div>
      {correlation !== 0 && (
        <div style={{ marginTop: "12px" }}>
          <p style={{ fontSize: "12px", color: colors.text, margin: "0" }}>
            <strong>Correlation coefficient:</strong> {correlation.toFixed(2)}
            {Math.abs(correlation) > 0.7 && " (strong)"}
            {Math.abs(correlation) > 0.4 && Math.abs(correlation) <= 0.7 && " (moderate)"}
            {Math.abs(correlation) <= 0.4 && " (weak)"}
          </p>
        </div>
      )}
    </div>
  );
}

export default ScatterChart;
