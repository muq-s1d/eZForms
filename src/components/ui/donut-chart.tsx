"use client";

import { useState } from "react";

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  total: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, outerR, startAngle);
  const end = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export function DonutChart({ data, total }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No data to display
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const cx = 130;
  const cy = 130;
  const innerR = 60;
  const baseOuterR = 85;
  const popOutR = 93;
  const gap = 0.035; // radians gap between slices

  // Build cumulative angles starting from top (-π/2)
  const startOffset = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const prior = data.slice(0, i).reduce((s, x) => s + x.value, 0);
    const start = startOffset + (prior / total) * 2 * Math.PI + gap;
    const end = startOffset + ((prior + d.value) / total) * 2 * Math.PI - gap;
    return { ...d, start, end, index: i };
  });

  const viewBox = "22 22 216 216";

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-center gap-6 w-full">
        {/* SVG Donut */}
        <svg viewBox={viewBox} className="w-[280px] shrink-0" style={{ overflow: "visible" }}>
          {slices.map((slice) => {
            const isWinner = slice.value === maxValue;
            const isHovered = hovered === slice.index;
            const outerR = isWinner || isHovered ? popOutR : baseOuterR;
            const path = arcPath(cx, cy, innerR, outerR, slice.start, slice.end);
            return (
              <path
                key={slice.name}
                d={path}
                fill={slice.color}
                stroke="var(--card)"
                strokeWidth={2}
                style={{
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                  opacity: hovered !== null && hovered !== slice.index ? 0.75 : 1,
                }}
                onMouseEnter={() => setHovered(slice.index)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-2.5">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            const isWinner = d.value === maxValue;
            return (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span
                  className="text-foreground whitespace-nowrap"
                  style={{ fontWeight: isWinner ? 600 : 400 }}
                >
                  {d.name}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {d.value} {d.value === 1 ? "vote" : "votes"}, {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

