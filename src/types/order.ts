export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  priceFormatted?: string;
  lineTotal?: number;
  lineTotalFormatted?: string;
  sku?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  region?: string;
  postalCode?: string;
  country?: string;
  deliveryAddress: string;
  deliveryMethod?: string;
  email?: string;
  status: string;
  totalAmount: number;
  totalAmountFormatted?: string;
  currency?: string;
  createdAt: string;
  items: OrderItem[];
  aiSummary?: string;
  chatHistory?: string;
  // Магазин, з якого отримано замовлення (додається клієнтом при завантаженні)
  shopId?: string;
  shopName?: string;
}