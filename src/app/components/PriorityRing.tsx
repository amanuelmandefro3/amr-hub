"use client";

interface PriorityCount {
  label: string;
  value: number;
  color: string;
}

interface PriorityRingProps {
  data: PriorityCount[];
}

export function PriorityRing({ data }: PriorityRingProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const segments = data.map((item) => {
    const percentage = (item.value / Math.max(total, 1)) * 100;
    const arcLength = (percentage / 100) * (2 * Math.PI * 50);
    const startAngle = currentAngle;
    const endAngle = currentAngle + (percentage / 100) * (2 * Math.PI);
    currentAngle = endAngle;

    const startX = 60 + 50 * Math.cos(startAngle - Math.PI / 2);
    const startY = 60 + 50 * Math.sin(startAngle - Math.PI / 2);
    const endX = 60 + 50 * Math.cos(endAngle - Math.PI / 2);
    const endY = 60 + 50 * Math.sin(endAngle - Math.PI / 2);

    const largeArc = percentage > 50 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A 50 50 0 ${largeArc} 1 ${endX} ${endY}`,
    ].join(" ");

    return {
      pathData,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage,
    };
  });

  return (
    <div className="priority-ring-container">
      <div className="priority-ring">
        <svg viewBox="0 0 120 120" style={{ background: "transparent" }}>
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              stroke={segment.color}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              style={{ transition: "all 200ms ease" }}
            />
          ))}
        </svg>
        <div className="priority-ring-center">
          <div className="priority-ring-value">{total}</div>
          <div className="priority-ring-label">Total</div>
        </div>
      </div>

      <div className="priority-ring-legend">
        {data.map((item, index) => (
          <div key={index} className="priority-ring-item">
            <div
              className="priority-ring-dot"
              style={{ background: item.color }}
            />
            <span>{item.label}</span>
            <span style={{ marginLeft: "auto", fontWeight: 600 }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
