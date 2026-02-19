/**
 * Product detail page — deep-linkable, SEO-friendly product view.
 *
 * Server-fetches product data for metadata (OG tags, title) then renders
 * a client component with the same Uber Eats-style layout as ProductSheet
 * but as a full page with back navigation.
 */
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetail } from "./ProductDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | YachtDrop`,
    description: product.shortDesc || product.description || `Buy ${product.name} on YachtDrop`,
    openGraph: {
      title: product.name,
      description: product.shortDesc || product.description || undefined,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) notFound();

  const serialized = {
    id: product.id,
    externalId: product.externalId ?? "",
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    shortDesc: product.shortDesc ?? "",
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    discountPercent: product.discountPercent ?? undefined,
    currency: product.currency,
    stockStatus: product.stockStatus as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ON_DEMAND",
    categoryId: product.categoryId ?? "",
    images: product.images,
    thumbnail: product.thumbnail ?? "",
    available: product.available,
    categoryName: product.category?.name,
  };

  return <ProductDetail product={serialized} />;
}
