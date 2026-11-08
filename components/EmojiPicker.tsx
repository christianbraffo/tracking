"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AVATARS } from "@/lib/avatars";
import Avatar from "./Avatar";

export default function EmojiPicker({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.08, rotate: -4 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Changer mon avatar"
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface"
      >
        <Avatar value={value} size={44} float />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="absolute left-0 top-16 z-20 w-[19rem] rounded-2xl border border-line bg-[var(--bg)] p-3 shadow-2xl"
            >
              <p className="mb-2 text-xs text-muted">Choisis ton avatar</p>
              <div className="grid max-h-72 grid-cols-5 gap-1.5 overflow-y-auto pr-1">
                {AVATARS.map((a) => (
                  <motion.button
                    key={a.id}
                    whileHover={{ scale: 1.15, rotate: 3 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => {
                      onPick(a.id);
                      setOpen(false);
                    }}
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${a.id === value ? "bg-surface-2 ring-2 ring-accent" : "hover:bg-surface"}`}
                  >
                    <Avatar value={a.id} size={44} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
