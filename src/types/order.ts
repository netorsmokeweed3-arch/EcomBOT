export interface OrderItem {
  id?: string;
  title?: string;
  name?: string;
  sku?: string;
  quantity?: number;
  price?: number | { amount: number; currency: string; formatted: string };
  priceFormatted?: string;
  lineTotal?: number;
  line_total?: number | { amount: number; currency: string; formatted: string };
  lineTotalFormatted?: string;
  unit_price?: { amount: number; currency: string; formatted: string };
}

export interface Order {
  id: string;
  orderNumber?: string;
  order_number?: string;
  shopId?: string;
  shopName?: string;
  shop_name?: string;
  customerName?: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  createdAt?: string;
  delivery_method?: string;
  deliveryMethod?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  postal_code?: string;
  country?: string;
  deliveryAddress?: string | any;
  totalAmount?: number | { amount: number; currency: string; formatted: string };
  total_amount?: number | { amount: number; currency: string; formatted: string };
  totalAmountFormatted?: string;
  totalFormatted?: string;
  currency?: string;
  status?: { text: string; cancelled: boolean } | string;
  items?: OrderItem[];
  chatHistory?: string | any[];
  aiSummary?: string;
  
  // Поштові поля трекінгу
  trackingNumber?: string;
  carrier?: string;
  timelineEvents?: string[];
}