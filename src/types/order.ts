export interface OrderItem {
  id?: string;
  title?: string;
  sku?: string;
  quantity?: number;
  unit_price?: { amount: number; currency: string; formatted: string };
  line_total?: { amount: number; currency: string; formatted: string };
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  delivery_method?: string;
  delivery_address?: {
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    full?: string;
  };
  totalAmount?: { amount: number; currency: string; formatted: string };
  total_amount?: { amount: number; currency: string; formatted: string };
  currency?: string;
  status?: { text: string; cancelled: boolean };
  items?: OrderItem[];
  chatHistory?: string;
  chat_history?: string;
  
  // Нові поля для трекінгу пошти
  trackingNumber?: string;
  carrier?: string;
  timelineEvents?: string[];
}