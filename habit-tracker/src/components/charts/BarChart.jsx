import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";
import { getBaseChartOptions, getDatasetStyle, formatLogTooltipLines } from "../../lib/chartUtils";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

/**
 * Bar chart for aggregated data comparisons
 * Shows metrics grouped by week or weekday (e.g., Average mood per week)
 */
function BarChart({ 
  labels = [], 
  datasets = [],
  theme = "light",
  title = "Aggregated Data",
  metric = "mood",
  enabled = true,
  representativeLogs = [],
  selectedLogId,
  onPointClick,
}) {
  if (!enabled) {
    return <p className="empty-state">This bar metric is currently hidden by toggle.</p>;
  }

  const representativeByLabel = labels.map((_, index) => representativeLogs[index] || representativeLogs[0] || null);

  const chartData = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data.map(v => Number(v)),
      ...getDatasetStyle(theme, metric),
      borderWidth: 1.5,
      borderRadius: 6,
      hoverBackgroundColor: getDatasetStyle(theme, metric).borderColor,
      hoverBorderWidth: 2,
    })),
  };

  const options = {
    ...getBaseChartOptions(theme, title),
    indexAxis: "x",
    onClick: (_, elements) => {
      if (!onPointClick || !elements.length) {
        return;
      }

      const idx = elements[0].index;
      const representative = representativeByLabel[idx];
      if (representative) {
        onPointClick(representative);
      }
    },
    animation: {
      duration: 500,
      easing: "easeOutQuart",
    },
    plugins: {
      ...getBaseChartOptions(theme, title).plugins,
      tooltip: {
        ...getBaseChartOptions(theme, title).plugins.tooltip,
        callbacks: {
          title: (items) => items[0]?.label || "",
          label: (context) => {
            const idx = context.dataIndex;
            const representative = representativeByLabel[idx] || {};
            return [
              `${context.dataset.label}: ${Number(context.parsed.y || 0).toFixed(1)}`,
              ...formatLogTooltipLines(representative),
            ];
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        ticks: {
          color: theme === "dark" ? "#e8eef5" : "#2c3e50",
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
      },
      y: {
        stacked: false,
        beginAtZero: true,
        ticks: {
          color: theme === "dark" ? "#e8eef5" : "#2c3e50",
          font: { size: 11 },
          stepSize: 1,
        },
        grid: {
          color: theme === "dark" ? "#3a4a5c40" : "#e0e6ed40",
          drawBorder: false,
        },
      },
    },
  };

  return (
    <div style={{ height: "300px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default BarChart;
