export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ON_DEMAND";
export type DeliveryType = "DELIVERY" | "PICKUP";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED";

export interface Product {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  stockStatus: StockStatus;
  categoryId: string;
  brand?: string;
  images: string[];
  thumbnail: string;
  available: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  imageUrl?: string;
  productCount: number;
  displayOrder: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Marina {
  id: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface MarinaWithDistance extends Marina {
  distance?: number; // km
  eta?: string; // e.g. "12 min"
}

export type SuggestionType = "product" | "marina" | "category";

export interface Suggestion {
  id: string;
  type: SuggestionType;
  label: string;
  subtitle?: string;
  icon?: string;
  distance?: number;
  data: Product | Marina | Category;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productName: string;
  productThumbnail: string;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  status: string;
  message?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  marinaId?: string;
  marinaName?: string;
  marinaCity?: string;
  berthNumber?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedTime?: string;
  createdAt: string;
  events?: OrderEvent[];
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  icon: string;
  products: Product[];
  totalPrice: number;
}

// Chat
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  marinas?: Marina[];
  timestamp: number;
}

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  limit?: number;
  previousProducts?: string[];
}

export interface ChatResponse {
  message: string;
  products: Product[];
  marinas: Marina[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
