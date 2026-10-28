import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIReportViewProps {
  report: any;
  totalAmount?: number | string | null;
}

// Визначаємо, чи текст замовлення написаний російською мовою
const isRussianLanguage = (text: string): boolean => {
  if (!text) return false;
  // Перевіряємо наявність специфічних російських літер або слів
  const ruPattern = /[ыэъё]|обработке|новый|выполнен|отменен/i;
  return ruPattern.test(text);
}

// Автоматичний адаптивний переклад статусів залежно від мови замовлення
const getLocalizedStatus = (status: string, isRu: boolean): string => {
  if (!status) return isRu ? 'НОВЫЙ' : 'НОВИЙ';
  const lower = status.toLowerCase();
  
  if (lower.includes('pending') || lower.includes('новий') || lower.includes('новый')) {
    return isRu ? 'НОВЫЙ' : 'НОВИЙ';
  }
  if (lower.includes('processing') || lower.includes('обробці') || lower.includes('обработке')) {
    return isRu ? 'В ОБРАБОТКЕ' : 'В ОБРОБЦІ';
  }
  if (lower.includes('completed') || lower.includes('виконано') || lower.includes('выполнен')) {
    return isRu ? 'ВЫПОЛНЕН' : 'ВИКОНАНО';
  }
  if (lower.includes('cancelled') || lower.includes('скасовано') || lower.includes('отменен')) {
    return isRu ? 'ОТМЕНЕН' : 'СКАСОВАНО';
  }
  return status.toUpperCase();
};

const formatPrettyDetails = (input: any, isRu: boolean): string[] => {
  if (!input) return [isRu ? 'Детали отсутствуют' : 'Деталі відсутні'];

  if (typeof input === 'string') {
    if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
      try {
        input = JSON.parse(input);
      } catch {
        return [input];
      }
    } else {
      return input.split('\n').filter(Boolean);
    }
  }

  const lines: string[] = [];

  if (input.id || input.orderNumber) {
    lines.push(isRu ? `📦 Номер заказа: ${input.orderNumber || input.id}` : `📦 Номер замовлення: ${input.orderNumber || input.id}`);
  }
  if (input.status_name || input.status) {
    lines.push(isRu ? `🚚 Статус: ${getLocalizedStatus(input.status_name || input.status, true)}` : `🚚 Статус: ${getLocalizedStatus(input.status_name || input.status, false)}`);
  }
  if (input.date_created) {
    const dateFormatted = new Date(input.date_created).toLocaleString(isRu ? 'ru-RU' : 'uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    lines.push(isRu ? `📅 Дата и время: ${dateFormatted}` : `📅 Дата та час: ${dateFormatted}`);
  }
  
  const client = input.client || {};
  if (client.first_name || client.last_name) {
    lines.push(isRu ? `👤 Клиент: ${client.last_name || ''} ${client.first_name || ''}`.trim() : `👤 Клієнт: ${client.last_name || ''} ${client.first_name || ''}`.trim());
  }
  if (client.phone || input.phone) {
    lines.push(isRu ? `📞 Телефон: ${client.phone || input.phone}` : `📞 Телефон: ${client.phone || input.phone}`);
  }
  if (client.email) {
    lines.push(`📧 Email: ${client.email}`);
  }

  const delivery = input.delivery_option || {};
  if (delivery.name) {
    lines.push(isRu ? `📍 Доставка: ${delivery.name}` : `📍 Доставка: ${delivery.name}`);
  }

  const payment = input.payment_option || {};
  if (payment.name) {
    lines.push(isRu ? `💳 Оплата: ${payment.name}` : `💳 Оплата: ${payment.name}`);
  }

  const products = input.products || [];
  if (Array.isArray(products) && products.length > 0) {
    lines.push(isRu ? '\n🛍 Товары в заказе:' : '\n🛍 Товари у замовленні:');
    products.forEach((prod: any, idx: number) => {
      const pName = prod.name || (isRu ? 'Товар' : 'Товар');
      const pPrice = prod.price || prod.base_price || '';
      const pQty = prod.quantity || 1;
      lines.push(`  • ${idx + 1}. ${pName} — ${pQty} шт. (${pPrice})`);
    });
  }

  if (lines.length === 0) {
    return [JSON.stringify(input, null, 2).replace(/[{}[\]"]/g, '')];
  }

  return lines;
};

export default function AIReportView({ report, totalAmount }: AIReportViewProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  // Перевіряємо мову замовленння (російська чи українська)
  const rawTextForLang = typeof report === 'string' ? report : JSON.stringify(report || '');
  const isRu = isRussianLanguage(rawTextForLang) || isRussianLanguage(report?.status_name || '');

  const clientData = report?.client || {};
  const firstName = clientData.first_name || '';
  const lastName = clientData.last_name || '';
  const clientName = (lastName || firstName) ? `${lastName} ${firstName}`.trim() : (report?.customerName || (isRu ? 'Клиент' : 'Клієнт'));

  const phone = report?.phone || clientData.phone || '';
  const orderNumber = report?.orderNumber || report?.id || '—';
  const rawStatus = report?.status_name || report?.orderStatus || 'new';
  const orderStatus = getLocalizedStatus(rawStatus, isRu);

  // Динамічна дата та година створення замовлення
  const rawDate = report?.date_created;
  const dateText = rawDate 
    ? new Date(rawDate).toLocaleString(isRu ? 'ru-RU' : 'uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
    : '';

  // Сума замовлення
  const rawSum = totalAmount || report?.totalAmount || report?.price || '0';
  const sumText = `${String(rawSum).replace(/[^\d.]/g, '')} грн`;

  // Доставка
  const delivery = report?.delivery_option || {};
  const city = report?.city || '';
  const postOffice = report?.postOffice || '';
  const deliveryName = [city, postOffice, delivery.name].filter(Boolean).join(', ') || (isRu ? 'Новая Почта' : 'Нова Пошта');

  const prettyDetailsLines = formatPrettyDetails(report, isRu);

  return (
    <View style={styles.card}>
      {/* Шапка картки */}
      <View style={styles.headerTop}>
        <Text style={styles.orderIdText}>Prom #{orderNumber}</Text>
        <View style={styles.rightHeaderInfo}>
          {dateText ? <Text style={styles.dateText}>{dateText}</Text> : null}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{orderStatus}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
      {phone ? <Text style={styles.phoneText}>📞 {phone}</Text> : null}

      <View style={styles.locationContainer}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>{deliveryName}</Text>
      </View>

      {/* Нижня панель зі словом «Сума:» та кнопкою */}
      <View style={styles.footerRow}>
        <Text style={styles.orderSum}>{isRu ? 'Сумма: ' : 'Сума: '}<Text style={styles.priceValue}>{sumText}</Text></Text>
        <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand} style={styles.toggleButton}>
          <Text style={styles.expandHint}>
            {expanded ? (isRu ? '− Свернуть' : '− Згорнути') : (isRu ? '+ Детали заказа' : '+ Деталі замовлення')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Розгорнуті деталі замовлення */}
      {expanded && (
        <View style={styles.bodyContainer}>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>{isRu ? '📋 Подробная информация заказа' : '📋 Детальна інформація замовлення'}</Text>
          {prettyDetailsLines.map((line, index) => (
            <Text key={index} style={styles.detailLine}>{line}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e5e5ea', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderIdText: { fontSize: 13, fontWeight: '700', color: '#007aff' },
  rightHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 11, color: '#8e8e93', fontWeight: '500' },
  statusBadge: { backgroundColor: '#fff0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#ff3b30' },
  clientName: { fontSize: 18, fontWeight: '700', color: '#1c1c1e', marginBottom: 2 },
  phoneText: { fontSize: 14, color: '#8e8e93', fontWeight: '500', marginBottom: 6 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pinIcon: { fontSize: 13, marginRight: 4 },
  locationText: { fontSize: 13, color: '#3a3a3c', fontWeight: '500', flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f2f2f7' },
  orderSum: { fontSize: 14, fontWeight: '600', color: '#8e8e93' },
  priceValue: { fontSize: 17, fontWeight: '700', color: '#34c759' },
  toggleButton: { backgroundColor: '#f2f2f7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  expandHint: { fontSize: 13, color: '#007aff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e5e5ea', marginVertical: 10 },
  bodyContainer: { marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1c1c1e', marginBottom: 8 },
  detailLine: { fontSize: 13, color: '#3a3a3c', lineHeight: 20, marginBottom: 2 },
});