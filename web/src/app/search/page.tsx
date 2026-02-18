"use client";

import { SearchBar } from "@/components/search/SearchBar";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border-brand)] bg-white/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-[var(--color-navy)]">Search</h1>
      </header>
      <section className="px-4 py-4">
        <SearchBar />
      </section>
    </div>
  );
}
