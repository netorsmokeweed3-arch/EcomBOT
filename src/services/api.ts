import { Order } from '../types/order';

// Для Android emulator використовуємо 10.0.2.2 або твою локальну IP
const API_BASE_URL = 'http://192.168.1.114:5000';

export class ApiService {
  static async getOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      const data = await response.json();
      
      if (data.success && data.orders) {
        return data.orders;
      }
      return [];
    } catch (error) {
      console.error('Помилка при завантаженні замовлень з бекенду:', error);
      return [];
    }
  }
}