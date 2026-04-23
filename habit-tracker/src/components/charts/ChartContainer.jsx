import React from "react";
import ChartCard from "../ChartCard";

/**
 * Reusable wrapper for chart cards
 * Provides consistent header, eyebrow, description, and layout
 */
function ChartContainer({
  title = "Chart",
  eyebrow = "Analysis",
  description = "",
  children,
  insight = "",
}) {
  return (
    <ChartCard eyebrow={eyebrow} title={title} description={description} insight={insight}>
      {children}
    </ChartCard>
  );
}

export default ChartContainer;
