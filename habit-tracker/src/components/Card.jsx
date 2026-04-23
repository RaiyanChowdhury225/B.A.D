function Card({ className = "", children }) {
  return <section className={`panel-card card-shell ${className}`.trim()}>{children}</section>;
}

export default Card;
