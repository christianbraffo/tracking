"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "./ThemeToggle";

export default function Auth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);
    const clean = id.trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,30}$/.test(clean)) {
      setErr("Identifiant : 3 à 30 caractères (lettres, chiffres, _ . -), sans espace.");
      setBusy(false);
      return;
    }
    const email = `${clean}@postsync.app`;
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) setErr(error.message);
      else if (!data.session) setInfo("Compte créé. Désactive \"Confirm email\" dans Supabase puis connecte-toi.");
    }
    setBusy(false);
  }

  const input =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none transition focus:border-accent focus:bg-surface-2";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ThemeToggle className="fixed right-4 top-4" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="w-full max-w-sm space-y-3 rounded-3xl border border-line bg-surface p-7 backdrop-blur-xl"
      >
        <div className="mb-2 text-center">
          <div className="text-4xl">🔗</div>
          <h1 className="mt-2 text-2xl font-bold">Tandem</h1>
          <p className="text-sm text-muted">Écrivez, publiez, avancez ensemble.</p>
        </div>
        {mode === "up" && (
          <input className={input} placeholder="Ton prénom" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className={input} placeholder="Identifiant (ex: chris)" autoCapitalize="none" autoCorrect="off" value={id} onChange={(e) => setId(e.target.value)} required />
        <input className={input} type="password" placeholder="Mot de passe (6+ caractères)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-sm text-bad">{err}</p>}
        {info && <p className="text-sm text-ok">{info}</p>}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-accent to-accent2 text-on-accent py-3 font-semibold disabled:opacity-60"
        >
          {mode === "in" ? "Se connecter" : "Créer mon compte"}
        </motion.button>
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="w-full text-center text-sm text-muted hover:text-fg"
        >
          {mode === "in" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </motion.form>
    </div>
  );
}
