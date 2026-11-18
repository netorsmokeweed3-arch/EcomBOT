// src/types/shop.ts
export interface ShopIntegration {
  id: string;
  name: string;
  token?: string;
  platformId?: string;
  platformName?: string;
  platform?: 'shopify' | 'woocommerce' | string;
  credentials?: Record<string, string>;
  consumer_key?: string;
  consumer_secret?: string;
}