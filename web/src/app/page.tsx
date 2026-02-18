"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CategoryTabs } from "@/components/category/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageTransition } from "@/components/layout/PageTransition";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden">
          {/* Background image */}
          <Image
            src="/brand/hero-bg.png"
            alt="YachtDrop hero"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={100}
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(10,37,64,0.55)] via-[rgba(10,37,64,0.6)] to-[rgba(10,37,64,0.85)]" />
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Image
                src="/brand/logo.png"
                alt="YachtDrop"
                width={72}
                height={72}
                className="drop-shadow-lg"
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              Boat parts, delivered
              <br />
              <span className="text-[var(--color-ocean)]">to your berth</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              className="max-w-xs text-sm text-white/80"
            >
              Browse thousands of marine parts. Fast delivery to your marina.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            >
              <Link href="/browse">
                <Button
                  size="lg"
                  className="rounded-full bg-[var(--color-ocean)] px-8 text-white shadow-lg hover:bg-[var(--color-ocean)]/90"
                >
                  Start Browsing
                </Button>
              </Link>
            </motion.div>
            {/* Scroll hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 6, 0] }}
              transition={{
                opacity: { delay: 0.6 },
                y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
              }}
              className="mt-4"
            >
              <ChevronDown className="h-5 w-5 text-white/50" />
            </motion.div>
          </div>
        </section>

        {/* Category + Product grid */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur dark:bg-card/90">
          <div className="flex items-center gap-2 px-4 py-3">
            <Image
              src="/brand/logo.png"
              alt="YachtDrop"
              width={24}
              height={24}
            />
            <h2 className="text-lg font-bold text-foreground">
              YachtDrop
            </h2>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
          <CategoryTabs
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </header>

        <section className="px-4 py-4">
          <ProductGrid categoryId={selectedCategory} />
        </section>
      </div>
    </PageTransition>
  );
}
