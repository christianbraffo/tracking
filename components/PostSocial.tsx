"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Comment, Profile, Reaction } from "@/lib/types";
import Avatar from "./Avatar";

const QUICK = ["👏", "🔥", "❤️", "💡", "🎉"];

export default function PostSocial({
  postId,
  reactions,
  comments,
  profiles,
  userId,
  onChange,
}: {
  postId: string;
  reactions: Reaction[];
  comments: Comment[];
  profiles: Profile[];
  userId: string;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const name = (id: string) => profiles.find((p) => p.id === id)?.name || "Quelqu'un";

  async function toggle(emoji: string) {
    const mine = reactions.find((r) => r.user_id === userId && r.emoji === emoji);
    if (mine) await supabase.from("reactions").delete().eq("id", mine.id);
    else await supabase.from("reactions").insert({ post_id: postId, emoji });
    onChange();
  }

  async function send() {
    const t = txt.trim();
    if (!t) return;
    setTxt("");
    await supabase.from("comments").insert({ post_id: postId, text: t });
    onChange();
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK.map((e) => {
          const list = reactions.filter((r) => r.emoji === e);
          const mine = list.some((r) => r.user_id === userId);
          return (
            <motion.button
              key={e}
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => toggle(e)}
              title={list.map((r) => name(r.user_id)).join(", ") || "Réagir"}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm"
              style={mine ? { borderColor: "var(--accent)", background: "var(--surface-2)" } : { borderColor: "var(--line)", opacity: list.length ? 1 : 0.55 }}
            >
              {e}
              {list.length > 0 && <span className="text-xs">{list.length}</span>}
            </motion.button>
          );
        })}
        <button onClick={() => setOpen((o) => !o)} className="ml-auto rounded-full px-2.5 py-0.5 text-xs text-muted hover:bg-surface-2">
          💬 {comments.length > 0 ? comments.length : "Commenter"}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <Avatar value={profiles.find((p) => p.id === c.user_id)?.emoji} size={24} />
                  <div className="min-w-0 flex-1 rounded-xl bg-surface-2 px-3 py-1.5">
                    <span className="mr-1.5 text-xs font-semibold">{name(c.user_id)}</span>
                    <span className="whitespace-pre-wrap break-words">{c.text}</span>
                  </div>
                  {c.user_id === userId && (
                    <button
                      onClick={async () => {
                        await supabase.from("comments").delete().eq("id", c.id);
                        onChange();
                      }}
                      className="text-xs text-muted hover:text-bad"
                      aria-label="Supprimer le commentaire"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={txt}
                  onChange={(e) => setTxt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Un petit mot…"
                  maxLength={300}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-transparent px-3 py-1.5 text-sm outline-none focus:border-accent"
                />
                <button onClick={send} className="rounded-xl bg-gradient-to-r from-accent to-accent2 px-3 text-sm font-semibold text-on-accent">
                  Envoyer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
