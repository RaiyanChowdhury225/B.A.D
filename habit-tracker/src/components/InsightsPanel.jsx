import { formatCorrelationPercent, formatMetricValue } from "../lib/dataPolish";
import InsightCard from "./InsightCard";

function InsightsPanel({
  summaryInsights,
  correlations,
  strongestDriver,
  anomalies,
  trendInsights,
  driverRanking,
  insightEngine,
  dataQuality,
  goalProgress,
  prediction,
  decisionLayer,
  consistencyIndicators,
  outliers,
  timeContextLabel,
}) {
  const qualityScore = dataQuality?.score ?? 0;
  const qualityBand = dataQuality?.confidenceBand || "very-low";

  return (
    <div className="insights-grid">
      <InsightCard className="decision-card" eyebrow="Decision layer" title={decisionLayer?.headline || "Top action: Keep logging consistently."}>
        <p className="insight-meta">{timeContextLabel}</p>

        <div className="decision-recommendations">
          {(decisionLayer?.recommendations || []).slice(0, 3).map((item) => (
            <div key={item.key} className={`decision-item priority-${item.priority}`}>
              <div className="decision-item-head">
                <strong>{item.title}</strong>
                <span>{item.priority}</span>
              </div>
              <p>{item.reason}</p>
              <p className="decision-impact">Expected impact: {item.expectedImpact}</p>
            </div>
          ))}
        </div>

        <div className="decision-goals">
          <p className="decision-subtitle">Goal follow-ups</p>
          {(decisionLayer?.goalActions || []).length ? (
            (decisionLayer.goalActions || []).slice(0, 3).map((line, index) => (
              <p className="insight-line" key={`${index}-${line}`}>{line}</p>
            ))
          ) : (
            <p className="insight-line">All goals are on track. Keep momentum this week.</p>
          )}
        </div>
      </InsightCard>

      <InsightCard className={`prediction-card confidence-${prediction?.confidence?.band || "very-low"}`} eyebrow="Prediction engine" title={`Next-day mood: ${prediction?.nextDayMood ?? "N/A"}`}>
        <div className="prediction-head">
          <p className="prediction-confidence">Confidence {prediction?.confidence?.score ?? 0}%</p>
        </div>
        {prediction?.range ? (
          <p className="prediction-range">
            Forecast range: {prediction.range.min} to {prediction.range.max}
          </p>
        ) : null}
        <p className="prediction-copy">{prediction?.explanation || "Prediction unavailable."}</p>

        <div className="prediction-signals">
          <div>
            <span>Avg sleep</span>
            <strong>{formatMetricValue("sleep", prediction?.inputs?.avgSleep, "-")}</strong>
          </div>
          <div>
            <span>Avg stress</span>
            <strong>{formatMetricValue("stress", prediction?.inputs?.avgStress, "-")}</strong>
          </div>
          <div>
            <span>Workout days</span>
            <strong>{prediction?.inputs?.workoutDays ?? 0}</strong>
          </div>
        </div>

        {prediction?.riskFlags?.length ? (
          <div className="prediction-risks">
            {prediction.riskFlags.map((flag) => (
              <p key={`${flag.code}-${flag.message}`} className={`risk-pill risk-${flag.severity}`}>
                {flag.label}: {flag.message}
              </p>
            ))}
          </div>
        ) : (
          <p className="prediction-safe">No major risk patterns detected in the current window.</p>
        )}
      </InsightCard>

      <InsightCard className="goal-card" eyebrow="Goal tracking" title={`${goalProgress?.overall?.completionRate ?? 0}% achieved`}>

        <div className="goal-progress-list">
          <div className="goal-progress-item">
            <div className="goal-progress-head">
              <span>Sleep goal</span>
              <strong>{goalProgress?.sleep?.metDays ?? 0}/{goalProgress?.period?.totalDays ?? 0} days</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.min(100, goalProgress?.sleep?.completionRate ?? 0)}%` }} />
            </div>
          </div>

          <div className="goal-progress-item">
            <div className="goal-progress-head">
              <span>Study goal</span>
              <strong>{goalProgress?.study?.metDays ?? 0}/{goalProgress?.period?.totalDays ?? 0} days</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.min(100, goalProgress?.study?.completionRate ?? 0)}%` }} />
            </div>
          </div>

          <div className="goal-progress-item">
            <div className="goal-progress-head">
              <span>Workout goal</span>
              <strong>{goalProgress?.workout?.metWeeks ?? 0}/{goalProgress?.workout?.totalWeeks ?? 0} weeks</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.min(100, goalProgress?.workout?.completionRate ?? 0)}%` }} />
            </div>
          </div>
        </div>

        <div className="goal-feedback-list">
          {(goalProgress?.feedback || []).slice(0, 3).map((line, index) => (
            <p className="insight-line" key={`${index}-${line}`}>{line}</p>
          ))}
        </div>
      </InsightCard>

      <InsightCard className={`quality-card quality-${qualityBand}`} eyebrow="Data quality" title={`${qualityScore}/100 confidence`}>
        <div className="quality-header">
          <span className="quality-badge">{qualityBand.replace("-", " ")}</span>
        </div>
        <div className="quality-metrics">
          <div>
            <span>Logs</span>
            <strong>{dataQuality?.components?.logs ?? 0}</strong>
          </div>
          <div>
            <span>Consistency</span>
            <strong>{dataQuality?.components?.consistency ?? 0}</strong>
          </div>
          <div>
            <span>Recency</span>
            <strong>{dataQuality?.components?.recency ?? 0}</strong>
          </div>
        </div>
        <div className="quality-rows">
          <p>
            Missing days: <strong>{dataQuality?.missingData?.missingDays ?? 0}</strong>
          </p>
          <p>
            Current streak: <strong>{dataQuality?.consistency?.currentStreak ?? 0} days</strong>
          </p>
          <p>
            Last log: <strong>{dataQuality?.recency?.lastLogDate || "N/A"}</strong>
          </p>
        </div>
        {dataQuality?.warnings?.length ? (
          <div className="quality-warnings">
            {dataQuality.warnings.slice(0, 2).map((warning, index) => (
              <p className="insight-line" key={`${index}-${warning}`}>{warning}</p>
            ))}
          </div>
        ) : null}
      </InsightCard>

      <InsightCard eyebrow="Consistency" title="Stability overview">
        <div className="quality-metrics">
          <div>
            <span>Sleep consistency</span>
            <strong>{consistencyIndicators?.sleep?.score ?? 0}%</strong>
            <p>{(consistencyIndicators?.sleep?.stdDev ?? 0) <= 1.1 ? "Stable schedule" : "Variable schedule"}</p>
          </div>
          <div>
            <span>Mood stability</span>
            <strong>{consistencyIndicators?.mood?.score ?? 0}%</strong>
            <p>{(consistencyIndicators?.mood?.stdDev ?? 0) <= 1.2 ? "Stable" : "Variable"}</p>
          </div>
          <div>
            <span>Stress stability</span>
            <strong>{consistencyIndicators?.stress?.score ?? 0}%</strong>
            <p>{(consistencyIndicators?.stress?.stdDev ?? 0) <= 1.2 ? "Stable" : "Variable"}</p>
          </div>
        </div>
      </InsightCard>

      <InsightCard eyebrow="Outlier watch" title={`${outliers?.count ?? 0} unusual events`}>
        {outliers?.rows?.length ? (
          <div className="insight-stack">
            {outliers.rows.slice(0, 4).map((row, index) => (
              <p className="insight-line" key={`${row.date}-${row.metric}-${index}`}>
                <strong>{row.date}:</strong> {row.metric} at {Number(row.value).toFixed(1)} ({row.zScore > 0 ? "+" : ""}
                {row.zScore}σ)
              </p>
            ))}
          </div>
        ) : (
          <p className="insight-line">No extreme values detected.</p>
        )}
      </InsightCard>

      <InsightCard className="highlight-card" eyebrow="Key insight" title={strongestDriver ? strongestDriver.label : "No clear driver yet"}>
        <p className="insight-lead">
          {strongestDriver ? strongestDriver.explanation : "Add more data to surface a stronger driver."}
        </p>
      </InsightCard>

      <InsightCard eyebrow="Driver ranking" title="Ranked connections">
        <div className="driver-list">
          {driverRanking.map((line, index) => (
            <p className="insight-line" key={`${index}-${line}`}>{line}</p>
          ))}
        </div>
      </InsightCard>

      <InsightCard eyebrow="Correlations" title="Relationship strength">
        <div className="correlation-list">
          <div>
            <span>Sleep / Mood</span>
            <strong>{formatCorrelationPercent(correlations.sleepMood)}</strong>
          </div>
          <div>
            <span>Stress / Mood</span>
            <strong>{formatCorrelationPercent(correlations.stressMood)}</strong>
          </div>
          <div>
            <span>Study / Mood</span>
            <strong>{formatCorrelationPercent(correlations.studyMood)}</strong>
          </div>
          <div>
            <span>Workout / Mood</span>
            <strong>{formatCorrelationPercent(correlations.workoutMood)}</strong>
          </div>
          <div>
            <span>Screen / Mood</span>
            <strong>{formatCorrelationPercent(correlations.screenTimeMood)}</strong>
          </div>
          <div>
            <span>Focus / Mood</span>
            <strong>{formatCorrelationPercent(correlations.focusMood)}</strong>
          </div>
        </div>
      </InsightCard>

      <InsightCard eyebrow="Rule engine" title="Pattern engine">
        <div className="insight-stack">
          {(insightEngine?.computedInsights || []).slice(0, 4).map((line, index) => (
            <p className="insight-line" key={`${index}-${line}`}>{line}</p>
          ))}
          {!insightEngine?.computedInsights?.length && (
            <p className="insight-line">Rule-based insights will appear as more data is logged.</p>
          )}
        </div>
      </InsightCard>

      <InsightCard eyebrow="Summary" title="Quick read">
        <div className="insight-stack">
          {summaryInsights.map((line, index) => (
            <p className="insight-line" key={`${index}-${line}`}>{line}</p>
          ))}
        </div>
      </InsightCard>

      <InsightCard eyebrow="Rolling trends" title="Time-series view">
        <div className="insight-stack">
          {trendInsights.map((line, index) => (
            <p className="insight-line" key={`${index}-${line}`}>{line}</p>
          ))}
        </div>
      </InsightCard>

      <InsightCard eyebrow="Anomalies" title="Unusual days">
        {anomalies.length ? (
          <div className="insight-stack">
            {anomalies.map((item) => (
              <p className="insight-line" key={`${item.date}-${item.message}`}>
                <strong>{item.date}:</strong> {item.message}
              </p>
            ))}
          </div>
        ) : (
          <p className="insight-line">No unusual days detected yet.</p>
        )}
      </InsightCard>
    </div>
  );
}

export default InsightsPanel;
