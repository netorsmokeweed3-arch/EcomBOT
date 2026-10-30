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
  orders?: unknown[];
  error?: string;
}

interface AIResponse {
  success: boolean;
  ai_report?: unknown;
  error?: string;
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
    total_amount: moneyPayload(order.totalAmount, currency, order.totalAmountFormatted),
    currency,
    items: order.items.map((item) => ({
      id: item.id,
      title: item.name,
      sku: item.sku || '',
      quantity: item.quantity,
      unit_price: moneyPayload(item.price, currency, item.priceFormatted),
      line_total: moneyPayload(item.lineTotal ?? item.price * item.quantity, currency, item.lineTotalFormatted),
    })),
    status: { text: order.status, cancelled: order.status.toLowerCase().includes('cancel') },
  };
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

  // Замовлення одного магазину: назва (shop) і токен (token) передаються в тілі POST-запиту
  static async getOrders(shop: ShopIntegration): Promise<Order[]> {
    const data = await request<OrdersResponse>('/api/orders', {
      method: 'POST',
      body: { shop: shop.name, token: shop.token },
    });
    // Позначаємо кожне замовлення магазином-джерелом, щоб аналіз знав, з якого воно магазину
    return (data.orders ?? []).map((order) => ({
      ...mapOrder(order),
      shopId: shop.id,
      shopName: shop.name,
    }));
  }

  // Замовлення з усіх підключених магазинів.
  // Якщо частина магазинів недоступна, повертаються успішні; помилка кидається, лише якщо не вдалося жоден.
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

  // Надсилання замовлення, історії чату та даних магазину (shop, token) на бекенд для аналізу через Claude
  static async processWithAI(order: Order, chatHistory: string, shop: ShopIntegration): Promise<AIReport> {
    const data = await request<AIResponse>('/api/process-ai', {
      method: 'POST',
      body: {
        shop: shop.name,
        token: shop.token,
        order_data: toBackendOrder(order),
        chat_messages: chatHistory,
      },
    });

    if (!data.ai_report) {
      throw new ApiError('ШІ не повернув звіт.', 'parse');
    }
    const report = mapOrder(data.ai_report);
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
      totalAmount: report.totalAmountFormatted ? report.totalAmount : order.totalAmount,
      totalAmountFormatted: report.totalAmountFormatted || order.totalAmountFormatted,
      currency: report.currency || order.currency,
      createdAt: report.createdAt || order.createdAt,
      items: report.items.length
        ? report.items.map((item, index) => {
            const original = order.items[index];
            return {
              ...item,
              price: item.price || original?.price || 0,
              lineTotal: item.lineTotal ?? original?.lineTotal,
              lineTotalFormatted: item.lineTotalFormatted || original?.lineTotalFormatted,
            };
          })
        : order.items,
      aiSummary: report.aiSummary || text(asRecord(data.ai_report)?.ai_summary) || '',
    };
  }
}
