"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useChatStore } from "@/store/chat.store";

export function ChatBubble() {
  const toggle = useChatStore((s) => s.toggle);
  const isOpen = useChatStore((s) => s.isOpen);

  if (isOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={toggle}
      className="fixed bottom-20 right-4 z-35 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-ocean)] text-white shadow-[0_4px_16px_rgba(0,180,216,0.4)] active:bg-[var(--color-ocean)]/90"
      aria-label="Open AI chat"
    >
      <Sparkles className="h-6 w-6" />
    </motion.button>
  );
}
