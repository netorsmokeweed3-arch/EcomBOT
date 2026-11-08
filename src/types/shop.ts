// shop.ts
export interface ShopIntegration {
  id: string;
  name: string;
  token: string;
  consumer_key?: string;
  consumer_secret?: string;
  platform?: 'shopify' | 'woocommerce' | string;
}