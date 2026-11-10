// src/services/api.ts
import { createMMKV } from 'react-native-mmkv';
import { Order } from '../types/order';
import { AIReport } from '../types/aiReport';
import { ShopIntegration as BaseShopIntegration } from '../types/shop';

interface ShopIntegration extends BaseShopIntegration {
  consumer_key?: string;
  consumer_secret?: string;
  platform?: 'shopify' | 'woocommerce' | string;
}

const API_BASE_URL = 'https://ecombot-2.onrender.com';
const REQUEST_TIMEOUT_MS = 30000;
const SHOPS_STORAGE_KEY = 'saved_shops';
const EXPIRED_TOKENS_KEY = 'expired_tokens_map';
const AUTH_TOKEN_KEY = 'auth_jwt_token';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

const storage = createMMKV();

export type ApiErrorKind = 'network' | 'timeout' | 'server' | 'parse' | 'config' | 'auth';

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
  orders?: unknown[];
  token_expired?: boolean;
  error?: string;
  detail?: string;
}

interface AIResponse {
  success: boolean;
  ai_report?: unknown;
  token_expired?: boolean;
  error?: string;
  detail?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

type DataRecord = Record<string, unknown>;

function asRecord(value: unknown): DataRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as DataRecord)
    : undefined;
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const result = text(value);
    if (result) {
      return result;
    }
  }
  return '';
}

function amount(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const record = asRecord(value);
  if (record) {
    return amount(record.amount ?? record.value ?? record.formatted);
  }
  if (typeof value !== 'string') {
    return 0;
  }
  const raw = value.trim().replace(/[^\d,.-]/g, '');
  const normalized = raw.includes('.') ? raw.replace(/,/g, '') : raw.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formattedMoney(value: unknown): string {
  const record = asRecord(value);
  return firstText(record?.formatted, record?.amount, value);
}

function markShopTokenExpired(shopId: string) {
  try {
    const raw = storage.getString(EXPIRED_TOKENS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[shopId] = true;
    storage.set(EXPIRED_TOKENS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Не вдалося оновити статус прострочення токена магазину:', e);
  }
}

function mapOrder(value: unknown): Order {
  const source = asRecord(value) ?? {};
  const customer = asRecord(source.customer) ?? asRecord(source.client) ?? {};
  const addressValue = source.delivery_address ?? source.deliveryAddress;
  const address = asRecord(addressValue) ?? {};
  const total = source.total_amount ?? source.totalAmount ?? source.total_price ?? source.price;
  const statusValue = source.status;
  const status = asRecord(statusValue);
  const rawItems = source.items ?? source.line_items ?? source.products;
  
  const items = Array.isArray(rawItems)
    ? rawItems.flatMap((rawItem, index) => {
        const item = asRecord(rawItem);
        if (!item) {
          return [];
        }
        const unitPrice = item.unit_price ?? item.price ?? item.cost;
        const lineTotal = item.line_total ?? item.lineTotal ?? item.total;
        return [{
          id: firstText(item.id, item.sku, index + 1),
          name: firstText(item.title, item.name, item.product_name) || 'Товар',
          quantity: Math.max(0, amount(item.quantity ?? item.qty ?? item.count)) || 1,
          price: amount(unitPrice),
          priceFormatted: formattedMoney(unitPrice) || undefined,
          lineTotal: amount(lineTotal) || undefined,
          lineTotalFormatted: formattedMoney(lineTotal) || undefined,
          sku: firstText(item.sku) || undefined,
        }];
      })
    : [];

  const street = firstText(address.street, address.address1, address.address);
  const street2 = firstText(address.street2, address.address2);
  const city = firstText(source.city, address.city);
  const region = firstText(source.region, address.region, address.province, address.state);
  const postalCode = firstText(source.postal_code, source.postalCode, address.postal_code, address.zip);
  const country = firstText(source.country, address.country, address.country_name);
  const deliveryAddress = firstText(
    typeof addressValue === 'string' ? addressValue : '',
    address.full,
    [country, region, city, [street, street2].filter(Boolean).join(' '), postalCode].filter(Boolean).join(', ')
  );
  const nameFromParts = [
    firstText(customer.first_name, customer.firstName, source.first_name),
    firstText(customer.last_name, customer.lastName, source.last_name),
  ].filter(Boolean).join(' ');
  const totalFormatted = formattedMoney(total);
  const totalCurrency = firstText(asRecord(total)?.currency, source.currency) || 'UAH';

  return {
    id: firstText(source.id, source.order_number, source.orderNumber),
    orderNumber: firstText(source.order_number, source.orderNumber, source.number, source.id),
    customerName: firstText(source.customer_name, source.customerName, customer.name, nameFromParts),
    phone: firstText(source.phone, customer.phone),
    city,
    region: region || undefined,
    postalCode: postalCode || undefined,
    country: country || undefined,
    deliveryAddress,
    deliveryMethod: firstText(source.delivery_method, source.deliveryMethod),
    email: firstText(source.email, customer.email) || undefined,
    status: firstText(status?.text, status?.name, statusValue) || 'processing',
    totalAmount: amount(total),
    totalAmountFormatted: totalFormatted || undefined,
    currency: totalCurrency,
    createdAt: firstText(source.created_at, source.createdAt, source.date_created),
    items,
    chatHistory: firstText(source.chatHistory) || undefined,
  };
}

function moneyPayload(value: number, currency: string, formatted?: string) {
  return {
    amount: value,
    currency,
    formatted: formatted || `${value.toFixed(2)} ${currency === 'UAH' ? 'грн' : currency}`,
  };
}

function toBackendOrder(order: Order): DataRecord {
  const currency = order.currency || 'UAH';
  const orderAmount = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
  const orderStatusText = typeof order.status === 'object' && order.status !== null ? order.status.text : (order.status || 'processing');

  return {
    id: order.id,
    order_number: order.orderNumber,
    created_at: order.createdAt,
    customer_name: order.customerName,
    phone: order.phone,
    email: order.email || '',
    delivery_method: order.deliveryMethod || '',
    delivery_address: {
      street: '',
      city: order.city,
      region: order.region || '',
      postal_code: order.postalCode || '',
      country: order.country || '',
      full: order.deliveryAddress,
    },
    total_amount: moneyPayload(orderAmount, currency, order.totalAmountFormatted),
    currency,
    items: (order.items ?? []).map((item) => {
      const itemPrice = typeof item.price === 'number' ? item.price : 0;
      const itemQty = item.quantity ?? 1;
      const itemLineTotal = typeof item.lineTotal === 'number' ? item.lineTotal : itemPrice * itemQty;
      return {
        id: item.id,
        title: item.name,
        sku: item.sku || '',
        quantity: itemQty,
        unit_price: moneyPayload(itemPrice, currency, item.priceFormatted),
        line_total: moneyPayload(itemLineTotal, currency, item.lineTotalFormatted),
      };
    }),
    status: { text: orderStatusText, cancelled: orderStatusText.toLowerCase().includes('cancel') },
  };
}

// --- БЕЗПЕЧНИЙ ЗАПИТ З ДИНАМІЧНИМ JWT BEARER TOKEN ТА RETRY ---
async function singleRequest<T extends { success: boolean; error?: string; detail?: string; token_expired?: boolean }>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Отримуємо актуальний JWT-токен користувача з MMKV
  const jwtToken = storage.getString(AUTH_TOKEN_KEY);

  const headers: Record<string, string> = { 
    Accept: 'application/json',
    ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
  };
  
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
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

    if (response.status === 401) {
      throw new ApiError('Сесія авторизації закінчилася або токен недійсний.', 'auth');
    }

    if (!response.ok || !data.success || data.token_expired) {
      throw new ApiError(data.error ?? data.detail ?? `Помилка сервера (код ${response.status}).`, 'server');
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

async function request<T extends { success: boolean; error?: string; detail?: string; token_expired?: boolean }>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await singleRequest<T>(path, options);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && (error.kind === 'network' || error.kind === 'timeout')) {
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
      }
      break;
    }
  }

  throw lastError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'auth') {
      return 'Помилка авторизації. Будь ласка, увійдіть у систему заново.';
    }
    return error.message;
  }
  return 'Сталася неочікувана помилка.';
}

export class ApiService {
  static getSavedShops(): ShopIntegration[] {
    try {
      const json = storage.getString(SHOPS_STORAGE_KEY);
      return json ? (JSON.parse(json) as ShopIntegration[]) : [];
    } catch (error) {
      console.warn('Не вдалося прочитати магазини з MMKV:', error);
      return [];
    }
  }

  static async getOrders(shop: ShopIntegration): Promise<Order[]> {
    const bodyData: Record<string, unknown> = {
      shop: shop.name,
      platform: shop.platform || 'shopify',
    };

    if (shop.platform === 'woocommerce') {
      bodyData.consumer_key = shop.consumer_key;
      bodyData.consumer_secret = shop.consumer_secret;
    } else {
      bodyData.token = shop.token;
    }

    try {
      const data = await request<OrdersResponse>('/api/orders', {
        method: 'POST',
        body: bodyData,
      });

      if (data.token_expired) {
        markShopTokenExpired(shop.id);
        throw new Error(`TOKEN_EXPIRED:${shop.id}`);
      }

      return (data.orders ?? []).map((order) => ({
        ...mapOrder(order),
        shopId: shop.id,
        shopName: shop.name,
      }));
    } catch (error) {
      // Якщо сервер відповів простроченим токеном або помилкою авторизації магазину
      if (error instanceof ApiError && error.message.toLowerCase().includes('token')) {
        markShopTokenExpired(shop.id);
      }
      throw error;
    }
  }

  static async getAllOrders(): Promise<Order[]> {
    const shops = this.getSavedShops();
    if (shops.length === 0) {
      throw new ApiError('Немає підключених магазинів. Додайте магазин у «Інтеграціях».', 'config');
    }

    const results = await Promise.allSettled(shops.map((shop) => this.getOrders(shop)));
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

  static async processWithAI(order: Order, chatHistory: string, shop: ShopIntegration): Promise<AIReport> {
    const aiBody: Record<string, unknown> = {
      shop: shop.name,
      platform: shop.platform || 'shopify',
      order_data: toBackendOrder(order),
      chat_messages: chatHistory,
    };

    if (shop.platform === 'woocommerce') {
      aiBody.consumer_key = shop.consumer_key;
      aiBody.consumer_secret = shop.consumer_secret;
    } else {
      aiBody.token = shop.token;
    }

    try {
      const data = await request<AIResponse>('/api/process-ai', {
        method: 'POST',
        body: aiBody,
      });

      if (data.token_expired) {
        markShopTokenExpired(shop.id);
        throw new Error(`TOKEN_EXPIRED:${shop.id}`);
      }

      if (!data.ai_report) {
        throw new ApiError('ШІ не повернув звіт.', 'parse');
      }

      const report = mapOrder(data.ai_report);
      const orderTotalAmount = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
      const reportItems = report.items ?? [];
      const orderItems = order.items ?? [];

      return {
        ...order,
        ...report,
        id: report.id || order.id,
        orderNumber: report.orderNumber || order.orderNumber,
        customerName: report.customerName || order.customerName,
        phone: report.phone || order.phone,
        city: report.city || order.city,
        region: report.region || order.region,
        postalCode: report.postalCode || order.postalCode,
        country: report.country || order.country,
        deliveryAddress: report.deliveryAddress || order.deliveryAddress,
        deliveryMethod: report.deliveryMethod || order.deliveryMethod,
        email: report.email || order.email,
        status: order.status,
        totalAmount: report.totalAmountFormatted ? report.totalAmount : orderTotalAmount,
        totalAmountFormatted: report.totalAmountFormatted || order.totalAmountFormatted,
        currency: report.currency || order.currency,
        createdAt: report.createdAt || order.createdAt,
        items: reportItems.length
          ? reportItems.map((item, index) => {
              const original = orderItems[index];
              const itemPrice = typeof item.price === 'number' ? item.price : 0;
              const originalPrice = original && typeof original.price === 'number' ? original.price : 0;
              return {
                ...item,
                price: itemPrice || originalPrice || 0,
                lineTotal: item.lineTotal ?? original?.lineTotal,
                lineTotalFormatted: item.lineTotalFormatted || original?.lineTotalFormatted,
              };
            })
          : orderItems,
        aiSummary: report.aiSummary || text(asRecord(data.ai_report)?.ai_summary) || '',
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('TOKEN_EXPIRED:')) {
        markShopTokenExpired(shop.id);
        throw new Error(`TOKEN_EXPIRED:${shop.id}`);
      }
      throw error;
    }
  }

  static async trackParcel(trackingNumber: string, carrier: string = 'Нова Пошта'): Promise<{
    success: boolean;
    carrier?: string;
    trackingNumber?: string;
    status?: string;
    warehouse?: string;
    weight?: string;
    backDeliverySum?: string;
    timelineEvents?: string[];
    error?: string;
  }> {
    return await request('/api/tracking', {
      method: 'POST',
      body: { trackingNumber, carrier },
    });
  }

  static async registerPushToken(pushToken: string): Promise<void> {
    try {
      await request('/api/notifications/register', {
        method: 'POST',
        body: { push_token: pushToken },
      });
    } catch (error) {
      console.warn('Не вдалося зареєструвати push-токен на сервері:', error);
    }
  }
}