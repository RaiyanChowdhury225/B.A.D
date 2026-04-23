import React, { useMemo } from "react";
import LineChart from "./charts/LineChart";
import MultiLineChart from "./charts/MultiLineChart";
import ScatterChart from "./charts/ScatterChart";
import BarChart from "./charts/BarChart";
import MultiFactorChart from "./charts/MultiFactorChart";
import DistributionChart from "./charts/DistributionChart";
import MetricHeatmap from "./charts/MetricHeatmap";
import ChartContainer from "./charts/ChartContainer";
import { formatAggregateData } from "../lib/chartUtils";
import { computeRollingAverageSeries, formatCorrelationPercent } from "../lib/dataPolish";

const TREND_METRICS = [
  { key: "mood", title: "Mood", description: "Your emotional state over time" },
  { key: "sleep", title: "Sleep", description: "Hours slept each night" },
  { key: "stress", title: "Stress", description: "Stress levels throughout the period" },
  { key: "study", title: "Study", description: "Time dedicated to learning" },
  { key: "workout", title: "Workout", description: "Workout minutes logged per day" },
  { key: "water", title: "Water", description: "Water intake across the period" },
  { key: "focus", title: "Focus", description: "Focus quality during the day" },
  { key: "screenTime", title: "Screen Time", description: "Time spent on screens" },
];

const CORRELATION_PAIRS = [
  { x: "sleep", y: "mood", title: "Sleep vs Mood", description: "Does better sleep lift your mood?" },
  { x: "stress", y: "mood", title: "Stress vs Mood", description: "How does stress move mood?" },
  { x: "study", y: "mood", title: "Study vs Mood", description: "Does study time help or strain mood?" },
  { x: "workout", y: "mood", title: "Workout vs Mood", description: "Does movement help emotional tone?" },
  { x: "water", y: "mood", title: "Water vs Mood", description: "Hydration against mood changes" },
  { x: "focus", y: "mood", title: "Focus vs Mood", description: "Focus quality against mood" },
  { x: "screenTime", y: "mood", title: "Screen Time vs Mood", description: "Screen time and emotional drift" },
];

function getCorrelationInsight(value = 0) {
  const absValue = Math.abs(value);
  if (absValue < 0.2) return "No clear relationship detected.";
  if (absValue < 0.4) return "Weak correlation, but the signal is starting to form.";
  if (absValue < 0.7) return "Moderate correlation with a visible pattern.";
  return "Strong correlation, worth paying attention to.";
}

function MetricValue({ label, value, unit = "" }) {
  return (
    <div>
      <span>{label}</span>
      <strong>
        {value.toFixed(1)}{unit}
      </strong>
    </div>
  );
}

function AnalyticsPage({
  logs = [],
  analytics = {},
  timeContextLabel = "All time",
  theme = "light",
  metricToggles = {},
  selectedLog,
  hoveredLogId,
  activeMetric,
  bestSleepThreshold,
  highStressThreshold,
  onSelectLog,
  onHoverLog,
  onActiveMetric,
  isFiltering,
}) {
  const { correlations = {}, driverRanking = [], weeklyAverages = {} } = analytics;
  const smoothedLogs = useMemo(() => computeRollingAverageSeries(logs, 7), [logs]);

  const weeklyMoodData = useMemo(() => formatAggregateData(logs, "week", "mood"), [logs]);
  const weekdaySleepData = useMemo(() => formatAggregateData(logs, "weekday", "sleep"), [logs]);
  const weekdayFocusData = useMemo(() => formatAggregateData(logs, "weekday", "focus"), [logs]);

  if (!logs.length) {
    return (
      <div className="page-content analytics-page empty-analytics-page">
        <div className="empty-state-panel">
          <h2>No analytics yet</h2>
          <p>Add a few logs and the dashboard will light up with trends, correlations, and distributions.</p>
        </div>
      </div>
    );
  }

  const hasSinglePoint = logs.length === 1;

  return (
    <div className="page-content analytics-page">
      {hasSinglePoint && (
        <p className="analytics-note">Only one data point is available. Trend and correlation views will stabilize with more logs.</p>
      )}

      {isFiltering && (
        <div className="analytics-skeleton-grid">
          <div className="skeleton-card chart" />
          <div className="skeleton-card chart" />
          <div className="skeleton-card chart" />
        </div>
      )}

      <section className="charts-section">
        <h2 className="section-title">Trend board</h2>
        <p className="section-description">7-day rolling trends across core metrics. {timeContextLabel}.</p>
        <div className="charts-grid charts-grid-4">
          {TREND_METRICS.map((metric) => (
            <ChartContainer key={metric.key} eyebrow="trend" title={metric.title} description={metric.description}>
              <LineChart
                series={smoothedLogs}
                metric={metric.key}
                theme={theme}
                enabled={metricToggles[metric.key] !== false}
                selectedLogId={selectedLog?.id}
                hoveredLogId={hoveredLogId}
                bestThreshold={bestSleepThreshold}
                highStressThreshold={highStressThreshold}
                onPointClick={onSelectLog}
                onPointHover={onHoverLog}
              />
            </ChartContainer>
          ))}
        </div>
      </section>

      <section className="charts-section">
        <h2 className="section-title">Relationship analysis</h2>
        <p className="section-description">Mood compared against the habits most likely to influence it.</p>
        <div className="charts-grid charts-grid-3">
          {CORRELATION_PAIRS.map((pair) => (
            <ChartContainer
              key={`${pair.x}-${pair.y}`}
              eyebrow="comparison"
              title={pair.title}
              description={pair.description}
              insight={`Correlation: ${formatCorrelationPercent(correlations[`${pair.x}Mood`])} - ${getCorrelationInsight(correlations[`${pair.x}Mood`] || 0)}`}
            >
              <ScatterChart
                logs={logs}
                xMetric={pair.x}
                yMetric={pair.y}
                correlation={correlations[`${pair.x}Mood`] || 0}
                theme={theme}
                enabled={metricToggles[pair.x] !== false && metricToggles.mood !== false}
                selectedLogId={selectedLog?.id}
                hoveredLogId={hoveredLogId}
                bestSleepThreshold={bestSleepThreshold}
                highStressThreshold={highStressThreshold}
                onPointClick={onSelectLog}
                onPointHover={onHoverLog}
              />
            </ChartContainer>
          ))}
        </div>
      </section>

      <section className="charts-section">
        <h2 className="section-title">Comparative lens</h2>
        <p className="section-description">Line overlays that keep two habits and mood on the same timeline.</p>
        <div className="charts-grid charts-grid-3">
          <ChartContainer
            eyebrow="comparison"
            title="Sleep and Mood"
            description="How your rest and mood move together."
            insight={`Correlation: ${formatCorrelationPercent(correlations.sleepMood)} - ${getCorrelationInsight(correlations.sleepMood || 0)}`}
          >
            <MultiLineChart
              series={logs}
              metric1="sleep"
              metric2="mood"
              theme={theme}
              enabledMetrics={metricToggles}
              selectedLogId={selectedLog?.id}
              hoveredLogId={hoveredLogId}
              activeMetric={activeMetric}
              onPointClick={onSelectLog}
              onPointHover={onHoverLog}
              onMetricFocus={onActiveMetric}
            />
          </ChartContainer>

          <ChartContainer
            eyebrow="comparison"
            title="Stress and Mood"
            description="The pressure valve view."
            insight={`Correlation: ${formatCorrelationPercent(correlations.stressMood)} - ${getCorrelationInsight(correlations.stressMood || 0)}`}
          >
            <MultiLineChart
              series={logs}
              metric1="stress"
              metric2="mood"
              theme={theme}
              enabledMetrics={metricToggles}
              selectedLogId={selectedLog?.id}
              hoveredLogId={hoveredLogId}
              activeMetric={activeMetric}
              onPointClick={onSelectLog}
              onPointHover={onHoverLog}
              onMetricFocus={onActiveMetric}
            />
          </ChartContainer>

          <ChartContainer
            eyebrow="comparison"
            title="Workout and Mood"
            description="Whether movement is lifting the baseline."
            insight={`Correlation: ${formatCorrelationPercent(correlations.workoutMood)} - ${getCorrelationInsight(correlations.workoutMood || 0)}`}
          >
            <MultiLineChart
              series={logs}
              metric1="workout"
              metric2="mood"
              theme={theme}
              enabledMetrics={metricToggles}
              selectedLogId={selectedLog?.id}
              hoveredLogId={hoveredLogId}
              activeMetric={activeMetric}
              onPointClick={onSelectLog}
              onPointHover={onHoverLog}
              onMetricFocus={onActiveMetric}
            />
          </ChartContainer>
        </div>
      </section>

      <section className="charts-section">
        <h2 className="section-title">Multi-factor view</h2>
        <p className="section-description">A combined read on sleep, workout, and mood dynamics.</p>
        <div className="charts-grid charts-grid-2">
          <ChartContainer eyebrow="blend" title="Combined sleep + workout vs mood" description="A single chart for the habits that often travel together.">
            <MultiFactorChart
              logs={logs}
              theme={theme}
              selectedLogId={selectedLog?.id}
              hoveredLogId={hoveredLogId}
              onPointClick={onSelectLog}
              onPointHover={onHoverLog}
            />
          </ChartContainer>

          <ChartContainer eyebrow="distribution" title="Mood distribution" description="How your mood values are spread across the dataset.">
            <DistributionChart logs={logs} metric="mood" theme={theme} />
          </ChartContainer>
        </div>
      </section>

      <section className="charts-section">
        <h2 className="section-title">Heat and rhythm</h2>
        <p className="section-description">A compact calendar-style read of the strongest daily signals.</p>
        <div className="charts-grid charts-grid-2">
          <ChartContainer eyebrow="heatmap" title="Mood heatmap" description="Intensity by day.">
            <MetricHeatmap logs={logs} metric="mood" theme={theme} />
          </ChartContainer>

          <ChartContainer eyebrow="heatmap" title="Stress heatmap" description="Spot the noisy stretches faster.">
            <MetricHeatmap logs={logs} metric="stress" theme={theme} />
          </ChartContainer>
        </div>
      </section>

      <section className="charts-section">
        <h2 className="section-title">Aggregated comparisons</h2>
        <p className="section-description">Weekly and weekday summaries translated into bar charts.</p>
        <div className="charts-grid charts-grid-2">
          <ChartContainer eyebrow="aggregation" title="Weekly mood average" description="Your mood by week.">
            {weeklyMoodData.labels.length ? (
              <BarChart
                labels={weeklyMoodData.labels}
                datasets={weeklyMoodData.datasets}
                metric="mood"
                theme={theme}
                enabled={metricToggles.mood !== false}
                representativeLogs={logs}
                selectedLogId={selectedLog?.id}
                onPointClick={onSelectLog}
              />
            ) : (
              <p className="empty-state">Add more logs to see weekly averages.</p>
            )}
          </ChartContainer>

          <ChartContainer eyebrow="aggregation" title="Weekday sleep average" description="Which days carry the most rest.">
            {weekdaySleepData.labels.length ? (
              <BarChart
                labels={weekdaySleepData.labels}
                datasets={weekdaySleepData.datasets}
                metric="sleep"
                theme={theme}
                enabled={metricToggles.sleep !== false}
                representativeLogs={logs}
                selectedLogId={selectedLog?.id}
                onPointClick={onSelectLog}
              />
            ) : (
              <p className="empty-state">Add more logs to see weekday patterns.</p>
            )}
          </ChartContainer>

          <ChartContainer eyebrow="aggregation" title="Weekday focus average" description="Where focus quality tends to peak.">
            {weekdayFocusData.labels.length ? (
              <BarChart
                labels={weekdayFocusData.labels}
                datasets={weekdayFocusData.datasets}
                metric="focus"
                theme={theme}
                enabled={metricToggles.focus !== false}
                representativeLogs={logs}
                selectedLogId={selectedLog?.id}
                onPointClick={onSelectLog}
              />
            ) : (
              <p className="empty-state">Add more logs to see weekday focus patterns.</p>
            )}
          </ChartContainer>
        </div>
      </section>

      {driverRanking.length > 0 && (
        <section className="charts-section">
          <h2 className="section-title">Habit drivers</h2>
          <p className="section-description">Ranked by the strongest connections to mood.</p>
          <div className="drivers-grid">
            {driverRanking.map((driver, index) => (
              <div key={`${driver.key}-${index}`} className="driver-card">
                <div className="driver-rank">#{index + 1}</div>
                <h4>{driver.label}</h4>
                <p className="driver-correlation">
                  Correlation: <strong>{formatCorrelationPercent(driver.value)}</strong>
                </p>
                <p className="driver-explanation">{driver.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AnalyticsPage;
