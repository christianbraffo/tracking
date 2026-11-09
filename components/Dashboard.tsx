"use client";
import confetti from "canvas-confetti";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { computeStats } from "@/lib/stats";
import type { Comment, Idea, Platform, Post, Profile, Reaction } from "@/lib/types";
import Avatar from "./Avatar";
import Counter from "./Counter";
import DuoChallenge from "./DuoChallenge";
import EmojiPicker from "./EmojiPicker";
import IdeaBox from "./IdeaBox";
import PostSocial from "./PostSocial";
import Reminders from "./Reminders";
import StatsPanel from "./StatsPanel";
import Ring from "./Ring";
import ThemeToggle from "./ThemeToggle";
import WeekStrip, { isoDay } from "./WeekStrip";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const PLAT = {
  fb: { label: "Facebook", color: "#1877f2" },
  li: { label: "LinkedIn", color: "#0a66c2" },
} as const;

const PRESET_THEMES = ["💼 Business", "🧠 Conseils", "📖 Histoire perso", "🎬 Coulisses", "📣 Annonce", "💬 Question", "🎉 Succès"];

const hue = (t: string) => {
  let h = 0;
  for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};
const dot = (t: string) => `hsl(${hue(t)} 65% 55%)`;

export default function Dashboard({ userId }: { userId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [view, setView] = useState<"me" | "partner">("me");
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");
  const [text, setText] = useState("");
  const [plats, setPlats] = useState<Platform[]>(["fb", "li"]);
  const [editId, setEditId] = useState<string | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [extraThemes, setExtraThemes] = useState<string[]>([]);
  const [newTheme, setNewTheme] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState("");
  const [duoTarget, setDuoTarget] = useState(5);
  const [showStats, setShowStats] = useState(false);

  const load = useCallback(async () => {
    const [p, q, r, c, i, dz] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("reactions").select("*"),
      supabase.from("comments").select("*").order("created_at", { ascending: true }),
      supabase.from("ideas").select("*").order("created_at", { ascending: false }),
      supabase.from("duo_settings").select("weekly_target").maybeSingle(),
    ]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (q.data) setPosts(q.data as Post[]);
    if (r.data) setReactions(r.data as Reaction[]);
    if (c.data) setComments(c.data as Comment[]);
    if (i.data) setIdeas(i.data as Idea[]);
    if (dz.data?.weekly_target) setDuoTarget(dz.data.weekly_target);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("posts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ideas" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "duo_settings" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const me = profiles.find((p) => p.id === userId);
  const partner = profiles.find((p) => p.id !== userId);
  const myPosts = useMemo(() => posts.filter((p) => p.user_id === userId), [posts, userId]);
  const partnerPosts = useMemo(() => posts.filter((p) => p.user_id === partner?.id), [posts, partner]);
  const myStats = computeStats(myPosts, me?.weekly_goal ?? 3);
  const partnerStats = computeStats(partnerPosts, partner?.weekly_goal ?? 3);
  const together = myStats.week + partnerStats.week;

  const viewPosts = view === "me" ? myPosts : partnerPosts;
  const allThemes = Array.from(new Set([...PRESET_THEMES, ...posts.map((p) => p.theme).filter((t): t is string => !!t), ...extraThemes]));
  const usedThemes = Array.from(new Set(viewPosts.map((p) => p.theme).filter((t): t is string => !!t)));
  const q = search.trim().toLowerCase();
  const shown = viewPosts.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      (themeFilter === "all" || p.theme === themeFilter) &&
      (!q || p.text.toLowerCase().includes(q) || (p.theme ?? "").toLowerCase().includes(q)) &&
      (!dayFilter || p.scheduled_for === dayFilter || (p.posted_at && isoDay(new Date(p.posted_at)) === dayFilter))
  );
  const goalReached = (pr?: Profile, st?: { week: number }) => !!pr && !!st && pr.weekly_goal > 0 && st.week >= pr.weekly_goal;
  const readOnly = view === "partner";
  const stats = view === "me" ? myStats : partnerStats;

  function derive(pl: Platform[], pub: Post["published"]) {
    const kept: Post["published"] = {};
    for (const k of pl) if (pub[k]) kept[k] = pub[k];
    const done = pl.length > 0 && pl.every((k) => kept[k]);
    const last = Object.values(kept).sort().pop() ?? null;
    return { published: kept, status: done ? "done" : "todo", posted_at: done ? last : null };
  }

  async function save(markAllPublished: boolean) {
    const t = text.trim();
    if (!t || !plats.length) return;
    const now = new Date().toISOString();
    const existing = editId ? posts.find((p) => p.id === editId)?.published ?? {} : {};
    const pub: Post["published"] = markAllPublished ? Object.fromEntries(plats.map((k) => [k, existing[k] ?? now])) : existing;
    const row = { text: t, platforms: plats, theme, scheduled_for: scheduled || null, ...derive(plats, pub) };
    if (editId) {
      await supabase.from("posts").update(row).eq("id", editId);
      setEditId(null);
    } else {
      await supabase.from("posts").insert(row);
    }
    if (markAllPublished) celebrate(true);
    setText("");
    setTheme(null);
    setScheduled("");
    load();
  }

  function celebrate(big: boolean) {
    confetti({ particleCount: big ? 110 : 45, spread: big ? 75 : 55, origin: { y: 0.7 }, colors: ["#8fb0e0", "#c9d3e3", "#a67c5b", "#e8c872"] });
  }

  async function togglePlatform(p: Post, k: Platform) {
    const pub = { ...p.published };
    const nowPublishing = !pub[k];
    if (nowPublishing) pub[k] = new Date().toISOString();
    else delete pub[k];
    const d = derive(p.platforms, pub);
    await supabase.from("posts").update(d).eq("id", p.id);
    if (nowPublishing) celebrate(d.status === "done");
    load();
  }

  async function setEmoji(emoji: string) {
    setProfiles((ps) => ps.map((p) => (p.id === userId ? { ...p, emoji } : p)));
    await supabase.from("profiles").update({ emoji }).eq("id", userId);
  }

  async function setGoal(n: number) {
    if (n < 1 || n > 21) return;
    await supabase.from("profiles").update({ weekly_goal: n }).eq("id", userId);
    load();
  }

  async function setDuo(n: number) {
    if (n < 1 || n > 60) return;
    setDuoTarget(n);
    await supabase.from("duo_settings").upsert({ id: 1, weekly_target: n });
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce post ?")) return;
    await supabase.from("posts").delete().eq("id", id);
    load();
  }

  const maxWeek = Math.max(1, ...stats.weeks.map((w) => w.count));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:pt-8" style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom))" }}>
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <EmojiPicker value={me?.emoji ?? "😊"} onPick={setEmoji} />
          <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">Salut {me?.name ?? ""} 👋</h1>
          <p className="text-sm text-muted">
            {together > 0 ? `${together} posts publiés ensemble cette semaine` : "Aucun post publié cette semaine. À vous de jouer !"}
          </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <button onClick={() => supabase.auth.signOut()} aria-label="Déconnexion" className="h-9 rounded-lg border border-line px-3 text-sm text-muted hover:bg-surface-2">
            <span className="hidden sm:inline">Déconnexion</span><span className="sm:hidden">⎋</span>
          </button>
        </div>
      </motion.div>

      {/* duo rings */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { p: me, s: myStats, color: "var(--accent)", label: "Toi" },
          { p: partner, s: partnerStats, color: "var(--accent2)", label: partner?.name ?? "En attente…" },
        ].map((x, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i, type: "spring", stiffness: 140, damping: 16 }}
            className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center backdrop-blur sm:flex-row sm:gap-3 sm:p-4 sm:text-left"
          >
            <Ring value={x.s.week} goal={x.p?.weekly_goal ?? 3} color={x.color} />
            <div className="min-w-0 max-w-full">
              <div className="flex items-center justify-center gap-1.5 truncate font-semibold sm:justify-start"><Avatar value={x.p?.emoji} size={24} fallback="⏳" /> <span className="truncate">{x.label}</span></div>
              <div className="text-sm text-muted">🔥 {x.s.streak} sem. d&apos;affilée</div>
              {i === 0 && (
                <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted sm:justify-start">
                  Objectif
                  <button onClick={() => setGoal((me?.weekly_goal ?? 3) - 1)} className="h-7 w-7 rounded bg-surface-2 hover:bg-surface-2">−</button>
                  <button onClick={() => setGoal((me?.weekly_goal ?? 3) + 1)} className="h-7 w-7 rounded bg-surface-2 hover:bg-surface-2">+</button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(goalReached(me, myStats) || goalReached(partner, partnerStats)) && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-2xl border border-accent bg-surface-2 p-3 text-center text-sm"
          >
            {goalReached(me, myStats) && goalReached(partner, partnerStats)
              ? `🎉 Objectif de la semaine atteint par vous deux. Bravo ${me?.name} et ${partner?.name} !`
              : goalReached(me, myStats)
                ? `🎉 Objectif atteint, bravo ! ${partner ? `Encourage ${partner.name} avec un 👏.` : ""}`
                : `👏 ${partner?.name} a atteint son objectif de la semaine. Envoie-lui un encouragement sur un de ses posts !`}
          </motion.div>
        )}
      </AnimatePresence>

      <Reminders posts={myPosts} week={myStats.week} goal={me?.weekly_goal ?? 3} />

      {partner && <DuoChallenge posts={posts} target={duoTarget} onChange={setDuo} />}

      {!partner && (
        <div className="mb-6 rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
          Ta copine n&apos;a pas encore créé son compte. Envoie-lui le lien du site !
        </div>
      )}

      {/* membres */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl border border-line bg-surface p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">👥 Membres</h2>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
            <Counter value={profiles.length} /> {profiles.length > 1 ? "personnes" : "personne"}
          </span>
        </div>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {[...profiles]
              .map((pr) => ({ pr, st: computeStats(posts.filter((p) => p.user_id === pr.id), pr.weekly_goal) }))
              .sort((a, b) => b.st.done - a.st.done)
              .map(({ pr, st }, i) => (
                <motion.div
                  layout
                  key={pr.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
                  className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface"><Avatar value={pr.emoji} size={40} float={pr.id === userId} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {pr.name || "Sans nom"} {pr.id === userId && <span className="text-xs text-muted">(toi)</span>}
                    </div>
                    <div className="text-xs text-muted">
                      {st.week}/{pr.weekly_goal} cette semaine · 🔥 {st.streak} sem.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold leading-none"><Counter value={st.done} /></div>
                    <div className="text-[10px] text-muted">publiés</div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* view switch */}
      <LayoutGroup id="view">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["me", "partner"] as const).map((v) => (
            <button key={v} onClick={() => { setView(v); setThemeFilter("all"); }} className="relative min-w-0 max-w-full rounded-xl px-4 py-2 text-sm font-medium">
              {view === v && (
                <motion.span layoutId="viewpill" className="absolute inset-0 rounded-xl bg-surface-2" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative">{v === "me" ? "Mes posts" : <span className="inline-flex items-center gap-1.5"><Avatar value={partner?.emoji} size={22} fallback="" />Posts de {partner?.name ?? "…"}</span>}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total", stats.total],
          ["À poster", stats.todo],
          ["Publiés", stats.done],
          ["Ce mois", stats.month],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-line bg-surface p-3 text-center">
            <div className="text-2xl font-bold"><Counter value={v as number} /></div>
            <div className="text-xs text-muted">{l}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowStats((s) => !s)}
        className="mb-3 flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold"
      >
        <span>📊 Statistiques {view === "me" ? "(moi)" : `(${partner?.name ?? "…"})`}</span>
        <motion.span animate={{ rotate: showStats ? 180 : 0 }} className="text-xs text-muted">▾</motion.span>
      </button>
      {showStats && <StatsPanel stats={stats} />}

      {/* 8 weeks chart */}
      <div className="mb-6 rounded-2xl border border-line bg-surface p-4">
        <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted">
          <span>8 dernières semaines</span>
          <span>
            <span style={{ color: PLAT.fb.color }}>● FB {stats.fb}</span> · <span style={{ color: PLAT.li.color }}>● LinkedIn {stats.li}</span>
          </span>
        </div>
        <div className="flex h-20 items-end gap-2">
          {stats.weeks.map((w, i) => (
            <div key={`${view}-${w.start}`} className="flex flex-1 flex-col items-center justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(w.count / maxWeek) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
                className="w-full min-h-[3px] rounded-t-md bg-gradient-to-t from-accent to-accent2"
                title={`${w.count} posts`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* composer */}
      {!readOnly && (
        <motion.div layout className="mb-6 rounded-2xl border border-line bg-surface p-4 backdrop-blur">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écris ton post ici…"
            className="min-h-[110px] w-full resize-y bg-transparent outline-none placeholder:text-muted"
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            <span className="mr-1 text-xs text-muted">Thème</span>
            {allThemes.map((t) => {
              const on = theme === t;
              return (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setTheme(on ? null : t)}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                  style={on ? { borderColor: dot(t), background: `hsl(${hue(t)} 65% 55% / .18)` } : { borderColor: "var(--line)", color: "var(--muted)" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot(t) }} />
                  {t}
                </motion.button>
              );
            })}
            {newTheme === null ? (
              <button onClick={() => setNewTheme("")} className="rounded-full border border-dashed border-line px-2.5 py-0.5 text-xs text-muted hover:bg-surface-2">
                + Nouveau
              </button>
            ) : (
              <input
                autoFocus
                value={newTheme}
                maxLength={30}
                onChange={(e) => setNewTheme(e.target.value)}
                onBlur={() => setNewTheme(null)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setNewTheme(null);
                  if (e.key === "Enter" && newTheme.trim()) {
                    const t = newTheme.trim();
                    setExtraThemes((x) => [...x, t]);
                    setTheme(t);
                    setNewTheme(null);
                  }
                }}
                placeholder="Nom du thème + Entrée"
                className="w-full max-w-full rounded-full border border-line bg-transparent px-3 py-1 text-xs outline-none focus:border-accent sm:w-44"
              />
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-xs text-muted">Prévu le</span>
            <input
              type="date"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              className="rounded-lg border border-line bg-transparent px-2 py-1 text-xs outline-none focus:border-accent"
            />
            {scheduled && (
              <button onClick={() => setScheduled("")} className="text-xs text-muted hover:text-fg">
                ✕ Retirer
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LayoutGroup id="plat">
              <div className="flex w-full flex-wrap rounded-xl border border-line bg-surface p-1 text-sm sm:w-auto">
                {(
                  [
                    ["fb", ["fb"], "Facebook"],
                    ["li", ["li"], "LinkedIn"],
                    ["both", ["fb", "li"], "⚡ Les deux"],
                  ] as [string, Platform[], string][]
                ).map(([key, val, label]) => {
                  const on = plats.length === val.length && val.every((x) => plats.includes(x));
                  return (
                    <button key={key} onClick={() => setPlats(val)} className="relative min-w-0 flex-1 rounded-lg px-3 py-1.5 transition-colors sm:flex-none" style={{ color: on ? "var(--on-accent)" : "var(--muted)" }}>
                      {on && (
                        <motion.span layoutId="platpill" className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent to-accent2" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      )}
                      <span className="relative font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
            <span className={`ml-auto text-xs ${plats.includes("li") && text.length > 3000 ? "text-bad" : "text-muted"}`}>
              {text.length ? `${text.length}${plats.includes("li") ? " / 3000" : ""}` : ""}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {editId && (
              <button onClick={() => { setEditId(null); setText(""); setTheme(null); setScheduled(""); }} className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-surface-2">
                Annuler
              </button>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => save(true)} className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface-2">
              Déjà publié
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => save(false)} className="rounded-xl bg-gradient-to-r from-accent to-accent2 text-on-accent px-5 py-2 text-sm font-semibold">
              {editId ? "Mettre à jour" : "À poster"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {!readOnly && (
        <IdeaBox
          ideas={ideas}
          profiles={profiles}
          userId={userId}
          onChange={load}
          onUse={(t) => {
            setText(t);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <WeekStrip posts={viewPosts} selected={dayFilter} onSelect={setDayFilter} />

      {/* recherche */}
      <div className="relative mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un post ou un thème…"
          className="w-full rounded-xl border border-line bg-surface py-2 pl-4 pr-28 text-sm outline-none focus:border-accent"
        />
        {(search || dayFilter) && (
          <button
            onClick={() => { setSearch(""); setDayFilter(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-fg"
          >
            ✕ Effacer{dayFilter ? " (jour inclus)" : ""}
          </button>
        )}
      </div>

      {/* filter */}
      <div className="mb-3 flex gap-1 overflow-x-auto text-sm">
        {([["all", "Tous"], ["todo", "À poster"], ["done", "Publiés"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-1.5 ${filter === k ? "bg-surface-2 font-semibold" : "text-muted hover:text-fg"}`}>
            {l}
          </button>
        ))}
      </div>

      {usedThemes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5 text-xs">
          {["all", ...usedThemes].map((t) => {
            const on = themeFilter === t;
            const n = t === "all" ? viewPosts.length : viewPosts.filter((p) => p.theme === t).length;
            return (
              <button
                key={t}
                onClick={() => setThemeFilter(t)}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors"
                style={on ? { borderColor: t === "all" ? "var(--accent)" : dot(t), background: t === "all" ? "var(--surface-2)" : `hsl(${hue(t)} 65% 55% / .18)` } : { borderColor: "var(--line)", color: "var(--muted)" }}
              >
                {t !== "all" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot(t) }} />}
                {t === "all" ? "Tous les thèmes" : t} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p) => (
            <motion.div
              layout
              key={p.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="min-w-0 rounded-2xl border border-line bg-surface p-3 sm:p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                {p.platforms.length === 2 ? (
                  <span className="flex overflow-hidden rounded-full text-white">
                    <span className="px-2 py-0.5" style={{ background: PLAT.fb.color }}>⚡ Facebook</span>
                    <span className="px-2 py-0.5" style={{ background: PLAT.li.color }}>LinkedIn</span>
                  </span>
                ) : (
                  p.platforms.map((k) => (
                    <span key={k} className="rounded-full px-2 py-0.5 text-white" style={{ background: PLAT[k].color }}>
                      {PLAT[k].label}
                    </span>
                  ))
                )}
                {(() => {
                  const n = p.platforms.filter((k) => p.published?.[k]).length;
                  if (p.status === "done") return <span className="font-semibold text-ok">✓ Publié {fmt(p.posted_at ?? p.created_at)}</span>;
                  if (n > 0) return <span className="font-semibold text-warn">◐ {n}/{p.platforms.length} publié · reste {p.platforms.filter((k) => !p.published?.[k]).map((k) => PLAT[k].label).join(", ")}</span>;
                  return <span className="font-semibold text-warn">À poster</span>;
                })()}
                {p.theme && (
                  <span className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-fg" style={{ borderColor: dot(p.theme), background: `hsl(${hue(p.theme)} 65% 55% / .15)` }}>
                    {p.theme}
                  </span>
                )}
                {p.scheduled_for && p.status !== "done" && (
                  <span className={p.scheduled_for < isoDay(new Date()) ? "font-semibold text-bad" : "font-semibold text-fg"}>
                    📅 {p.scheduled_for < isoDay(new Date()) ? "en retard · " : ""}
                    {new Date(p.scheduled_for + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                )}
                <span>· créé {fmt(p.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{p.text}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm [&>button]:py-1.5">
                {!readOnly &&
                  p.platforms.map((k) => {
                    const on = !!p.published?.[k];
                    return (
                      <motion.button
                        key={k}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => togglePlatform(p, k)}
                        className="rounded-lg px-3 py-1 transition-colors"
                        style={on ? { background: "var(--ok)", color: "#fff" } : { border: "1px solid var(--line)" }}
                      >
                        {on ? `✓ ${PLAT[k].label}` : `Marquer publié sur ${PLAT[k].label}`}
                      </motion.button>
                    );
                  })}
                <button onClick={() => navigator.clipboard.writeText(p.text)} className="rounded-lg border border-line px-3 py-1 hover:bg-surface-2">
                  Copier
                </button>
                {!readOnly && (
                  <>
                    <button
                      onClick={() => { setEditId(p.id); setText(p.text); setPlats(p.platforms); setTheme(p.theme); setScheduled(p.scheduled_for ?? ""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="rounded-lg border border-line px-3 py-1 hover:bg-surface-2"
                    >
                      Modifier
                    </button>
                    <button onClick={() => remove(p.id)} className="rounded-lg border border-line px-3 py-1 text-bad hover:bg-surface-2">
                      Supprimer
                    </button>
                  </>
                )}
              </div>
              <PostSocial
                postId={p.id}
                reactions={reactions.filter((r) => r.post_id === p.id)}
                comments={comments.filter((c) => c.post_id === p.id)}
                profiles={profiles}
                userId={userId}
                onChange={load}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {shown.length === 0 && <div className="py-10 text-center text-muted">Rien ici pour l&apos;instant.</div>}
      </div>
    </div>
  );
}
