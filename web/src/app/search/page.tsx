"use client";

import { SearchBar } from "@/components/search/SearchBar";
import { PageTransition } from "@/components/layout/PageTransition";

export default function SearchPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-bold text-foreground">Search</h1>
        </header>
        <section className="px-4 py-4">
          <SearchBar />
        </section>
      </div>
    </PageTransition>
  );
}
