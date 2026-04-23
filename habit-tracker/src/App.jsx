import { useEffect, useMemo, useState } from "react";
import HabitForm from "./components/HabitTracker";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import Card from "./components/Card";
import StatCard from "./components/StatCard";
import InsightsPanel from "./components/InsightsPanel";
import LogsTable from "./components/LogsTable";
import SettingsPanel from "./components/SettingsPanel";
import SkeletonDashboard from "./components/SkeletonDashboard";
import AnalyticsPage from "./components/AnalyticsPage";
import FilterBar from "./components/FilterBar";
import MetricToggle from "./components/MetricToggle";
import DetailPanel from "./components/DetailPanel";
import ToastMessage from "./components/ToastMessage";
import { useInteractiveAnalytics } from "./hooks/useInteractiveAnalytics";
import {
  formatMetricValue,
  formatPercent,
  getConsistencyIndicator,
  getSmartLabel,
} from "./lib/dataPolish";
import {
  createEmptyLogStore,
  getLogsArrayFromStore,
  migrateToLogStore,
  removeLogFromStore,
  upsertLogInStore,
} from "./lib/logStore";

const STORAGE_KEYS = {
  logs: "habit-tracker.logs",
  theme: "habit-tracker.theme",
  goals: "habit-tracker.goals",
};

const DEFAULT_GOALS = {
  sleepHoursPerDay: 8,
  studyHoursPerDay: 2,
  workoutTimesPerWeek: 3,
};

const THEME_OPTIONS = ["light", "dark", "lavender", "mint", "sunset"];

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    subtitle: "A quick view of your current wellness patterns.",
  },
  logs: {
    title: "Logs",
    subtitle: "Add, edit, and review your tracked days.",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Multi-dimensional data visualization and correlation analysis.",
  },
  insights: {
    title: "Insights",
    subtitle: "Correlations, drivers, and anomaly detection in one place.",
  },
  settings: {
    title: "Settings",
    subtitle: "Adjust your theme and manage your dataset.",
  },
};

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function createLogId() {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getValidTheme(theme) {
  return THEME_OPTIONS.includes(theme) ? theme : "light";
}

function getValidGoals(raw) {
  const goals = raw && typeof raw === "object" ? raw : {};

  const sleep = Number(goals.sleepHoursPerDay);
  const study = Number(goals.studyHoursPerDay);
  const workout = Number(goals.workoutTimesPerWeek);

  return {
    sleepHoursPerDay: Number.isFinite(sleep) && sleep > 0 ? sleep : DEFAULT_GOALS.sleepHoursPerDay,
    studyHoursPerDay: Number.isFinite(study) && study > 0 ? study : DEFAULT_GOALS.studyHoursPerDay,
    workoutTimesPerWeek: Number.isFinite(workout) && workout > 0 ? workout : DEFAULT_GOALS.workoutTimesPerWeek,
  };
}

function App() {
  const [logStore, setLogStore] = useState(() => {
    const savedLogs = safeParse(localStorage.getItem(STORAGE_KEYS.logs), null);
    const legacyLogs = savedLogs ? savedLogs : safeParse(localStorage.getItem("logs"), []);

    return migrateToLogStore(savedLogs, legacyLogs);
  });
  const [theme, setTheme] = useState(() => getValidTheme(localStorage.getItem(STORAGE_KEYS.theme) || "light"));
  const [goals, setGoals] = useState(() => getValidGoals(safeParse(localStorage.getItem(STORAGE_KEYS.goals), DEFAULT_GOALS)));
  const [activePage, setActivePage] = useState("dashboard");
  const [editingLog, setEditingLog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logStore));
    localStorage.removeItem("logs");
  }, [logStore]);

  const logs = useMemo(() => getLogsArrayFromStore(logStore), [logStore]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  }, [goals]);

  const {
    dateRange,
    setRange,
    metricToggles,
    toggleMetric,
    filteredLogs,
    analytics,
    selectedLog,
    setSelectedLog,
    hoveredLogId,
    setHoveredLogId,
    activeMetric,
    setActiveMetric,
    bestSleepThreshold,
    highStressThreshold,
    dynamicInsights,
    isFiltering,
    toastMessage,
    qualitySummary,
    timeContextLabel,
  } = useInteractiveAnalytics(logs, goals);

  const visibleRecentLogs = useMemo(() => filteredLogs, [filteredLogs]);

  const handleThemeChange = (nextTheme) => {
    setTheme(getValidTheme(nextTheme));
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const index = THEME_OPTIONS.indexOf(currentTheme);
      const nextIndex = (index + 1) % THEME_OPTIONS.length;
      return THEME_OPTIONS[nextIndex];
    });
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  const handleSubmitLog = (formValues) => {
    const nextLog = {
      ...formValues,
      id: editingLog?.id || createLogId(),
      timestamp: formValues.timestamp || Date.parse(`${formValues.date}T12:00:00`),
    };

    setLogStore((currentStore) => upsertLogInStore(currentStore, nextLog));

    setEditingLog(null);
    setActivePage("dashboard");
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setActivePage("logs");
  };

  const handleDeleteLog = (id) => {
    setLogStore((currentStore) => removeLogFromStore(currentStore, id));
    setEditingLog((currentEditing) => (currentEditing?.id === id ? null : currentEditing));
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
  };

  const handleReset = () => {
    if (window.confirm("Reset all habit data?")) {
      setLogStore(createEmptyLogStore());
      setEditingLog(null);
      setSelectedLog(null);
      setActivePage("dashboard");
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logStore, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "habit-tracker-logs.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const pageMeta = PAGE_META[activePage] || PAGE_META.dashboard;
  const summaryLines = dynamicInsights;

  const renderInteractionToolbar = () => (
    <div className="interaction-toolbar card-shell">
      <FilterBar value={dateRange} onChange={setRange} />
      <MetricToggle toggles={metricToggles} onToggle={toggleMetric} />
    </div>
  );

  const renderDashboard = () => {
    const kpiCards = [
      {
        label: "Data Confidence",
        value: formatPercent(analytics.dataQuality?.score ?? 0, 0),
        detail: qualitySummary.note,
        tone: qualitySummary.tone,
      },
      {
        label: "Goal Completion",
        value: formatPercent(analytics.goalProgress?.overall?.completionRate ?? 0, 0),
        detail: "Combined completion across sleep, study, and workout goals.",
        tone: "indigo",
      },
      {
        label: "Mood",
        value: formatMetricValue("mood", analytics.kpis.avgMood),
        detail: `Current state: ${getSmartLabel("mood", analytics.kpis.avgMood)}.`,
        tone: "indigo",
      },
      {
        label: "Sleep",
        value: formatMetricValue("sleep", analytics.kpis.avgSleep),
        detail: `Sleep quality reads as ${getSmartLabel("sleep", analytics.kpis.avgSleep)}.`,
        tone: "blue",
      },
      {
        label: "Stress",
        value: formatMetricValue("stress", analytics.kpis.avgStress),
        detail: `Stress status: ${getSmartLabel("stress", analytics.kpis.avgStress)}.`,
        tone: "slate",
      },
      {
        label: "Sleep Consistency",
        value: formatPercent(analytics.consistencyIndicators?.sleep?.score ?? 0, 0),
        detail: getConsistencyIndicator(analytics.consistencyIndicators?.sleep?.stdDev ?? null).label,
        tone: "navy",
      },
      {
        label: "Study",
        value: formatMetricValue("study", analytics.kpis.avgStudy),
        detail: `Study trend: ${getSmartLabel("study", analytics.kpis.avgStudy)}.`,
        tone: "indigo",
      },
      {
        label: "Workout",
        value: formatMetricValue("workout", analytics.kpis.avgWorkout),
        detail: `Activity level: ${getSmartLabel("workout", analytics.kpis.avgWorkout)}.`,
        tone: "blue",
      },
      {
        label: "Screen Time",
        value: formatMetricValue("screenTime", analytics.kpis.avgScreenTime),
        detail: `${getSmartLabel("screenTime", analytics.kpis.avgScreenTime)} usage pattern.`,
        tone: "slate",
      },
      {
        label: "Outlier Events",
        value: `${analytics.outliers?.count ?? 0}`,
        detail: (analytics.outliers?.count ?? 0) > 0 ? "Unusual days detected. Review anomaly cards." : "No major outliers detected.",
        tone: (analytics.outliers?.count ?? 0) > 0 ? "navy" : "indigo",
      },
    ];

    return (
      <div className="page-content dashboard-page" key="dashboard">
        <section className="kpi-grid">
          {kpiCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              detail={card.detail}
              tone={card.tone}
              emphasize={card.label === "Data Confidence" || card.label === "Goal Completion" || card.label === "Outlier Events"}
            />
          ))}
        </section>

        <section className="dashboard-main-grid">
          <div className="bottom-grid">
            <Card className="insights-panel">
              <div className="section-heading">
                <p className="eyebrow">Insights</p>
                <h3>Dynamic summary</h3>
              </div>
              <InsightsPanel
                summaryInsights={summaryLines}
                correlations={analytics.correlations}
                strongestDriver={analytics.strongestDriver}
                anomalies={analytics.anomalies}
                trendInsights={analytics.trendInsights}
                driverRanking={analytics.driverRanking.map((item) => item.explanation)}
                insightEngine={analytics.insightEngine}
                dataQuality={analytics.dataQuality}
                goalProgress={analytics.goalProgress}
                prediction={analytics.prediction}
                decisionLayer={analytics.decisionLayer}
                consistencyIndicators={analytics.consistencyIndicators}
                outliers={analytics.outliers}
                timeContextLabel={timeContextLabel}
              />
            </Card>

            <Card className="recent-panel">
              <div className="section-heading">
                <p className="eyebrow">Recent logs</p>
                <h3>Latest entries</h3>
              </div>
              <LogsTable logs={visibleRecentLogs} onEdit={handleEditLog} onDelete={handleDeleteLog} limit={6} />
            </Card>
          </div>
        </section>
      </div>
    );
  };

  const renderLogsPage = () => (
    <div className="page-content logs-page" key="logs">
      <Card className="form-panel">
        <div className="section-heading">
          <p className="eyebrow">Input</p>
          <h3>{editingLog ? "Edit log" : "Add log"}</h3>
        </div>
        <HabitForm
          initialValues={editingLog || undefined}
          onSubmit={handleSubmitLog}
          onCancel={editingLog ? handleCancelEdit : undefined}
          submitLabel={editingLog ? "Save changes" : "Add log"}
        />
      </Card>

      <Card className="table-panel">
        <div className="section-heading">
          <p className="eyebrow">History</p>
          <h3>Recent and archived logs</h3>
        </div>
        <LogsTable logs={logs} onEdit={handleEditLog} onDelete={handleDeleteLog} />
      </Card>
    </div>
  );

  const renderInsightsPage = () => (
    <div className="page-content insights-page" key="insights">
      <Card className="analysis-panel">
        <div className="section-heading">
          <p className="eyebrow">Analytics</p>
          <h3>Structured insights</h3>
        </div>
        <InsightsPanel
          summaryInsights={summaryLines}
          correlations={analytics.correlations}
          strongestDriver={analytics.strongestDriver}
          anomalies={analytics.anomalies}
          trendInsights={analytics.trendInsights}
          driverRanking={analytics.driverRanking.map((item) => item.explanation)}
          insightEngine={analytics.insightEngine}
          dataQuality={analytics.dataQuality}
          goalProgress={analytics.goalProgress}
          prediction={analytics.prediction}
          decisionLayer={analytics.decisionLayer}
          consistencyIndicators={analytics.consistencyIndicators}
          outliers={analytics.outliers}
          timeContextLabel={timeContextLabel}
        />
      </Card>

      <div className="weekly-grid">
        {Object.entries(analytics.weeklyAverages).length ? (
          Object.entries(analytics.weeklyAverages).map(([weekLabel, values]) => (
            <Card className="weekly-card" key={weekLabel}>
              <div className="section-heading compact">
                <p className="eyebrow">{weekLabel}</p>
                <h3>{values.count} logs</h3>
              </div>
              <div className="weekly-metrics">
                <div>
                  <span>Sleep</span>
                  <strong>{values.sleep.toFixed(1)}</strong>
                </div>
                <div>
                  <span>Study</span>
                  <strong>{values.study.toFixed(1)}</strong>
                </div>
                <div>
                  <span>Mood</span>
                  <strong>{values.mood.toFixed(1)}</strong>
                </div>
                <div>
                  <span>Stress</span>
                  <strong>{values.stress.toFixed(1)}</strong>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="weekly-empty">
            <p className="empty-state">Add a few logs to unlock weekly summaries.</p>
          </Card>
        )}
      </div>
    </div>
  );

  const renderSettingsPage = () => (
    <div className="page-content settings-page" key="settings">
      <Card className="settings-panel-wrap">
        <div className="section-heading">
          <p className="eyebrow">Settings</p>
          <h3>Appearance and data</h3>
        </div>
        <SettingsPanel
          theme={theme}
          onThemeChange={handleThemeChange}
          themeOptions={THEME_OPTIONS}
          onCycleTheme={toggleTheme}
          onReset={handleReset}
          onExport={handleExport}
          goals={goals}
          onGoalsChange={(nextGoals) => setGoals(getValidGoals(nextGoals))}
        />
      </Card>
    </div>
  );

  const renderAnalyticsPage = () => (
    <AnalyticsPage
      logs={filteredLogs}
      analytics={analytics}
      timeContextLabel={timeContextLabel}
      theme={theme}
      metricToggles={metricToggles}
      selectedLog={selectedLog}
      hoveredLogId={hoveredLogId}
      activeMetric={activeMetric}
      bestSleepThreshold={bestSleepThreshold}
      highStressThreshold={highStressThreshold}
      onSelectLog={setSelectedLog}
      onHoverLog={setHoveredLogId}
      onActiveMetric={setActiveMetric}
      isFiltering={isFiltering}
    />
  );

  const renderActivePage = () => {
    switch (activePage) {
      case "logs":
        return renderLogsPage();
      case "analytics":
        return renderAnalyticsPage();
      case "insights":
        return renderInsightsPage();
      case "settings":
        return renderSettingsPage();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        appName="Habit Tracker"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="workspace-shell">
        <TopHeader
          title={pageMeta.title}
          subtitle={`${pageMeta.subtitle} ${activePage !== "logs" && activePage !== "settings" ? `(${timeContextLabel})` : ""}`}
          theme={theme}
          onThemeChange={handleThemeChange}
          themeOptions={THEME_OPTIONS}
          onOpenMenu={() => setIsSidebarOpen(true)}
        />

        {(activePage === "dashboard" || activePage === "analytics" || activePage === "insights") &&
          renderInteractionToolbar()}

        <div className="workspace-content page-transition">
          {isReady ? renderActivePage() : <SkeletonDashboard />}
        </div>
      </main>

      <DetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
      <ToastMessage message={toastMessage} />
    </div>
  );
}

export default App;
