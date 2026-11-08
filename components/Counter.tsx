"use client";
import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const c = animate(prev.current, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    prev.current = value;
    return () => c.stop();
  }, [value]);
  return <>{n}</>;
}
