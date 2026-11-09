import type { Post } from "./types";

export const weekStart = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lundi = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x.getTime();
};

// decalage en semaines calendaires (evite les erreurs d'une heure au changement d'heure)
export const shiftWeek = (t: number, n: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() + 7 * n);
  return d.getTime();
};

const when = (p: Post) => new Date(p.posted_at ?? p.created_at);

export function countPerWeek(posts: Post[]) {
  const perWeek = new Map<number, number>();
  for (const p of posts) {
    if (p.status !== "done") continue;
    const w = weekStart(when(p));
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1);
  }
  return perWeek;
}

// serie en cours (la semaine en cours ne casse pas la serie) et meilleure serie
export function streaks(perWeek: Map<number, number>, goal: number, thisWeek: number) {
  let streak = 0;
  let best = 0;
  if (goal <= 0) return { streak, best };
  let w = thisWeek;
  if ((perWeek.get(w) ?? 0) >= goal) streak++;
  w = shiftWeek(w, -1);
  while ((perWeek.get(w) ?? 0) >= goal) {
    streak++;
    w = shiftWeek(w, -1);
  }
  const keys = [...perWeek.keys()];
  if (keys.length) {
    let run = 0;
    for (let x = Math.min(...keys); x <= thisWeek; x = shiftWeek(x, 1)) {
      if ((perWeek.get(x) ?? 0) >= goal) {
        run++;
        best = Math.max(best, run);
      } else if (x !== thisWeek) run = 0;
    }
  }
  return { streak, best };
}

export function computeStats(posts: Post[], goal: number) {
  const done = posts.filter((p) => p.status === "done");
  const now = new Date();
  const thisWeek = weekStart(now);
  const perWeek = countPerWeek(posts);

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const w = shiftWeek(thisWeek, i - 7);
    return { start: w, count: perWeek.get(w) ?? 0 };
  });

  const { streak, best } = streaks(perWeek, goal, thisWeek);

  const byTheme = new Map<string, number>();
  for (const p of posts) if (p.theme) byTheme.set(p.theme, (byTheme.get(p.theme) ?? 0) + 1);

  const byDay = Array.from({ length: 7 }, () => 0); // lundi = 0
  for (const p of done) byDay[(when(p).getDay() + 6) % 7]++;

  return {
    total: posts.length,
    todo: posts.length - done.length,
    done: done.length,
    month: done.filter((p) => {
      const d = when(p);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    week: perWeek.get(thisWeek) ?? 0,
    fb: posts.filter((p) => p.published?.fb).length,
    li: posts.filter((p) => p.published?.li).length,
    streak,
    bestStreak: best,
    weeks,
    byTheme: [...byTheme.entries()].sort((a, b) => b[1] - a[1]),
    byDay,
  };
}

// defi a deux : total des posts publies par les deux, compare a un objectif commun
export function computeDuo(posts: Post[], target: number) {
  const thisWeek = weekStart(new Date());
  const perWeek = countPerWeek(posts);
  const week = perWeek.get(thisWeek) ?? 0;
  const { streak, best } = streaks(perWeek, target, thisWeek);
  const wins = [...perWeek.entries()].filter(([w, n]) => w !== thisWeek && n >= target).length + (week >= target ? 1 : 0);
  const maxWeek = Math.max(0, ...perWeek.values());
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const w = shiftWeek(thisWeek, i - 7);
    return { start: w, count: perWeek.get(w) ?? 0 };
  });
  return { week, streak, best, wins, maxWeek, weeks };
}
