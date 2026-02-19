import type { Product, Marina, Category } from "@/types";

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    externalId: "ext-1",
    name: "LED Navigation Light",
    slug: "led-navigation-light",
    description: "High-visibility LED nav light for marine use",
    shortDesc: "LED nav light",
    price: 49.99,
    originalPrice: 69.99,
    discountPercent: 29,
    currency: "EUR",
    stockStatus: "IN_STOCK",
    categoryId: "cat-1",
    images: ["https://example.com/led-light.jpg"],
    thumbnail: "https://example.com/led-light-thumb.jpg",
    available: true,
  },
  {
    id: "prod-2",
    externalId: "ext-2",
    name: "Marine Anchor 10kg",
    slug: "marine-anchor-10kg",
    description: "Heavy-duty galvanized anchor",
    shortDesc: "10kg anchor",
    price: 89.0,
    currency: "EUR",
    stockStatus: "IN_STOCK",
    categoryId: "cat-2",
    images: ["https://example.com/anchor.jpg"],
    thumbnail: "https://example.com/anchor-thumb.jpg",
    available: true,
  },
  {
    id: "prod-3",
    externalId: "ext-3",
    name: "Nylon Dock Rope 15m",
    slug: "nylon-dock-rope-15m",
    description: "UV-resistant dock line",
    shortDesc: "15m dock rope",
    price: 24.5,
    currency: "EUR",
    stockStatus: "LOW_STOCK",
    categoryId: "cat-3",
    images: [],
    thumbnail: "https://example.com/rope-thumb.jpg",
    available: true,
  },
];

export const mockMarinas: Marina[] = [
  {
    id: "marina-1",
    name: "Port Adriano",
    city: "Calvià",
    country: "ES",
    lat: 39.4833,
    lng: 2.4667,
  },
  {
    id: "marina-2",
    name: "Marina di Portisco",
    city: "Olbia",
    country: "IT",
    lat: 41.0167,
    lng: 9.5,
  },
  {
    id: "marina-3",
    name: "Puerto Banús",
    city: "Marbella",
    country: "ES",
    lat: 36.4833,
    lng: -4.95,
  },
];

export const mockCategories: Category[] = [
  {
    id: "cat-1",
    slug: "lighting",
    name: "Lighting",
    productCount: 45,
    displayOrder: 1,
  },
  {
    id: "cat-2",
    slug: "anchoring",
    name: "Anchoring",
    productCount: 23,
    displayOrder: 2,
  },
  {
    id: "cat-3",
    slug: "ropes-lines",
    name: "Ropes & Lines",
    productCount: 31,
    displayOrder: 3,
  },
];

export const emptyCombinedResponse = { products: [], marinas: [] };

export const combinedResponse = {
  products: mockProducts,
  marinas: mockMarinas,
};
