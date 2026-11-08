"use client";
import { motion } from "framer-motion";
import Counter from "./Counter";

export default function Ring({
  value,
  goal,
  color,
}: {
  value: number;
  goal: number;
  color: string;
}) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-2xl font-bold">
          <Counter value={value} />
        </span>
        <span className="mt-1 text-[10px] text-muted">/ {goal} cette sem.</span>
      </div>
    </div>
  );
}
