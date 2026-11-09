"use client";
import { motion } from "framer-motion";
import { computeDuo } from "@/lib/stats";
import type { Post } from "@/lib/types";
import Counter from "./Counter";

const BADGES = [
  { id: "first", icon: "🌱", label: "Premier défi", test: (d: ReturnType<typeof computeDuo>) => d.wins >= 1 },
  { id: "streak3", icon: "🔥", label: "3 semaines d'affilée", test: (d: ReturnType<typeof computeDuo>) => d.best >= 3 },
  { id: "wins10", icon: "🏆", label: "10 défis gagnés", test: (d: ReturnType<typeof computeDuo>) => d.wins >= 10 },
  { id: "double", icon: "⚡", label: "Semaine à 2× l'objectif", test: (d: ReturnType<typeof computeDuo> & { target: number }) => d.maxWeek >= 2 * d.target },
];

export default function DuoChallenge({
  posts,
  target,
  onChange,
}: {
  posts: Post[];
  target: number;
  onChange: (n: number) => void;
}) {
  const d = computeDuo(posts, target);
  const pct = Math.min(d.week / target, 1);
  const won = d.week >= target;
  const maxBar = Math.max(target, ...d.weeks.map((w) => w.count), 1);

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">🤝 Défi à deux</h2>
        <div className="flex items-center gap-1 text-xs text-muted">
          Objectif
          <button onClick={() => onChange(target - 1)} disabled={target <= 1} className="h-7 w-7 rounded bg-surface-2 disabled:opacity-40" aria-label="Moins">−</button>
          <span className="w-6 text-center font-semibold text-fg">{target}</span>
          <button onClick={() => onChange(target + 1)} disabled={target >= 60} className="h-7 w-7 rounded bg-surface-2 disabled:opacity-40" aria-label="Plus">+</button>
        </div>
      </div>

      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>
          <span className="text-2xl font-bold"><Counter value={d.week} /></span>
          <span className="text-muted"> / {target} posts à vous deux cette semaine</span>
        </span>
        {won && <span className="text-sm font-semibold text-ok">✓ Gagné</span>}
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: won ? "var(--ok)" : "linear-gradient(90deg, var(--accent), var(--accent2))" }}
        />
      </div>

      <div className="mt-3 flex items-end gap-1.5" style={{ height: 44 }} aria-label="8 dernières semaines">
        {d.weeks.map((w, i) => (
          <div key={w.start} className="relative flex h-full flex-1 items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(w.count / maxBar) * 100}%` }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              className="min-h-[3px] w-full rounded-t"
              style={{ background: w.count >= target ? "var(--ok)" : "var(--line)" }}
              title={`${w.count} posts`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>il y a 8 sem.</span>
        <span>cette sem.</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>🔥 Série : <b className="text-fg">{d.streak}</b> sem.</span>
        <span>🏅 Record : <b className="text-fg">{d.best}</b> sem.</span>
        <span>🎯 Défis gagnés : <b className="text-fg">{d.wins}</b></span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {BADGES.map((b) => {
          const on = b.test({ ...d, target });
          return (
            <span
              key={b.id}
              title={on ? "Débloqué" : "À débloquer"}
              className="rounded-full border px-2.5 py-0.5 text-xs"
              style={on ? { borderColor: "var(--accent)", background: "var(--surface-2)" } : { borderColor: "var(--line)", color: "var(--muted)", opacity: 0.55 }}
            >
              {on ? b.icon : "🔒"} {b.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
