"use client";
import { useEffect, useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { isoDay } from "./WeekStrip";

type Reminder = { key: string; icon: string; text: string; tone: "bad" | "warn" | "fg" };

async function notify(title: string, body: string, tag: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, tag, icon: "/icon-192.png", badge: "/icon-192.png" });
    else new Notification(title, { body, tag, icon: "/icon-192.png" });
  } catch {}
}

export default function Reminders({ posts, week, goal }: { posts: Post[]; week: number; goal: number }) {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const today = isoDay(new Date());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
    if ("serviceWorker" in navigator && Notification.permission === "granted") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const items = useMemo<Reminder[]>(() => {
    const out: Reminder[] = [];
    const todo = posts.filter((p) => p.status !== "done" && p.scheduled_for);
    const late = todo.filter((p) => p.scheduled_for! < today).length;
    const due = todo.filter((p) => p.scheduled_for === today).length;
    if (late > 0) out.push({ key: `late:${today}:${late}`, icon: "⏰", text: `${late} post${late > 1 ? "s" : ""} en retard à publier`, tone: "bad" });
    if (due > 0) out.push({ key: `due:${today}:${due}`, icon: "📅", text: `${due} post${due > 1 ? "s" : ""} à publier aujourd'hui`, tone: "warn" });
    const dow = new Date().getDay(); // jeudi a dimanche
    const missing = goal - week;
    if (goal > 0 && missing > 0 && (dow >= 4 || dow === 0)) {
      out.push({ key: `week:${today}:${missing}`, icon: "🎯", text: `Plus que ${missing} post${missing > 1 ? "s" : ""} pour ton objectif, la semaine finit dimanche`, tone: "warn" });
    }
    return out;
  }, [posts, today, week, goal]);

  // notification systeme, une seule fois par rappel et par jour (app ouverte ou installee)
  useEffect(() => {
    if (perm !== "granted") return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem("tandem-notified") ?? "[]");
    } catch {}
    const fresh = items.filter((i) => !seen.includes(i.key));
    fresh.forEach((i) => notify("Tandem", i.text, i.key));
    if (fresh.length) {
      try {
        localStorage.setItem("tandem-notified", JSON.stringify([...seen, ...fresh.map((i) => i.key)].slice(-40)));
      } catch {}
    }
  }, [items, perm]);

  async function enable() {
    const r = await Notification.requestPermission();
    setPerm(r);
    if (r === "granted" && "serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js").catch(() => {});
      notify("Tandem", "Les rappels sont activés 👍", "welcome");
    }
  }

  if (items.length === 0 && perm !== "default") return null;

  return (
    <div className="mb-6 space-y-2">
      {items.map((i) => (
        <div
          key={i.key}
          className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm"
          style={{ borderColor: i.tone === "bad" ? "var(--bad)" : i.tone === "warn" ? "var(--warn)" : "var(--line)" }}
        >
          <span>{i.icon}</span>
          <span className="min-w-0 flex-1">{i.text}</span>
        </div>
      ))}
      {perm === "default" && (
        <button onClick={enable} className="w-full rounded-2xl border border-dashed border-line px-4 py-2 text-left text-xs text-muted hover:bg-surface-2">
          🔔 Activer les rappels sur cet appareil
        </button>
      )}
    </div>
  );
}
