import type { Post } from "./types";

const weekStart = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lundi = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x.getTime();
};

const WEEK = 7 * 24 * 3600 * 1000;
const when = (p: Post) => new Date(p.posted_at ?? p.created_at);

export function computeStats(posts: Post[], goal: number) {
  const done = posts.filter((p) => p.status === "done");
  const now = new Date();
  const thisWeek = weekStart(now);

  const perWeek = new Map<number, number>();
  for (const p of done) {
    const w = weekStart(when(p));
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1);
  }

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const w = thisWeek - (7 - i) * WEEK;
    return { start: w, count: perWeek.get(w) ?? 0 };
  });

  // streak : semaines consecutives avec objectif atteint (la semaine en cours ne casse pas la serie)
  let streak = 0;
  let w = thisWeek;
  if ((perWeek.get(w) ?? 0) >= goal) streak++;
  w -= WEEK;
  while ((perWeek.get(w) ?? 0) >= goal && goal > 0) {
    streak++;
    w -= WEEK;
  }

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
    weeks,
  };
}
