import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { Order } from '../types/order';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIReportViewProps {
  report: Order;
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
  
  if (lower.includes('pending') || lower === 'new' || lower.includes('новий') || lower.includes('новый')) {
    return isRu ? 'НОВЫЙ' : 'НОВИЙ';
  }
  if (lower.includes('processing') || lower.includes('обробці') || lower.includes('обработке')) {
    return isRu ? 'В ОБРАБОТКЕ' : 'В ОБРОБЦІ';
  }
  if (lower.includes('shipped') || lower.includes('відправлено') || lower.includes('отправлен')) {
    return isRu ? 'ОТПРАВЛЕН' : 'ВІДПРАВЛЕНО';
  }
  if (lower.includes('completed') || lower.includes('fulfilled') || lower.includes('виконано') || lower.includes('выполнен')) {
    return isRu ? 'ВЫПОЛНЕН' : 'ВИКОНАНО';
  }
  if (lower.includes('cancelled') || lower.includes('скасовано') || lower.includes('отменен')) {
    return isRu ? 'ОТМЕНЕН' : 'СКАСОВАНО';
  }
  return status.toUpperCase();
};

const formatPrettyDetails = (input: Order, isRu: boolean): string[] => {
  const lines: string[] = [];
  if (input.shopName) {
    lines.push(isRu ? `🏪 Магазин: ${input.shopName}` : `🏪 Магазин: ${input.shopName}`);
  }
  const orderNumber = input.orderNumber || input.id;
  if (orderNumber) {
    lines.push(isRu ? `📦 Номер заказа: ${orderNumber}` : `📦 Номер замовлення: ${orderNumber}`);
  }
  if (input.status) {
    lines.push(isRu ? `🚚 Статус: ${getLocalizedStatus(input.status, true)}` : `🚚 Статус: ${getLocalizedStatus(input.status, false)}`);
  }
  if (input.createdAt) {
    const dateFormatted = new Date(input.createdAt).toLocaleString(isRu ? 'ru-RU' : 'uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    if (dateFormatted !== 'Invalid Date') {
      lines.push(isRu ? `📅 Дата и время: ${dateFormatted}` : `📅 Дата та час: ${dateFormatted}`);
    }
  }
  if (input.customerName) {
    lines.push(isRu ? `👤 Клиент: ${input.customerName}` : `👤 Покупець: ${input.customerName}`);
  }
  if (input.phone) {
    lines.push(`📞 ${input.phone}`);
  }
  if (input.email) {
    lines.push(`📧 ${input.email}`);
  }
  if (input.deliveryMethod) {
    lines.push(isRu ? `🚚 Способ доставки: ${input.deliveryMethod}` : `🚚 Спосіб доставки: ${input.deliveryMethod}`);
  }
  if (input.deliveryAddress) {
    lines.push(isRu ? `📍 Адрес доставки: ${input.deliveryAddress}` : `📍 Адреса доставки: ${input.deliveryAddress}`);
  }
  if (input.country) {
    lines.push(isRu ? `🌍 Страна: ${input.country}` : `🌍 Країна: ${input.country}`);
  }
  if (input.city) {
    lines.push(isRu ? `🏙 Город: ${input.city}` : `🏙 Місто: ${input.city}`);
  }
  if (input.totalAmountFormatted) {
    lines.push(isRu ? `💳 Сумма: ${input.totalAmountFormatted}` : `💳 Сума: ${input.totalAmountFormatted}`);
  }
  if (input.items.length > 0) {
    lines.push(isRu ? '\n🛍 Товары в заказе:' : '\n🛍 Товари у замовленні:');
    input.items.forEach((item, index) => {
      const itemTotal = item.lineTotalFormatted
        || `${(item.lineTotal ?? item.price * item.quantity).toFixed(2)} ${input.currency === 'UAH' ? 'грн' : input.currency || 'UAH'}`;
      const unitPrice = item.priceFormatted
        || `${(item.price ?? 0).toFixed(2)} ${input.currency === 'UAH' ? 'грн' : input.currency || 'UAH'}`;
      lines.push(`  • ${index + 1}. ${item.name} — ${item.quantity} шт. × ${unitPrice} = ${itemTotal}`);
    });
  }
  if (input.aiSummary) {
    lines.push(isRu ? `🤖 Анализ: ${input.aiSummary}` : `🤖 Аналіз: ${input.aiSummary}`);
  }

  return lines.length > 0 ? lines : [isRu ? 'Детали отсутствуют' : 'Деталі відсутні'];
};

// Крок статусу: 0 — в обробці, 1 — відправлено, 2 — виконано, -1 — скасовано
const getStatusStep = (status: string): number => {
  const lower = status.toLowerCase();
  if (lower.includes('cancel') || lower.includes('скасов') || lower.includes('отмен')) return -1;
  if (lower.includes('completed') || lower.includes('fulfilled') || lower.includes('виконано') || lower.includes('выполнен')) return 2;
  if (lower.includes('shipped') || lower.includes('відправлено') || lower.includes('отправлен')) return 1;
  return 0;
};

export default function AIReportView({ report, totalAmount }: AIReportViewProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  // Локальна зміна статусу з кнопки; null — показуємо статус із даних замовлення
  const [statusOverride, setStatusOverride] = useState<string | null>(null);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  // Перевіряємо мову замовленння (російська чи українська)
  const rawTextForLang = JSON.stringify(report);
  const isRu = isRussianLanguage(rawTextForLang);

  // Поля покупця завжди відображаються: якщо даних немає, показуємо заглушку
  const clientName = report.customerName || (isRu ? 'Клиент не указан' : 'Клієнт не вказано');
  const phone = report.phone || (isRu ? 'Телефон не указан' : 'Телефон не вказано');
  // Заголовок: динамічна назва магазину та номер замовлення
  const headerTitle = [report.shopName, report.orderNumber || report.id].filter(Boolean).join(' #');
  const orderNumber = report.orderNumber || report.id || '—';
  const rawStatus = statusOverride ?? (report.status || 'new');
  const statusStep = getStatusStep(rawStatus);
  // Наступний статус для кнопки: з «в обробці» — відправлено, з «відправлено» — виконано
  const nextStatus = statusStep === 0 ? 'shipped' : statusStep === 1 ? 'completed' : null;
  const actionLabel = statusStep === 0
    ? (isRu ? 'Обработать' : 'Обробити')
    : (isRu ? 'Выполнено' : 'Завершити');
  const orderStatus = getLocalizedStatus(rawStatus, isRu);

  // Динамічна дата та година створення замовлення
  const rawDate = report.createdAt;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const dateText = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleString(isRu ? 'ru-RU' : 'uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  // Сума замовлення
  const amountValue = totalAmount ?? report.totalAmount;
  const formattedAmount = typeof amountValue === 'number' ? amountValue.toFixed(2) : amountValue;
  const sumText = report.totalAmountFormatted
    || `${formattedAmount} ${report.currency === 'UAH' ? 'грн' : report.currency || 'UAH'}`;

  // Доставка
  const deliveryName = report.deliveryAddress || (isRu ? 'Адрес не указан' : 'Адресу не вказано');

  const prettyDetailsLines = formatPrettyDetails({ ...report, status: rawStatus }, isRu);

  return (
    <View style={styles.card}>
      {/* Шапка картки */}
      <View style={styles.headerTop}>
        <Text style={styles.orderIdText}>{headerTitle}</Text>
        <View style={styles.rightHeaderInfo}>
          {dateText ? <Text style={styles.dateText}>{dateText}</Text> : null}
          <View style={[styles.statusBadge, statusStep === 2 && styles.statusBadgeDone]}>
            <Text style={[styles.statusText, statusStep === 2 && styles.statusTextDone]}>{orderStatus}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.clientName}>{clientName}</Text>
      <Text style={styles.phoneText}>📞 {phone}</Text>

      <View style={styles.locationContainer}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={styles.locationText}>{deliveryName}</Text>
      </View>

      {/* Кнопка зміни статусу: локально переводить замовлення на наступний етап */}
      {nextStatus ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setStatusOverride(nextStatus)}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}

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
  statusBadgeDone: { backgroundColor: '#e8f9ee' },
  statusTextDone: { color: '#34c759' },
  actionButton: { alignSelf: 'flex-start', backgroundColor: '#007aff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, marginTop: 8 },
  actionButtonText: { fontSize: 13, color: '#ffffff', fontWeight: '700' },
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