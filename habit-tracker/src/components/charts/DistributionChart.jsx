import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";
import { getBaseChartOptions, getDatasetStyle, formatHistogramData, getMetricLabel } from "../../lib/chartUtils";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

function DistributionChart({ logs = [], metric = "sleep", theme = "light", title }) {
  const histogram = formatHistogramData(logs, metric, 6);

  if (!histogram.labels.length) {
    return <p className="empty-state">Not enough data to show a distribution yet.</p>;
  }

  const chartData = {
    labels: histogram.labels,
    datasets: [
      {
        label: `${getMetricLabel(metric)} distribution`,
        data: histogram.datasets[0].data,
        ...getDatasetStyle(theme, metric),
        borderRadius: 8,
      },
    ],
  };

  const options = {
    ...getBaseChartOptions(theme, title || `${getMetricLabel(metric)} distribution`),
    indexAxis: "x",
    scales: {
      x: {
        ticks: { color: theme === "dark" ? "#e8eef5" : "#2c3e50", font: { size: 11 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: theme === "dark" ? "#e8eef5" : "#2c3e50", font: { size: 11 }, precision: 0 },
        grid: { color: theme === "dark" ? "#3a4a5c40" : "#e0e6ed40", drawBorder: false },
      },
    },
  };

  return (
    <div style={{ height: "300px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default DistributionChart;
