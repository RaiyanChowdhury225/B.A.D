function SkeletonDashboard() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-hero card-shell">
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line long" />
      </div>

      <div className="skeleton-row">
        <div className="skeleton-card tall" />
        <div className="skeleton-card tall" />
        <div className="skeleton-card tall" />
        <div className="skeleton-card tall" />
      </div>
      <div className="skeleton-row two-col">
        <div className="skeleton-card chart" />
        <div className="skeleton-card chart" />
      </div>

      <div className="skeleton-row two-col">
        <div className="skeleton-card short" />
        <div className="skeleton-card short" />
      </div>
    </div>
  );
}

export default SkeletonDashboard;
