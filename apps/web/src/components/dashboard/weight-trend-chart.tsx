"use client";

import type { WeightEntry } from "@nutritrack/api-client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "cn";

const dayFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const label = (iso: string) => dayFmt.format(new Date(`${iso}T00:00:00Z`));

/**
 * Weigh-ins over time, with the target weight as a dashed line. Colours come from CSS
 * (brand tokens) so the chart follows light and dark mode.
 */
export function WeightTrendChart({
  entries,
  targetKg,
  className,
  compact,
}: {
  entries: WeightEntry[];
  targetKg: number | null;
  className?: string;
  compact?: boolean;
}) {
  const data = entries.map((e) => ({ date: e.measured_on, kg: e.weight_kg }));
  const values = data.map((d) => d.kg).concat(targetKg ?? []);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  return (
    <div
      className={cn(
        "text-muted-foreground",
        "[&_.recharts-line-curve]:stroke-primary [&_.recharts-line-dot]:fill-primary [&_.recharts-line-dot]:stroke-card",
        "[&_.recharts-reference-line-line]:stroke-carbs [&_.recharts-cartesian-grid_line]:stroke-border",
        compact ? "h-28" : "h-64",
        className,
      )}
      role="img"
      aria-label={`Weight trend: ${data.length} weigh-ins from ${label(data[0]?.date ?? "")} to ${label(data.at(-1)?.date ?? "")}, latest ${data.at(-1)?.kg} kg${targetKg ? `, target ${targetKg} kg` : ""}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: compact ? 8 : -12 }}>
          {!compact && <CartesianGrid vertical={false} strokeDasharray="3 5" />}
          <XAxis
            dataKey="date"
            tickFormatter={label}
            hide={compact}
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[min, max]}
            hide={compact}
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          {targetKg !== null && (
            <ReferenceLine y={targetKg} strokeDasharray="6 5" strokeWidth={1.5} />
          )}
          {!compact && (
            <Tooltip
              formatter={(v) => [`${v} kg`, "Weight"]}
              labelFormatter={(d) => label(String(d))}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="kg"
            strokeWidth={2.5}
            dot={{ r: compact ? 2.5 : 3.5, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={!compact}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
