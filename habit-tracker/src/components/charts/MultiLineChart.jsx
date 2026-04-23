import React from "react";
import { Line } from "react-chartjs-2";
import { getBaseChartOptions, getDatasetStyle, formatLogTooltipLines, getMetricLabel } from "../../lib/chartUtils";

/**
 * Multi-line chart for comparing two metrics (e.g., Sleep vs Mood)
 * Shows the relationship between metrics on the same timeline
 */
function MultiLineChart({ 
  series = [], 
  metric1 = "sleep", 
  metric2 = "mood",
  theme = "light",
  title = "Comparison",
  enabledMetrics = {},
  selectedLogId,
  hoveredLogId,
  activeMetric,
  onPointClick,
  onPointHover,
  onMetricFocus,
}) {
  const labels = series.map((item, index) => item.date || item.label || `Day ${index + 1}`);
  const visible = [metric1, metric2].filter((metric) => enabledMetrics[metric] !== false);

  if (!visible.length) {
    return <p className="empty-state">Both metrics are hidden by toggle.</p>;
  }

  const buildDataset = (metric) => ({
    label: getMetricLabel(metric),
    data: series.map((item) => Number(item[metric] || 0)),
    ...getDatasetStyle(theme, metric),
    borderWidth: activeMetric && activeMetric !== metric ? 1.8 : 2.8,
    borderDash: activeMetric && activeMetric !== metric ? [6, 4] : undefined,
    pointRadius: series.map((item) => {
      if (item.id && (item.id === selectedLogId || item.id === hoveredLogId)) {
        return 6;
      }

      return 3;
    }),
    pointHoverRadius: 5,
    tension: 0.4,
    fill: false,
    hidden: !visible.includes(metric),
  });

  const chartData = {
    labels,
    datasets: [buildDataset(metric1), buildDataset(metric2)],
  };

  const options = {
    ...getBaseChartOptions(theme, title),
    animation: {
      duration: 480,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: "index",
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
      if (!elements.length) {
        return;
      }

      const { datasetIndex, index } = elements[0];
      const clickedMetric = datasetIndex === 0 ? metric1 : metric2;
      if (clickedMetric && onMetricFocus) {
        onMetricFocus(clickedMetric);
      }

      if (onPointClick && series[index]) {
        onPointClick(series[index]);
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
      <Line data={chartData} options={options} />
    </div>
  );
}

export default MultiLineChart;
