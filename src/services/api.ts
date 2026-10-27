import { Order } from '../types/order';

// Хмарна адреса твого бекенду на Render
const API_BASE_URL = 'https://ecombot-2.onrender.com';

export class ApiService {
  // Метод для отримання замовлень з бекенду
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

  // Метод для надсилання замовлень та чату на ШІ через твій сервер
  static async processWithAI(orderData: any, chatMessages: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/process-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_data: orderData,
          chat_messages: chatMessages,
        }),
      });

      const data = await response.json();
      if (data.success) {
        return data.ai_report;
      }
      return "Помилка обробки від сервера.";
    } catch (error) {
      console.error("Помилка зв'язку з ШІ на бекенді:", error);
      return "Помилка мережі при зверненні до ШІ.";
    }
  }
}