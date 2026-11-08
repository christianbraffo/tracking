"use client";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import Auth from "@/components/Auth";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  return session ? <Dashboard userId={session.user.id} /> : <Auth />;
}
