"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Post } from "@/lib/types";

export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function WeekStrip({
  posts,
  selected,
  onSelect,
}: {
  posts: Post[];
  selected: string | null;
  onSelect: (day: string | null) => void;
}) {
  const [offset, setOffset] = useState(0);
  const today = isoDay(new Date());
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <div className="mb-5 rounded-2xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span className="font-semibold text-fg">📅 Planning</span>
        <span className="flex items-center gap-1">
          <button onClick={() => setOffset(offset - 1)} className="h-6 w-6 rounded bg-surface-2 hover:opacity-80" aria-label="Semaine précédente">‹</button>
          <button onClick={() => setOffset(0)} className="px-1 hover:text-fg">{offset === 0 ? "Cette semaine" : offset > 0 ? `+${offset} sem.` : `${offset} sem.`}</button>
          <button onClick={() => setOffset(offset + 1)} className="h-6 w-6 rounded bg-surface-2 hover:opacity-80" aria-label="Semaine suivante">›</button>
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const key = isoDay(d);
          const planned = posts.filter((p) => p.status !== "done" && p.scheduled_for === key).length;
          const done = posts.filter((p) => p.status === "done" && p.posted_at && isoDay(new Date(p.posted_at)) === key).length;
          const on = selected === key;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelect(on ? null : key)}
              className="flex flex-col items-center rounded-xl border py-2 text-xs"
              style={{
                borderColor: on ? "var(--accent)" : key === today ? "var(--accent2)" : "var(--line)",
                background: on ? "var(--surface-2)" : "transparent",
              }}
            >
              <span className="text-muted">{d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}</span>
              <span className="text-base font-bold">{d.getDate()}</span>
              <span className="mt-0.5 flex h-3 items-center gap-0.5">
                {planned > 0 && <span className="rounded-full bg-warn px-1 text-[9px] leading-3 text-white">{planned}</span>}
                {done > 0 && <span className="rounded-full bg-ok px-1 text-[9px] leading-3 text-white">{done}</span>}
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted">
        <span className="mr-1 rounded-full bg-warn px-1 text-white">n</span>prévus
        <span className="mx-1 ml-3 rounded-full bg-ok px-1 text-white">n</span>publiés · clique sur un jour pour filtrer
      </p>
    </div>
  );
}
