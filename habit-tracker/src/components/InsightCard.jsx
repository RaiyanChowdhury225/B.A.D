import Card from "./Card";

function InsightCard({ eyebrow, title, children, className = "" }) {
  return (
    <Card className={`insight-card-shell ${className}`.trim()} title={title || eyebrow}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? <h3 className="insight-card-title">{title}</h3> : null}
      {children}
    </Card>
  );
}

export default InsightCard;