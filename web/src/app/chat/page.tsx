"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Trash2, ShoppingCart } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useChat } from "@/lib/hooks/useChat";
import { ChatMessage } from "@/components/chat/ChatMessage";

const SUGGESTIONS = [
  "What do I need for anchoring?",
  "Safety gear for a weekend trip",
  "Cheap cleaning supplies",
  "Engine maintenance essentials",
  "Best products by 3M",
  "Help me prepare for winter",
];

export default function ChatPage() {
  const hydrated = useHydrated();
  const clearMessages = useChatStore((s) => s.clearMessages);
  const cartItemCount = useCartStore((s) => s.itemCount());
  const openSheet = useUIStore((s) => s.openSheet);
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateHeight = useCallback(() => {
    const vv = window.visualViewport;
    if (!containerRef.current || !vv) return;
    const keyboardOffset = window.innerHeight - vv.height - vv.offsetTop;
    const keyboardOpen = keyboardOffset > 50;
    const navHeight = keyboardOpen ? 0 : 52;
    containerRef.current.style.top = `${vv.offsetTop}px`;
    containerRef.current.style.bottom = keyboardOpen ? `${keyboardOffset}px` : `${navHeight}px`;
    containerRef.current.style.height = "auto";
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    updateHeight();
    vv.addEventListener("resize", updateHeight);
    vv.addEventListener("scroll", updateHeight);
    return () => {
      vv.removeEventListener("resize", updateHeight);
      vv.removeEventListener("scroll", updateHeight);
    };
  }, [updateHeight]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-0 bottom-[52px] flex flex-col overflow-hidden bg-background transition-[height,transform] duration-150 ease-out"
    >
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {hydrated && cartItemCount > 0 && (
            <button
              onClick={() => openSheet("cart")}
              className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-ocean)]/15 transition-colors active:bg-[var(--color-ocean)]/25"
              aria-label="View cart"
            >
              <ShoppingCart className="h-4 w-4 text-[var(--color-ocean)]" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-ocean)] px-1 text-[9px] font-bold text-white">
                {cartItemCount}
              </span>
            </button>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-ocean)]/15">
            <Sparkles className="h-4.5 w-4.5 text-[var(--color-ocean)]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">YachtDrop AI</h1>
            <p className="text-[11px] text-muted-foreground">
              Your marine supplies assistant
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </header>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-ocean)]/10"
            >
              <Sparkles className="h-8 w-8 text-[var(--color-ocean)]" />
            </motion.div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                How can I help?
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                Ask me about marine supplies, gear recommendations, or maintenance tips.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-[340px]">
              {SUGGESTIONS.map((s) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSuggestion(s)}
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            <AnimatePresence>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--color-ocean)]" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input area — sticky bottom */}
      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-background px-3 py-1.5">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about marine supplies..."
              rows={1}
              className="w-full resize-none overflow-y-auto rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--color-ocean)] focus:ring-1 focus:ring-[var(--color-ocean)] disabled:opacity-50"
              disabled={isLoading}
              style={{ maxHeight: "120px" }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-ocean)] text-white shadow-sm transition-all disabled:opacity-40 mb-0.5"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
