import { useCallback } from "react";
import { useChatStore } from "@/store/chat.store";
import type { ChatMessage, ChatResponse, Product } from "@/types";

function getRecentProducts(messages: ChatMessage[]): string[] {
  const names: string[] = [];
  for (let i = messages.length - 1; i >= 0 && names.length < 12; i--) {
    const m = messages[i];
    if (m.products) {
      for (const p of m.products as Product[]) {
        if (!names.includes(p.name)) names.push(p.name);
      }
    }
  }
  return names;
}

export function useChat() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      addMessage(userMsg);
      setLoading(true);

      const recentProducts = getRecentProducts(messages);

      try {
        const historyForApi = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: trimmed },
        ];

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForApi,
            limit: 12,
            previousProducts: recentProducts,
          }),
        });

        if (!res.ok) throw new Error("Chat request failed");

        const data: ChatResponse = await res.json();

        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          role: "assistant",
          content: data.message,
          products: data.products,
          marinas: data.marinas,
          timestamp: Date.now(),
        };
        addMessage(assistantMsg);
      } catch {
        const errorMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          role: "assistant",
          content: "Sorry, something went wrong. Try again!",
          timestamp: Date.now(),
        };
        addMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [messages, isLoading, addMessage, setLoading]
  );

  return { messages, isLoading, sendMessage };
}
