import Card from "./Card";

function ChartCard({ eyebrow, title, description, insight, children, className = "" }) {
  return (
    <Card className={`chart-card-shell ${className}`.trim()} title={description || title}>
      <div className="section-heading chart-card-heading">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h3>{title}</h3> : null}
        {description ? <p className="chart-description">{description}</p> : null}
      </div>

      <div className="chart-content">{children}</div>

      {insight ? (
        <div className="chart-insight" title={typeof insight === "string" ? insight : undefined}>
          <p>{insight}</p>
        </div>
      ) : null}
    </Card>
  );
}

export default ChartCard;