export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  postOffice: string;
  status: 'new' | 'processing' | 'shipped' | 'completed';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  chatHistory?: string;
  // Магазин, з якого отримано замовлення (додається клієнтом при завантаженні)
  shopId?: string;
  shopName?: string;

}