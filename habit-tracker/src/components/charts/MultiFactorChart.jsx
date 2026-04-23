import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { getBaseChartOptions, getDatasetStyle, formatLogTooltipLines } from "../../lib/chartUtils";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, Filler);

function normalize(values) {
  const numeric = values.filter((value) => Number.isFinite(value));
  if (!numeric.length) {
    return values.map(() => 0);
  }

  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min || 1;

  return values.map((value) => {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return ((value - min) / range) * 10;
  });
}

function MultiFactorChart({
  logs = [],
  theme = "light",
  title = "Sleep + Workout vs Mood",
  selectedLogId,
  hoveredLogId,
  onPointClick,
  onPointHover,
}) {
  const labels = logs.map((item, index) => item.date || `Day ${index + 1}`);
  const sleepValues = logs.map((item) => Number(item.sleep || 0));
  const workoutValues = logs.map((item) => Number(item.workout || 0));
  const moodValues = logs.map((item) => Number(item.mood || 0));
  const combinedValues = normalize(sleepValues.map((value, index) => value + (workoutValues[index] || 0)));

  const pointRadius = logs.map((item) => (item.id && (item.id === selectedLogId || item.id === hoveredLogId) ? 6 : 3));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Combined sleep + workout",
        data: combinedValues,
        ...getDatasetStyle(theme, "sleep"),
        borderWidth: 2.8,
        pointRadius,
        tension: 0.35,
        fill: false,
      },
      {
        label: "Mood",
        data: moodValues,
        ...getDatasetStyle(theme, "mood"),
        borderWidth: 2.8,
        pointRadius,
        tension: 0.35,
        fill: false,
      },
    ],
  };

  const options = {
    ...getBaseChartOptions(theme, title),
    animation: {
      duration: 520,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    onHover: (_, elements) => {
      if (!onPointHover) return;
      if (!elements.length) {
        onPointHover(null);
        return;
      }
      const idx = elements[0].index;
      onPointHover(logs[idx]?.id || null);
    },
    onClick: (_, elements) => {
      if (!onPointClick || !elements.length) return;
      const idx = elements[0].index;
      if (logs[idx]) {
        onPointClick(logs[idx]);
      }
    },
    plugins: {
      ...getBaseChartOptions(theme, title).plugins,
      tooltip: {
        ...getBaseChartOptions(theme, title).plugins.tooltip,
        callbacks: {
          title: (items) => (items.length ? logs[items[0].dataIndex]?.date || items[0].label : ""),
          label: (context) => {
            const log = logs[context.dataIndex] || {};
            return [...formatLogTooltipLines(log), `Combined effect: ${Number(context.parsed.y || 0).toFixed(1)}`];
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "300px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export default MultiFactorChart;
