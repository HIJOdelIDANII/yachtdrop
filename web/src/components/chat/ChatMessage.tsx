"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { AIProductCard } from "@/components/product/AIProductCard";
import type { ChatMessage as ChatMessageType, Product, Marina } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? "bg-[var(--color-ocean)] text-white"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {!isUser && message.products && message.products.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {(message.products as Product[]).slice(0, 6).map((product) => (
              <AIProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isUser && message.marinas && message.marinas.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {(message.marinas as Marina[]).map((marina) => (
              <div
                key={marina.id}
                className="flex items-center gap-2 rounded-lg bg-background/60 px-2.5 py-2"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{marina.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[marina.city, marina.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
