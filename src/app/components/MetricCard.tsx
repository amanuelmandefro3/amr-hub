"use client";

import { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  note: ReactNode;
  variant: "blue" | "amber" | "green" | "red";
}

const variantStyles = {
  blue: {
    bgColor: "var(--blue-50)",
    textColor: "var(--blue-600)",
    gradientStart: "rgba(57, 120, 210, 0.1)",
    gradientEnd: "rgba(57, 120, 210, 0.02)",
  },
  amber: {
    bgColor: "var(--amber-50)",
    textColor: "var(--amber-500)",
    gradientStart: "rgba(209, 138, 32, 0.1)",
    gradientEnd: "rgba(209, 138, 32, 0.02)",
  },
  green: {
    bgColor: "var(--green-50)",
    textColor: "var(--green-600)",
    gradientStart: "rgba(42, 138, 91, 0.1)",
    gradientEnd: "rgba(42, 138, 91, 0.02)",
  },
  red: {
    bgColor: "var(--red-50)",
    textColor: "var(--red-500)",
    gradientStart: "rgba(216, 81, 77, 0.1)",
    gradientEnd: "rgba(216, 81, 77, 0.02)",
  },
};

export function MetricCard({
  icon,
  label,
  value,
  note,
  variant,
}: MetricCardProps) {
  const style = variantStyles[variant];

  return (
    <div
      className="metric-card-enhanced"
      style={{
        background: `linear-gradient(135deg, ${style.gradientStart} 0%, ${style.gradientEnd} 100%)`,
        borderColor: style.bgColor,
      } as React.CSSProperties}
    >
      <div className="metric-card-header">
        <div
          className="metric-card-icon"
          style={{
            background: style.bgColor,
            color: style.textColor,
          }}
        >
          {icon}
        </div>
        <span className="metric-card-label">{label}</span>
      </div>
      <div className="metric-card-content">
        <strong className="metric-card-value">{value}</strong>
        <span className="metric-card-note">{note}</span>
      </div>
    </div>
  );
}
