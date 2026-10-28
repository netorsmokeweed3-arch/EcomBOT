import { createMMKV } from 'react-native-mmkv';
import { Order } from '../types/order';
import { AIReport } from '../types/aiReport';
import { ShopIntegration } from '../types/shop';

// Адреса бекенду на Render
const API_BASE_URL = 'https://ecombot-2.onrender.com';
const REQUEST_TIMEOUT_MS = 30000; // Render може «прокидатися» довго, тому тайм-аут з запасом
const SHOPS_STORAGE_KEY = 'saved_shops';

const storage = createMMKV();

export type ApiErrorKind = 'network' | 'timeout' | 'server' | 'parse' | 'config';

export class ApiError extends Error {
  kind: ApiErrorKind;

  constructor(message: string, kind: ApiErrorKind) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
  }
}

interface OrdersResponse {
  success: boolean;
  orders?: Order[];
  error?: string;
}

interface AIResponse {
  success: boolean;
  ai_report?: AIReport;
  error?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  shopToken?: string;
}

// Універсальний запит з тайм-аутом і перетворенням помилок у ApiError
async function request<T extends { success: boolean; error?: string }>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.shopToken) {
    headers.Authorization = `Bearer ${options.shopToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    let data: T;
    try {
      data = (await response.json()) as T;
    } catch {
      throw new ApiError('Сервер повернув некоректну відповідь.', 'parse');
    }

    if (!response.ok || !data.success) {
      throw new ApiError(data.error ?? `Помилка сервера (код ${response.status}).`, 'server');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Сервер не відповів вчасно. Спробуйте ще раз.', 'timeout');
    }
    throw new ApiError('Немає зв’язку з сервером. Перевірте інтернет.', 'network');
  } finally {
    clearTimeout(timer);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Сталася неочікувана помилка.';
}

export class ApiService {
  // Підключені магазини з MMKV (назва + API-токен)
  static getSavedShops(): ShopIntegration[] {
    try {
      const json = storage.getString(SHOPS_STORAGE_KEY);
      return json ? (JSON.parse(json) as ShopIntegration[]) : [];
    } catch (error) {
      console.warn('Не вдалося прочитати магазини з MMKV:', error);
      return [];
    }
  }

  // Замовлення одного магазину; токен передається бекенду, який звертається до Prom API
  static async getOrders(shopToken: string): Promise<Order[]> {
    const data = await request<OrdersResponse>('/api/orders', { shopToken });
    return data.orders ?? [];
  }

  // Замовлення з усіх підключених магазинів.
  // Якщо частина магазинів недоступна, повертаються успішні; помилка кидається, лише якщо не вдалося жоден.
  static async getAllOrders(): Promise<Order[]> {
    const shops = this.getSavedShops();
    if (shops.length === 0) {
      throw new ApiError('Немає підключених магазинів. Додайте магазин у «Інтеграціях».', 'config');
    }

    const results = await Promise.allSettled(shops.map((shop) => this.getOrders(shop.token)));
    const orders: Order[] = [];
    let firstError: unknown = null;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        orders.push(...result.value);
      } else {
        firstError = firstError ?? result.reason;
      }
    });

    if (orders.length === 0 && firstError !== null) {
      throw firstError;
    }
    return orders;
  }

  // Надсилання замовлення та історії чату на бекенд для аналізу через Claude
  static async processWithAI(order: Order, chatHistory: string): Promise<AIReport> {
    const data = await request<AIResponse>('/api/process-ai', {
      method: 'POST',
      body: { order_data: order, chat_messages: chatHistory },
    });

    if (!data.ai_report) {
      throw new ApiError('ШІ не повернув звіт.', 'parse');
    }
    return data.ai_report;
  }
}
