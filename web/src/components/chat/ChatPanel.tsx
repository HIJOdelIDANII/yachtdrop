"use client";

import { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useChat } from "@/lib/hooks/useChat";
import { ChatMessage } from "./ChatMessage";

const SUGGESTIONS = [
  "What do I need for anchoring?",
  "Safety gear for a weekend trip",
  "Cheap cleaning supplies",
  "Engine maintenance essentials",
];

export function ChatPanel() {
  const isOpen = useChatStore((s) => s.isOpen);
  const close = useChatStore((s) => s.close);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-16 right-0 left-0 sm:left-auto sm:right-4 z-50 flex h-[70vh] max-h-[600px] sm:w-[380px] flex-col overflow-hidden sm:rounded-2xl rounded-t-2xl border border-border bg-background shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-ocean)]/15">
                <Sparkles className="h-4 w-4 text-[var(--color-ocean)]" />
              </div>
              <span className="text-sm font-semibold">YachtDrop AI</span>
              <span className="rounded-full bg-[var(--color-ocean)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-ocean)]">
                Phi-4
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="min-h-[44px] rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted active:bg-muted/80"
                >
                  Clear
                </button>
              )}
              <button
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:bg-muted/80"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-ocean)]/15">
                  <Sparkles className="h-6 w-6 text-[var(--color-ocean)]" />
                </div>
                <div>
                  <p className="text-sm font-medium">How can I help?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ask about marine supplies, gear, or anything for your yacht.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 px-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted active:scale-95"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--color-ocean)]" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border px-3 py-2.5 safe-bottom">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about marine supplies..."
                className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--color-ocean)] focus:ring-1 focus:ring-[var(--color-ocean)]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-ocean)] text-white transition-all disabled:opacity-40 active:scale-95"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
