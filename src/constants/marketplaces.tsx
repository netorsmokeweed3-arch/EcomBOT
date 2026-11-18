// src/constants/marketplaces.ts

export interface MarketplaceField {
  key: string;       
  label: string;     
  secure?: boolean;  
  placeholder: string;
}

export interface MarketplaceConfig {
  id: string;        
  name: string;      
  icon: string;      
  category: 'ukraine' | 'retail' | 'international' | 'cms' | 'crm'; 
  fields: MarketplaceField[];
}

export const MARKETPLACES: MarketplaceConfig[] = [
  // --- Топ українських маркетплейсів ---
  {
    id: 'rozetka',
    name: 'Rozetka',
    icon: 'prom-icon',
    category: 'ukraine',
    fields: [
      { key: 'client_id', label: 'Client ID / Логін', secure: false, placeholder: 'ID кабінету Розетки' },
      { key: 'api_token', label: 'API Token (Bearer)', secure: true, placeholder: 'Токен доступу з кабінету' }
    ]
  },
  {
    id: 'prom',
    name: 'Prom.ua',
    icon: 'prom-icon',
    category: 'ukraine',
    fields: [
      { key: 'token', label: 'Токен продавця Prom (API Key)', secure: true, placeholder: 'Токен з кабінету Prom' }
    ]
  },
  {
    id: 'epicentr',
    name: 'Епіцентр',
    icon: 'epicentr-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token Епіцентр', secure: true, placeholder: 'Ключ інтеграції з кабінету' }
    ]
  },                                                                                                               
  {
    id: 'allo',
    name: 'Allo',
    icon: 'allo-icon',
    category: 'ukraine',
    fields: [
      { key: 'partner_id', label: 'Partner ID', secure: false, placeholder: 'Ваш ID партнера' },
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Ключ доступу Allo API' }
    ]
  },
  {
    id: 'foxtrot',
    name: 'Фокстрот',
    icon: 'foxtrot-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token Фокстрот', secure: true, placeholder: 'Токен доступу до API' }
    ]
  },
  {
    id: 'kasta',
    name: 'Kasta',
    icon: 'izi-icon',
    category: 'ukraine',
    fields: [
      { key: 'client_id', label: 'Client ID', secure: false, placeholder: 'Ідентифікатор клієнта' },
      { key: 'secret_key', label: 'Secret Key', secure: true, placeholder: 'Секретний ключ Kasta' }
    ]
  },
  {
    id: 'moyo',
    name: 'Moyo',
    icon: 'moyo-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_key', label: 'API Key Moyo', secure: true, placeholder: 'Введіть ключ API' }
    ]
  },
  {
    id: 'comfy',
    name: 'Comfy',
    icon: 'comfy-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token Comfy', secure: true, placeholder: 'Токен інтеграції Comfy' }
    ]
  },
  {
    id: 'telemart',
    name: 'Telemart',
    icon: 'telemart-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_key', label: 'API Key Telemart', secure: true, placeholder: 'Ключ доступу' }
    ]
  },
  {
    id: 'citrus',
    name: 'Цитрус',
    icon: 'citrus-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token Цитрус', secure: true, placeholder: 'Токен інтеграції Цитрус' }
    ]
  },
  {
    id: 'eldorado',
    name: 'DiDi Insider',
    icon: 'eldorado-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token', secure: true, placeholder: 'Ключ доступу' }
    ]
  },
  {
    id: 'crafta',
    name: 'Crafta',
    icon: 'prom-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token Crafta', secure: true, placeholder: 'Токен продавця Crafta' }
    ]
  },
  {
    id: 'izi',
    name: 'IZI.ua',
    icon: 'izi-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token IZI', secure: true, placeholder: 'Токен доступу' }
    ]
  },
  {
    id: 'olx',
    name: 'OLX Україна',
    icon: 'other-icon',
    category: 'ukraine',
    fields: [
      { key: 'client_id', label: 'Client ID', secure: false, placeholder: 'OLX Client ID' },
      { key: 'client_secret', label: 'Client Secret', secure: true, placeholder: 'OLX Client Secret' }
    ]
  },
  {
    id: 'shafa',
    name: 'Shafa.ua',
    icon: 'shafa-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token Shafa', secure: true, placeholder: 'Токен інтеграції' }
    ]
  },
  {
    id: 'kidstaff',
    name: 'Kidstaff',
    icon: 'izi-icon',
    category: 'ukraine',
    fields: [
      { key: 'api_token', label: 'API Token Kidstaff', secure: true, placeholder: 'Ключ доступу' }
    ]
  },

  // --- Комп'ютерні магазини та ритейл ---
  {
    id: 'kv',
    name: 'Компʼютерний Всесвіт',
    icon: 'kv-icon',
    category: 'retail',
    fields: [
      { key: 'api_key', label: 'API Key Компʼютерний Всесвіт', secure: true, placeholder: 'Ключ доступу API' }
    ]
  },
  {
    id: 'brain',
    name: 'Brain / ITbox',
    icon: 'brain-icon',
    category: 'retail',
    fields: [
      { key: 'api_token', label: 'B2B API Token / Ключ', secure: true, placeholder: 'Токен доступу Brain' }
    ]
  },
  {
    id: 'exe',
    name: 'EXE.ua',
    icon: 'artline-icon',
    category: 'retail',
    fields: [
      { key: 'api_key', label: 'API Key EXE.ua', secure: true, placeholder: 'Ключ інтеграції' }
    ]
  },
  {
    id: 'artline',
    name: 'Artline',
    icon: 'artline-icon',
    category: 'retail',
    fields: [
      { key: 'api_key', label: 'API Key Artline', secure: true, placeholder: 'Ключ партнерського API' }
    ]
  },
  {
    id: 'elmir',
    name: 'Elmir',
    icon: 'elmir-icon',
    category: 'retail',
    fields: [
      { key: 'api_token', label: 'API Token Elmir', secure: true, placeholder: 'Токен з кабінету' }
    ]
  },
  {
    id: 'click',
    name: 'Click.ua',
    icon: 'click-icon',
    category: 'retail',
    fields: [
      { key: 'api_key', label: 'API Key Click.ua', secure: true, placeholder: 'Ключ API' }
    ]
  },

  // --- Міжнародні маркетплейси ---
  {
    id: 'aliexpress',
    name: 'AliExpress',
    icon: 'aliexpress-icon',
    category: 'international',
    fields: [
      { key: 'app_key', label: 'App Key', secure: false, placeholder: 'AliExpress App Key' },
      { key: 'app_secret', label: 'App Secret', secure: true, placeholder: 'AliExpress App Secret' },
      { key: 'session_key', label: 'Session Token', secure: true, placeholder: 'Token продавця' }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: 'amazon-icon',
    category: 'international',
    fields: [
      { key: 'seller_id', label: 'Seller ID', secure: false, placeholder: 'ID продавця на Amazon' },
      { key: 'mws_auth_token', label: 'SP-API Refresh Token', secure: true, placeholder: 'RefreshToken' },
      { key: 'region', label: 'Регіон', secure: false, placeholder: 'EU / US регіон' }
    ]
  },
  {
    id: 'ebay',
    name: 'eBay',
    icon: 'ebay-icon',
    category: 'international',
    fields: [
      { key: 'auth_token', label: 'OAuth User Token', secure: true, placeholder: 'eBay Auth Token' }
    ]
  },
  {
    id: 'etsy',
    name: 'Etsy',
    icon: 'etsy-icon',
    category: 'international',
    fields: [
      { key: 'keystring', label: 'Etsy Keystring / API Key', secure: false, placeholder: 'API Key' },
      { key: 'shared_secret', label: 'Shared Secret', secure: true, placeholder: 'Secret' }
    ]
  },
  {
    id: 'joom',
    name: 'Joom',
    icon: 'aliexpress-icon',
    category: 'international',
    fields: [
      { key: 'access_token', label: 'Access Token', secure: true, placeholder: 'Токен Joom' }
    ]
  },

  // --- CMS та платформи ---
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: 'woo-icon',
    category: 'cms',
    fields: [
      { key: 'consumer_key', label: 'Consumer Key', secure: false, placeholder: 'ck_xxx' },
      { key: 'consumer_secret', label: 'Consumer Secret', secure: true, placeholder: 'cs_xxx' },
      { key: 'store_url', label: 'URL магазину', secure: false, placeholder: 'https://my-shop.com' }
    ]
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'shopify-icon',
    category: 'cms',
    fields: [
      { key: 'access_token', label: 'Admin API Access Token', secure: true, placeholder: 'shpat_xxx' },
      { key: 'store_domain', label: 'Домен магазину', secure: false, placeholder: 'mystore.myshopify.com' }
    ]
  },
  {
    id: 'opencart',
    name: 'OpenCart',
    icon: 'prestashop-icon',
    category: 'cms',
    fields: [
      { key: 'store_url', label: 'URL сайту', secure: false, placeholder: 'https://my-opencart.com' },
      { key: 'api_key', label: 'API Key модуля', secure: true, placeholder: 'Ключ з модуля' }
    ]
  },
  {
    id: 'magento',
    name: 'Magento',
    icon: 'magento-icon',
    category: 'cms',
    fields: [
      { key: 'store_url', label: 'URL сайту', secure: false, placeholder: 'https://my-magento.com' },
      { key: 'access_token', label: 'Integration Access Token', secure: true, placeholder: 'Bearer Token' }
    ]
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    icon: 'prestashop-icon',
    category: 'cms',
    fields: [
      { key: 'store_url', label: 'URL магазину', secure: false, placeholder: 'https://my-prestashop.com' },
      { key: 'webservice_key', label: 'Webservice Key', secure: true, placeholder: 'Ключ веб-сервісу' }
    ]
  },
  {
    id: 'horoshop',
    name: 'Horoshop',
    icon: 'shopify-icon',
    category: 'cms',
    fields: [
      { key: 'api_token', label: 'API Token Хорошоп', secure: true, placeholder: 'Токен з панелі' }
    ]
  },
  {
    id: 'weblium',
    name: 'Weblium',
    icon: 'wix-icon',
    category: 'cms',
    fields: [
      { key: 'api_token', label: 'API Token Weblium', secure: true, placeholder: 'Токен доступу' }
    ]
  },
  {
    id: 'shopify_plus',
    name: 'Shopify Plus',
    icon: 'shopify-icon',
    category: 'cms',
    fields: [
      { key: 'access_token', label: 'Access Token', secure: true, placeholder: 'shpat_...' },
      { key: 'store_domain', label: 'Domain', secure: false, placeholder: 'store.myshopify.com' }
    ]
  },
  {
    id: 'sqsp',
    name: 'Squarespace',
    icon: 'sqsp-icon',
    category: 'cms',
    fields: [
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Squarespace API Key' }
    ]
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: 'wix-icon',
    category: 'cms',
    fields: [
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Wix API Key' },
      { key: 'instance_id', label: 'Instance ID', secure: false, placeholder: 'Instance ID' }
    ]
  },

  // --- CRM та джерела замовлень ---
  {
    id: 'keycrm',
    name: 'KeyCRM',
    icon: 'salesdrive-icon',
    category: 'crm',
    fields: [
      { key: 'api_key', label: 'KeyCRM API Key', secure: true, placeholder: 'Токен з налаштувань KeyCRM' }
    ]
  },
  {
    id: 'salesdrive',
    name: 'SalesDrive',
    icon: 'salesdrive-icon',
    category: 'crm',
    fields: [
      { key: 'form_url', label: 'URL SalesDrive', secure: false, placeholder: 'https://yourcompany.salesdrive.ua' },
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Ключ API SalesDrive' }
    ]
  },
  {
    id: 'lp-crm',
    name: 'LP-CRM',
    icon: 'salesdrive-icon',
    category: 'crm',
    fields: [
      { key: 'shop_id', label: 'ID магазину', secure: false, placeholder: 'ID' },
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Ключ' }
    ]
  },
  {
    id: 'remonline',
    name: 'RemOnline',
    icon: 'salesdrive-icon',
    category: 'crm',
    fields: [
      { key: 'api_key', label: 'API Key RemOnline', secure: true, placeholder: 'Токен доступу' }
    ]
  },
  {
    id: 'tilda',
    name: 'Tilda',
    icon: 'wix-icon',
    category: 'crm',
    fields: [
      { key: 'public_key', label: 'Public Key', secure: false, placeholder: 'Публічний ключ' },
      { key: 'secret_key', label: 'Secret Key', secure: true, placeholder: 'Секретний ключ' }
    ]
  },
  {
    id: 'bitrix24',
    name: 'Bitrix24',
    icon: 'salesdrive-icon',
    category: 'crm',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', secure: true, placeholder: 'Webhook URL' }
    ]
  },
  {
    id: 'bas',
    name: 'BAS / 1С',
    icon: 'salesdrive-icon',
    category: 'crm',
    fields: [
      { key: 'endpoint_url', label: 'URL веб-сервісу BAS', secure: false, placeholder: 'https://...' },
      { key: 'api_key', label: 'Basic Auth / Token', secure: true, placeholder: 'Логін:Пароль' }
    ]
  },
  {
    id: 'custom_json',
    name: 'Webhook JSON',
    icon: 'custom-icon',
    category: 'crm',
    fields: [
      { key: 'endpoint_url', label: 'Unique Webhook URL', secure: false, placeholder: 'Лінк' },
      { key: 'api_secret', label: 'Secret Header Key', secure: true, placeholder: 'Хедер' }
    ]
  },
  {
    id: 'other',
    name: 'Інший магазин',
    icon: 'other-icon',
    category: 'crm',
    fields: [
      { key: 'endpoint_url', label: 'API Endpoint URL', secure: false, placeholder: 'https://...' },
      { key: 'api_token', label: 'Auth Token', secure: true, placeholder: 'Токен' }
    ]
  }
];