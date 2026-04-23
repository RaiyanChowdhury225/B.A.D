A modern SaaS-style habit tracking and behavioral analytics dashboard built with React.
This project goes beyond a simple tracker — it analyzes user behavior using data visualization, correlation insights, and prediction logic.


Live Demo-habittracker-olive.vercel.app


This app tracks daily lifestyle metrics such as sleep, mood, stress, study, and workout.
It then transforms raw data into meaningful insights using analytics, correlations, and predictive reasoning.

The goal of this project was to move from a simple CRUD app to a data-driven personal analytics system.


 Features
1. Core Tracking
Daily logging system (sleep, mood, stress, study, workout, etc.)
Editable and deletable logs
Persistent storage using browser storage


2.Analytics Engine
Multi-factor correlation analysis
Trend visualization over time
Rolling averages for smoother insights
Outlier detection


3.Insights System
Automatic behavioral insights
Identifies strongest habit drivers
Explains relationships between factors
Generates actionable recommendations


4. Prediction System
Rule-based mood prediction
Risk detection (e.g. low sleep + high stress → low mood risk)
Confidence scoring for predictions

5.Data Visualization
Line charts (trend analysis)
Scatter plots (correlation analysis)
Bar charts (weekly comparisons)
Multi-metric dashboards

6. UI/UX
SaaS-style dashboard layout
Dark/light theme support
Responsive design (mobile + desktop)
Smooth micro-interactions and transitions
🧩 Tech Stack
React.js
JavaScript (ES6+)
Chart.js / react-chartjs-2
CSS / Tailwind (if used)
LocalStorage (for persistence)
