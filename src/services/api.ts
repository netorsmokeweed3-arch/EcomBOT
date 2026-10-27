import { Order } from '../types/order';

// Хмарна адреса твого бекенду на Render
const API_BASE_URL = 'https://ecombot-2.onrender.com';

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