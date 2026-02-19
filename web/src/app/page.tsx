/**
 * Home Page — Discovery-first pattern (modeled after Uber Eats mobile).
 *
 * KEY DESIGN DECISIONS:
 * - This is NOT a duplicate of /browse. Home is a curated discovery surface;
 *   /browse owns the full product grid + category filtering.
 * - Uber Eats pattern: Hero → Search → Category icons → Curated rows → CTA.
 *   Users land here and are funneled into browse/search via clear CTAs.
 * - The search bar is a fake input (button) that navigates to /search on tap.
 *   This avoids mounting the heavy SearchBar + autosuggest machinery on the
 *   home page, keeping initial bundle size and render cost low.
 * - Trending and Offers are horizontal scroll rows (not grids) because
 *   horizontal scrolling signals "there's more" and encourages exploration
 *   without overwhelming the viewport on mobile.
 * - motion.div fade-in on the page wrapper prevents a flash of unstyled content
 *   during client hydration. Section elements stagger for perceived smoothness.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategoryGrid } from "@/components/category/CategoryGrid";
import { ProductRow } from "@/components/product/ProductRow";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTrendingProducts, useOffers } from "@/lib/hooks/useData";
import { Search, TrendingUp, BadgePercent, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const { data: trending, isLoading: trendingLoading } = useTrendingProducts();
  const { data: offers, isLoading: offersLoading } = useOffers();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-background"
    >
      {/* Hero — intentionally compact (~auto height, not 55vh like before).
          Uber Eats keeps the hero small so users reach content quickly without
          scrolling. The gradient overlay ensures text readability on any hero image.
          quality={75} enables Next.js image optimization (was 'unoptimized' before). */}
      <section className="relative overflow-hidden">
        <Image
          src="/brand/hero-bg.png"
          alt="YachtDrop hero"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(10,37,64,0.5)] via-[rgba(10,37,64,0.6)] to-[rgba(10,37,64,0.9)]" />
        <div className="relative z-10 px-4 pt-12 pb-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Image src="/brand/logo.png" alt="YachtDrop" width={32} height={32} className="drop-shadow-lg" />
              <span className="text-lg font-bold text-white">YachtDrop</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="text-xl font-bold text-white leading-tight">
            Boat parts, delivered
            <br />
            <span className="text-[var(--color-ocean)]">to your berth</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="mt-1 text-sm text-white/60">
            Order marine supplies as easily as ordering food.
          </motion.p>

          {/* Search bar — fake input (button), navigates to /search.
              This avoids mounting SearchBar + React Query autosuggest on home.
              Glassmorphism style (bg-white/10 + backdrop-blur) ties it to the hero. */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            onClick={() => router.push("/search")}
            className="mt-4 flex w-full items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-left active:scale-[0.98] transition-transform"
          >
            <Search className="h-4 w-4 text-white/50" />
            <span className="text-sm text-white/50">Search parts, marinas...</span>
          </motion.button>
        </div>
      </section>

      {/* Category quick-links — Uber Eats uses circular icons here, not tabs.
          Tapping a category deep-links to /browse?category=ID so the browse page
          opens pre-filtered. This keeps home as a discovery surface, not a store. */}
      <section className="py-4">
        <div className="flex items-baseline justify-between px-4 mb-2">
          <h2 className="text-base font-bold text-foreground">Categories</h2>
          <Link
            href="/browse"
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground active:text-foreground transition-colors"
          >
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* Curated sections — horizontal scroll rows.
          Trending = recently scraped in-stock products (proxy for popularity).
          Offers = sorted by discount_percent DESC.
          Both use 5min staleTime since scraper runs are hours apart. */}
      <div className="space-y-5 pb-6">
        <ProductRow
          icon={<TrendingUp className="h-4 w-4 text-[var(--color-ocean)]" />}
          title="Trending Now"
          products={trending}
          isLoading={trendingLoading}
        />
        <ProductRow
          icon={<BadgePercent className="h-4 w-4 text-red-500" />}
          title="Best Offers"
          products={offers}
          isLoading={offersLoading}
          badge={(p) =>
            p.discountPercent && p.discountPercent > 0
              ? `-${p.discountPercent}%`
              : null
          }
        />
      </div>

      {/* Browse all CTA — clear escape hatch to the full catalog.
          Rounded card style matches Uber Eats "See all restaurants" pattern. */}
      <section className="px-4 pb-8">
        <Link
          href="/browse"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-semibold text-foreground active:bg-muted transition-colors"
        >
          Browse all products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </motion.div>
  );
}
