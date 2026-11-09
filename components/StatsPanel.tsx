"use client";
import { motion } from "framer-motion";
import type { computeStats } from "@/lib/stats";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const hue = (t: string) => {
  let h = 0;
  for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};

export default function StatsPanel({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const maxDay = Math.max(1, ...stats.byDay);
  const bestIdx = stats.byDay.some((n) => n > 0) ? stats.byDay.indexOf(Math.max(...stats.byDay)) : -1;
  const maxTheme = Math.max(1, ...stats.byTheme.map(([, n]) => n));

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 font-semibold">📊 Statistiques</h2>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-2 p-3 text-center">
          <div className="text-2xl font-bold">{stats.bestStreak}</div>
          <div className="text-xs text-muted">record de série (sem.)</div>
        </div>
        <div className="rounded-xl bg-surface-2 p-3 text-center">
          <div className="text-2xl font-bold">{bestIdx >= 0 ? DAYS[bestIdx] : "–"}</div>
          <div className="text-xs text-muted">{bestIdx >= 0 ? `meilleur jour : ${DAYS_FULL[bestIdx]}` : "meilleur jour"}</div>
        </div>
      </div>

      <div className="mb-1 text-xs text-muted">Posts publiés par jour de la semaine</div>
      <div className="mb-4 flex items-end gap-1.5" style={{ height: 64 }}>
        {stats.byDay.map((n, i) => (
          <div key={DAYS[i]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(n / maxDay) * 100}%` }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              className="min-h-[3px] w-full rounded-t"
              style={{ background: i === bestIdx ? "var(--accent)" : "var(--line)" }}
              title={`${n} posts`}
            />
          </div>
        ))}
      </div>
      <div className="-mt-3 mb-4 flex gap-1.5 text-[10px] text-muted">
        {DAYS.map((d) => (
          <span key={d} className="min-w-0 flex-1 text-center">{d}</span>
        ))}
      </div>

      <div className="mb-2 text-xs text-muted">Posts par thème</div>
      {stats.byTheme.length === 0 ? (
        <p className="text-sm text-muted">Aucun thème utilisé pour l&apos;instant.</p>
      ) : (
        <div className="space-y-1.5">
          {stats.byTheme.slice(0, 6).map(([t, n], i) => (
            <div key={t} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate sm:w-36">{t}</span>
              <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(n / maxTheme) * 100}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: `hsl(${hue(t)} 65% 55%)` }}
                />
              </div>
              <span className="w-5 shrink-0 text-right text-muted">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
