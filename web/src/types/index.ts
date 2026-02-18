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
  images: string[];
  thumbnail: string;
  available: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
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
