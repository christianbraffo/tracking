"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Idea, Profile } from "@/lib/types";
import Avatar from "./Avatar";

export default function IdeaBox({
  ideas,
  profiles,
  userId,
  onUse,
  onChange,
}: {
  ideas: Idea[];
  profiles: Profile[];
  userId: string;
  onUse: (text: string) => void;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");

  async function add() {
    const t = txt.trim();
    if (!t) return;
    setTxt("");
    await supabase.from("ideas").insert({ text: t });
    onChange();
  }
  async function del(id: string) {
    await supabase.from("ideas").delete().eq("id", id);
    onChange();
  }

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between font-semibold">
        <span>💡 Boîte à idées</span>
        <span className="flex items-center gap-2 text-xs font-normal text-muted">
          {ideas.length} idée{ideas.length > 1 ? "s" : ""}
          <motion.span animate={{ rotate: open ? 180 : 0 }}>▾</motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 flex gap-2">
              <input
                value={txt}
                onChange={(e) => setTxt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Une idée en une ligne…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button onClick={add} className="rounded-xl bg-gradient-to-r from-accent to-accent2 px-4 text-sm font-semibold text-on-accent">
                Noter
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {ideas.map((i) => {
                  const mine = i.user_id === userId;
                  return (
                    <motion.div
                      layout
                      key={i.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm"
                    >
                      <Avatar value={profiles.find((p) => p.id === i.user_id)?.emoji} size={22} />
                      <span className="min-w-0 flex-1 break-words">{i.text}</span>
                      {mine && (
                        <>
                          <button
                            onClick={() => {
                              onUse(i.text);
                              del(i.id);
                            }}
                            className="whitespace-nowrap rounded-lg border border-line px-2 py-0.5 text-xs hover:bg-surface"
                          >
                            → Brouillon
                          </button>
                          <button onClick={() => del(i.id)} className="text-xs text-muted hover:text-bad" aria-label="Supprimer l'idée">
                            ✕
                          </button>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {ideas.length === 0 && <p className="py-2 text-center text-sm text-muted">Aucune idée pour l&apos;instant.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
