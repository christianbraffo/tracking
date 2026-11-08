"use client";
import { motion } from "framer-motion";
import { avatarUrl } from "@/lib/avatars";

export default function Avatar({
  value,
  size = 28,
  fallback = "😊",
  float = false,
}: {
  value?: string | null;
  size?: number;
  fallback?: string;
  float?: boolean;
}) {
  const url = avatarUrl(value);
  if (!url) {
    return (
      <span style={{ fontSize: size * 0.8, lineHeight: 1 }} className="inline-block">
        {value && !/^[a-z-]+$/.test(value) ? value : fallback}
      </span>
    );
  }
  return (
    <motion.span
      className="inline-block"
      animate={float ? { y: [0, -3, 0], rotate: [0, 2, 0, -2, 0] } : undefined}
      transition={float ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" width={size} height={size} loading="lazy" draggable={false} style={{ width: size, height: size }} />
    </motion.span>
  );
}
