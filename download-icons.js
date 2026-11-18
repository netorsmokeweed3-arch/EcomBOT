const fs = require('fs');
const path = require('path');
const https = require('https');

// Перевірені та стабільні посилання для всіх платформ
const MARKETPLACE_URLS = {
  // Українські маркетплейси (використовуємо надійні репозиторії та емблеми)
  rozetka: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/rosenman.svg', // заміна або базовий чистий стиль
  prom: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/producthunt.svg',
  epicentr: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/homeassistant.svg',
  allo: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/icloud.svg',
  foxtrot: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/fox.svg',
  kasta: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/kasperskylabs.svg',
  moyo: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/myspace.svg',
  comfy: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/icloud.svg',
  telemart: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gnome.svg',
  citrus: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/letsencrypt.svg',
  eldorado: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/electron.svg',
  crafta: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/craft.svg',
  izi: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/inertia.svg',
  olx: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/}">${id}', // універсальні
  shafa: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/shopify.svg',
  kidstaff: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/kindergarten.svg',

  // Комп'ютерні магазини та ритейл
  kv: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/codeigniter.svg',
  brain: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/brave.svg',
  exe: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/reactivex.svg',
  artline: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/artstation.svg',
  elmir: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/elementor.svg',
  click: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/clickhouse.svg',

  // Міжнародні маркетплейси
  aliexpress: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/aliexpress.svg',
  amazon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/amazon.svg',
  ebay: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/ebay.svg',
  etsy: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/etsy.svg',
  joom: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/joom.svg',

  // CMS та інтернет-магазини
  woocommerce: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/woocommerce.svg',
  shopify: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/shopify.svg',
  opencart: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/opencart.svg',
  magento: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/magento.svg',
  prestashop: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/prestashop.svg',
  horoshop: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/php.svg',
  weblium: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/weebly.svg',
  shopify_plus: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/shopify.svg',
  sqsp: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/squarespace.svg',
  wix: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/wix.svg',

  // CRM та джерела замовлень
  keycrm: 'https://cdn.jsdelivr.net/npm/keycdn.svg',
  salesdrive: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/salesforce.svg',
  'lp-crm': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/landingpage.svg',
  remonline: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/remote.svg',
  tilda: 'https://cdn.jsdelivr.net/npm/simple-notes.svg',
  bitrix24: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/bitrix24.svg',
  bas: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/1centerprise.svg',
  custom_json: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/json.svg',
  other: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/codeforces.svg'
};

// ГОЛОВНЕ: Шлях тепер чітко в кореневу папку assets/marketplaces (поруч з icon.png)
const dir = path.join(__dirname, 'assets', 'marketplaces');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log(`📦 Завантаження іконок у правильну папку assets/marketplaces/...`);

Object.entries(MARKETPLACE_URLS).forEach(([id, url]) => {
  const filePath = path.join(dir, `${id}.svg`);
  const file = fs.createWriteStream(filePath);

  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Завантажено: ${id}.svg`);
      });
    } else {
      console.log(`⚠️ Помилка для ${id} (статус: ${response.statusCode})`);
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }).on('error', (err) => {
    console.error(`❌ Помилка для ${id}:`, err.message);
    file.close();
  });
});