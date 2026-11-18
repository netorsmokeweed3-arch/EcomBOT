// src/constants/marketplaces.ts

export interface MarketplaceField {
  key: string;       // Назва поля під капотом
  label: string;     // Напис для користувача на екрані
  secure?: boolean;  // Чи приховувати текст зірочками
  placeholder: string;
}

export interface MarketplaceConfig {
  id: string;        // Унікальний внутрішній ID
  name: string;      // Відображувана назва
  icon: string;      // Іконка для UI
  fields: MarketplaceField[];
}

export const MARKETPLACES: MarketplaceConfig[] = [
  // --- Топ українських маркетплейсів (2026) ---
  {
    id: 'rozetka',
    name: 'Rozetka (Seller API v2)',
    icon: 'rozetka-icon',
    fields: [
      { key: 'client_id', label: 'Client ID / Логін', secure: false, placeholder: 'ID кабінету Розетки' },
      { key: 'api_token', label: 'API Token (Bearer)', secure: true, placeholder: 'Токен доступу з кабінету' }
    ]
  },
  {
    id: 'prom',
    name: 'Prom.ua (API v1)',
    icon: 'prom-icon',
    fields: [
      { key: 'token', label: 'Токен продавця Prom (API Key)', secure: true, placeholder: 'Токен з кабінету Prom (налаштування API)' }
    ]
  },
  {
    id: 'epicentr',
    name: 'Епіцентр (Маркетплейс)',
    icon: 'epicentr-icon',
    fields: [
      { key: 'api_token', label: 'API Token Епіцентр', secure: true, placeholder: 'Ключ інтеграції з кабінету' }
    ]
  },                                                                                                               
  {
    id: 'allo',
    name: 'Allo (Алло)',
    icon: 'allo-icon',
    fields: [
      { key: 'partner_id', label: 'Partner ID', secure: false, placeholder: 'Ваш ID партнера' },
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Ключ доступу Allo API' }
    ]
  },
  {
    id: 'foxtrot',
    name: 'Foxtrot (Фокстрот)',
    icon: 'foxtrot-icon',
    fields: [
      { key: 'api_token', label: 'API Token Фокстрот', secure: true, placeholder: 'Токен доступу до API' }
    ]
  },
  {
    id: 'kasta',
    name: 'Kasta',
    icon: 'kasta-icon',
    fields: [
      { key: 'client_id', label: 'Client ID', secure: false, placeholder: 'Ідентифікатор клієнта' },
      { key: 'secret_key', label: 'Secret Key', secure: true, placeholder: 'Секретний ключ Kasta' }
    ]
  },
  {
    id: 'moyo',
    name: 'Moyo',
    icon: 'moyo-icon',
    fields: [
      { key: 'api_key', label: 'API Key Moyo', secure: true, placeholder: 'Введіть ключ API' }
    ]
  },
  {
    id: 'comfy',
    name: 'Comfy',
    icon: 'comfy-icon',
    fields: [
      { key: 'api_token', label: 'API Token Comfy', secure: true, placeholder: 'Токен інтеграції Comfy' }
    ]
  },
  {
    id: 'telemart',
    name: 'Telemart',
    icon: 'telemart-icon',
    fields: [
      { key: 'api_key', label: 'API Key Telemart', secure: true, placeholder: 'Ключ доступу' }
    ]
  },
  {
    id: 'citrus',
    name: 'Citrus (Цитрус)',
    icon: 'citrus-icon',
    fields: [
      { key: 'api_token', label: 'API Token Citrus', secure: true, placeholder: 'Токен інтеграції Цитрус' }
    ]
  },
  {
    id: 'eldorado',
    name: 'DiDi Insider / колишній Eldorado',
    icon: 'eldorado-icon',
    fields: [
      { key: 'api_token', label: 'API Token', secure: true, placeholder: 'Ключ доступу' }
    ]
  },
  {
    id: 'crafta',
    name: 'Crafta',
    icon: 'crafta-icon',
    fields: [
      { key: 'api_token', label: 'API Token Crafta', secure: true, placeholder: 'Токен продавця Crafta' }
    ]
  },
  {
    id: 'izi',
    name: 'IZI.ua',
    icon: 'izi-icon',
    fields: [
      { key: 'api_token', label: 'API Token IZI', secure: true, placeholder: 'Токен доступу' }
    ]
  },
  {
    id: 'olx',
    name: 'OLX Україна (Business / API v2)',
    icon: 'olx-icon',
    fields: [
      { key: 'client_id', label: 'Client ID', secure: false, placeholder: 'OLX Client ID' },
      { key: 'client_secret', label: 'Client Secret', secure: true, placeholder: 'OLX Client Secret' }
    ]
  },
  {
    id: 'shafa',
    name: 'Shafa.ua',
    icon: 'shafa-icon',
    fields: [
      { key: 'api_token', label: 'API Token Shafa', secure: true, placeholder: 'Токен інтеграції' }
    ]
  },
  {
    id: 'kidstaff',
    name: 'Kidstaff',
    icon: 'kidstaff-icon',
    fields: [
      { key: 'api_token', label: 'API Token Kidstaff', secure: true, placeholder: 'Ключ доступу' }
    ]
  },

  // --- Комп'ютерні магазини та спеціалізовані ритейлери ---
  {
    id: 'kv',
    name: 'Компʼютерний Всесвіт',
    icon: 'kv-icon',
    fields: [
      { key: 'api_key', label: 'API Key Компʼютерний Всесвіт', secure: true, placeholder: 'Ключ доступу API' }
    ]
  },
  {
    id: 'brain',
    name: 'Brain Computers / ITbox',
    icon: 'brain-icon',
    fields: [
      { key: 'api_token', label: 'B2B API Token / Ключ', secure: true, placeholder: 'Токен доступу Brain' }
    ]
  },
  {
    id: 'exe',
    name: 'EXE.ua',
    icon: 'exe-icon',
    fields: [
      { key: 'api_key', label: 'API Key EXE.ua', secure: true, placeholder: 'Ключ інтеграції' }
    ]
  },
  {
    id: 'artline',
    name: 'Artline',
    icon: 'artline-icon',
    fields: [
      { key: 'api_key', label: 'API Key Artline', secure: true, placeholder: 'Ключ партнерського API' }
    ]
  },
  {
    id: 'elmir',
    name: 'Elmir (Електронний Світ)',
    icon: 'elmir-icon',
    fields: [
      { key: 'api_token', label: 'API Token Elmir', secure: true, placeholder: 'Токен з кабінету' }
    ]
  },
  {
    id: 'click',
    name: 'Click.ua',
    icon: 'click-icon',
    fields: [
      { key: 'api_key', label: 'API Key Click.ua', secure: true, placeholder: 'Ключ API' }
    ]
  },

  // --- Міжнародні маркетплейси ---
  {
    id: 'aliexpress',
    name: 'AliExpress (Open Platform)',
    icon: 'aliexpress-icon',
    fields: [
      { key: 'app_key', label: 'App Key', secure: false, placeholder: 'AliExpress App Key' },
      { key: 'app_secret', label: 'App Secret', secure: true, placeholder: 'AliExpress App Secret' },
      { key: 'session_key', label: 'Session Token', secure: true, placeholder: 'Token продавця' }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon (SP-API 2026)',
    icon: 'amazon-icon',
    fields: [
      { key: 'seller_id', label: 'Seller ID', secure: false, placeholder: 'ID продавця на Amazon' },
      { key: 'mws_auth_token', label: 'SP-API Refresh Token', secure: true, placeholder: 'RefreshToken' },
      { key: 'region', label: 'Регіон (напр. eu-west-1)', secure: false, placeholder: 'EU / US регіон' }
    ]
  },
  {
    id: 'ebay',
    name: 'eBay (OAuth v3)',
    icon: 'ebay-icon',
    fields: [
      { key: 'auth_token', label: 'OAuth User Token', secure: true, placeholder: 'eBay Auth Token' }
    ]
  },
  {
    id: 'etsy',
    name: 'Etsy (Open API v3)',
    icon: 'etsy-icon',
    fields: [
      { key: 'keystring', label: 'Etsy Keystring / API Key', secure: false, placeholder: 'API Key' },
      { key: 'shared_secret', label: 'Shared Secret', secure: true, placeholder: 'Secret' }
    ]
  },
  {
    id: 'joom',
    name: 'Joom Merchant',
    icon: 'joom-icon',
    fields: [
      { key: 'access_token', label: 'Access Token', secure: true, placeholder: 'Токен Joom' }
    ]
  },

  // --- CMS та платформи для власних інтернет-магазинів ---
  {
    id: 'woocommerce',
    name: 'WooCommerce (WordPress)',
    icon: 'woo-icon',
    fields: [
      { key: 'consumer_key', label: 'Consumer Key (ck_...)', secure: false, placeholder: 'ck_xxxxxxxxxxxxxxxx' },
      { key: 'consumer_secret', label: 'Consumer Secret (cs_...)', secure: true, placeholder: 'cs_xxxxxxxxxxxxxxxx' },
      { key: 'store_url', label: 'URL магазину', secure: false, placeholder: 'https://my-shop.com' }
    ]
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'shopify-icon',
    fields: [
      { key: 'access_token', label: 'Admin API Access Token', secure: true, placeholder: 'shpat_xxxxxxxxxxxx' },
      { key: 'store_domain', label: 'Домен магазину', secure: false, placeholder: 'mystore.myshopify.com' }
    ]
  },
  {
    id: 'opencart',
    name: 'OpenCart',
    icon: 'opencart-icon',
    fields: [
      { key: 'store_url', label: 'URL сайту', secure: false, placeholder: 'https://my-opencart.com' },
      { key: 'api_key', label: 'API Key модуля синхронізації', secure: true, placeholder: 'Ключ з модуля' }
    ]
  },
  {
    id: 'magento',
    name: 'Magento / Adobe Commerce',
    icon: 'magento-icon',
    fields: [
      { key: 'store_url', label: 'URL сайту', secure: false, placeholder: 'https://my-magento.com' },
      { key: 'access_token', label: 'Integration Access Token', secure: true, placeholder: 'Bearer Token' }
    ]
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    icon: 'prestashop-icon',
    fields: [
      { key: 'store_url', label: 'URL магазину', secure: false, placeholder: 'https://my-prestashop.com' },
      { key: 'webservice_key', label: 'Webservice Key', secure: true, placeholder: 'Ключ веб-сервісу' }
    ]
  },
  {
    id: 'horoshop',
    name: 'Horoshop (Хорошоп)',
    icon: 'horoshop-icon',
    fields: [
      { key: 'api_token', label: 'API Token Хорошоп', secure: true, placeholder: 'Токен з панелі Хорошоп' }
    ]
  },
  {
    id: 'weblium',
    name: 'Weblium',
    icon: 'weblium-icon',
    fields: [
      { key: 'api_token', label: 'API Token Weblium', secure: true, placeholder: 'Токен доступу' }
    ]
  },
  {
    id: 'shopify_plus',
    name: 'Shopify Plus',
    icon: 'shopify-icon',
    fields: [
      { key: 'access_token', label: 'Access Token', secure: true, placeholder: 'shpat_...' },
      { key: 'store_domain', label: 'Domain', secure: false, placeholder: 'store.myshopify.com' }
    ]
  },
  {
    id: 'sqsp',
    name: 'Squarespace',
    icon: 'squarespace-icon',
    fields: [
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Squarespace API Key' }
    ]
  },
  {
    id: 'wix',
    name: 'Wix eCommerce',
    icon: 'wix-icon',
    fields: [
      { key: 'api_key', label: 'API Key / App Secret', secure: true, placeholder: 'Wix API Key' },
      { key: 'instance_id', label: 'Instance ID', secure: false, placeholder: 'Instance ID' }
    ]
  },

  // --- Українські CRM та джерела замовлень ---
  {
    id: 'keycrm',
    name: 'KeyCRM',
    icon: 'keycrm-icon',
    fields: [
      { key: 'api_key', label: 'KeyCRM API Key', secure: true, placeholder: 'Токен з налаштувань KeyCRM' }
    ]
  },
  {
    id: 'salesdrive',
    name: 'SalesDrive',
    icon: 'salesdrive-icon',
    fields: [
      { key: 'form_url', label: 'URL вашого SalesDrive', secure: false, placeholder: 'https://yourcompany.salesdrive.ua' },
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Ключ API SalesDrive' }
    ]
  },
  {
    id: 'lp-crm',
    name: 'LP-CRM',
    icon: 'lpcrm-icon',
    fields: [
      { key: 'shop_id', label: 'ID магазину', secure: false, placeholder: 'ID' },
      { key: 'api_key', label: 'API Key', secure: true, placeholder: 'Ключ' }
    ]
  },
  {
    id: 'remonline',
    name: 'RemOnline',
    icon: 'remonline-icon',
    fields: [
      { key: 'api_key', label: 'API Key RemOnline', secure: true, placeholder: 'Токен доступу' }
    ]
  },
  {
    id: 'tilda',
    name: 'Tilda Publishing',
    icon: 'tilda-icon',
    fields: [
      { key: 'public_key', label: 'Public Key', secure: false, placeholder: 'Публічний ключ' },
      { key: 'secret_key', label: 'Secret Key', secure: true, placeholder: 'Секретний ключ' }
    ]
  },
  {
    id: 'bitrix24',
    name: 'Bitrix24 (REST Webhook)',
    icon: 'bitrix-icon',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', secure: true, placeholder: 'https://b24-xxx.bitrix24.ua/rest/...' }
    ]
  },
  {
    id: 'bas',
    name: 'BAS / 1С (через зовнішній модуль)',
    icon: 'bas-icon',
    fields: [
      { key: 'endpoint_url', label: 'URL веб-сервісу BAS', secure: false, placeholder: 'https://your-bas-server.com/hs/api/v1' },
      { key: 'api_key', label: 'Basic Auth / Token', secure: true, placeholder: 'Логин:Пароль або токен' }
    ]
  },
  {
    id: 'custom_json',
    name: 'Webhook / Custom JSON Parser',
    icon: 'custom-icon',
    fields: [
      { key: 'endpoint_url', label: 'Unique Webhook URL', secure: false, placeholder: 'Створений системою лінк' },
      { key: 'api_secret', label: 'Secret Header Key', secure: true, placeholder: 'Хедер для перевірки безпеки' }
    ]
  },
  {
    id: 'other',
    name: 'Інший кастомний магазин',
    icon: 'other-icon',
    fields: [
      { key: 'endpoint_url', label: 'API Endpoint URL', secure: false, placeholder: 'https://api.shop.com/orders' },
      { key: 'api_token', label: 'Auth Token', secure: true, placeholder: 'Токен доступу' }
    ]
  }
];