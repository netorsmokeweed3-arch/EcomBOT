import React, { useState, useMemo, useCallback, memo } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { Order, OrderItem } from '../types/order';
import AIChatLogView from './AIChatLogView';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIReportViewProps {
  readonly report?: Order | null;
  readonly totalAmount?: number | string | null;
}

const DICTIONARY = {
  uk: {
    noClient: 'Клієнт не вказано',
    noPhone: 'Телефон не вказано',
    noAddress: 'Адресу не вказано',
    noDetails: 'Деталі відсутні',
    shop: '🏪 Магазин:',
    orderNum: '📦 Номер замовлення:',
    status: '🚚 Статус:',
    date: '📅 Дата та час:',
    client: '👤 Покупець:',
    deliveryMethod: '🚚 Спосіб доставки:',
    deliveryAddress: '📍 Адреса доставки:',
    country: '🌍 Країна:',
    city: '🏙 Місто:',
    sum: '💳 Сума:',
    itemsTitle: '🛍 Товари у замовленні:',
    detailsTitle: '📋 Детальна інформація замовлення',
    collapse: '− Згорнути',
    expand: '+ Деталі замовлення',
    process: 'Обробити',
    complete: 'Завершити',
    currencyUah: 'грн'
  },
  ru: {
    noClient: 'Клиент не указан',
    noPhone: 'Телефон не указан',
    noAddress: 'Адрес не указан',
    noDetails: 'Детали отсутствуют',
    shop: '🏪 Магазин:',
    orderNum: '📦 Номер заказа:',
    status: '🚚 Статус:',
    date: '📅 Дата и время:',
    client: '👤 Клиент:',
    deliveryMethod: '🚚 Способ доставки:',
    deliveryAddress: '📍 Адрес доставки:',
    country: '🌍 Страна:',
    city: '🏙 Город:',
    sum: '💳 Сумма:',
    itemsTitle: '🛍 Товары в заказе:',
    detailsTitle: '📋 Подробная информация заказа',
    collapse: '− Свернуть',
    expand: '+ Детали заказа',
    process: 'Обработать',
    complete: 'Выполнено',
    currencyUah: 'грн'
  }
} as const;

const sanitizeText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const isRussianLanguage = (input?: Order | null): boolean => {
  if (!input) return false;
  const rawAny = input as any;
  const textFields = [
    sanitizeText(input.shopName),
    sanitizeText(input.customerName),
    sanitizeText(input.status),
    sanitizeText(input.deliveryMethod),
    sanitizeText(input.deliveryAddress),
    sanitizeText(input.aiSummary),
    sanitizeText(rawAny.chat_summary)
  ].join(' ');

  if (!textFields) return false;
  return /[ыэъё]|обработке|новый|выполнен|отменен/i.test(textFields);
};

const getLocalizedStatus = (status?: string, isRu: boolean = false): string => {
  const cleanStatus = sanitizeText(status);
  if (!cleanStatus) return isRu ? 'НОВЫЙ' : 'НОВИЙ';
  const lower = cleanStatus.toLowerCase();
  
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
  return cleanStatus.toUpperCase();
};

const getStatusStep = (status?: string): number => {
  const cleanStatus = sanitizeText(status).toLowerCase();
  if (!cleanStatus) return 0;
  if (cleanStatus.includes('cancel') || cleanStatus.includes('скасов') || cleanStatus.includes('отмен')) return -1;
  if (cleanStatus.includes('completed') || cleanStatus.includes('fulfilled') || cleanStatus.includes('виконано') || cleanStatus.includes('выполнен')) return 2;
  if (cleanStatus.includes('shipped') || cleanStatus.includes('відправлено') || cleanStatus.includes('отправлен')) return 1;
  return 0;
};

const OrderItemRow = memo(({ item, index, currency }: { readonly item: OrderItem; readonly index: number; readonly currency?: string }) => {
  const currencyLabel = sanitizeText(currency) === 'UAH' ? 'грн' : sanitizeText(currency) || 'UAH';
  const uPrice = typeof item?.price === 'number' ? item.price : 0;
  const q = typeof item?.quantity === 'number' ? item.quantity : 1;
  const calcTotal = uPrice * q;

  const itemTotal = sanitizeText(item?.lineTotalFormatted) || `${calcTotal.toFixed(2)} ${currencyLabel}`;
  const unitPrice = sanitizeText(item?.priceFormatted) || `${uPrice.toFixed(2)} ${currencyLabel}`;
  const itemName = sanitizeText(item?.name) || 'Товар';

  return (
    <Text style={styles.detailLine}>
      {`  • ${index + 1}. ${itemName} — ${q} шт. × ${unitPrice} = ${itemTotal}`}
    </Text>
  );
});

OrderItemRow.displayName = 'OrderItemRow';

function AIReportView({ report, totalAmount }: AIReportViewProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const isRu = useMemo(() => isRussianLanguage(report), [report]);
  const t = DICTIONARY[isRu ? 'ru' : 'uk'];

  const rawStatus = statusOverride || sanitizeText(report?.status) || 'new';
  const statusStep = useMemo(() => getStatusStep(rawStatus), [rawStatus]);
  const orderStatus = useMemo(() => getLocalizedStatus(rawStatus, isRu), [rawStatus, isRu]);

  const clientName = sanitizeText(report?.customerName) || t.noClient;
  const phone = sanitizeText(report?.phone) || t.noPhone;
  
  const headerTitle = useMemo(() => {
    const shop = sanitizeText(report?.shopName);
    const orderNum = sanitizeText(report?.orderNumber) || sanitizeText(report?.id);
    return [shop, orderNum].filter(Boolean).join(' #');
  }, [report?.shopName, report?.orderNumber, report?.id]);

  const nextStatus = statusStep === 0 ? 'shipped' : statusStep === 1 ? 'completed' : null;
  const actionLabel = statusStep === 0 ? t.process : t.complete;

  const dateText = useMemo(() => {
    const rawDate = report?.createdAt;
    if (!rawDate) return '';
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return '';
    return parsedDate.toLocaleString(isRu ? 'ru-RU' : 'uk-UA', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }, [report?.createdAt, isRu]);

  const deliveryName = sanitizeText(report?.deliveryAddress) || t.noAddress;

  const prettyDetailsLines = useMemo(() => {
    if (!report) return [t.noDetails];
    
    const lines: string[] = [];
    const shop = sanitizeText(report.shopName);
    if (shop) lines.push(`${t.shop} ${shop}`);
    
    const orderNum = sanitizeText(report.orderNumber) || sanitizeText(report.id);
    if (orderNum) lines.push(`${t.orderNum} ${orderNum}`);
    
    if (rawStatus) lines.push(`${t.status} ${orderStatus}`);
    if (dateText) lines.push(`${t.date} ${dateText}`);
    
    const customer = sanitizeText(report.customerName);
    if (customer) lines.push(`${t.client} ${customer}`);
    
    const clientPhone = sanitizeText(report.phone);
    if (clientPhone) lines.push(`📞 ${clientPhone}`);
    
    const email = sanitizeText(report.email);
    if (email) lines.push(`📧 ${email}`);
    
    const deliveryMethod = sanitizeText(report.deliveryMethod);
    if (deliveryMethod) lines.push(`${t.deliveryMethod} ${deliveryMethod}`);
    
    if (report.deliveryAddress) lines.push(`${t.deliveryAddress} ${sanitizeText(report.deliveryAddress)}`);
    
    const country = sanitizeText(report.country);
    if (country) lines.push(`${t.country} ${country}`);
    
    const city = sanitizeText(report.city);
    if (city) lines.push(`${t.city} ${city}`);
    
    const amountFormatted = sanitizeText(report.totalAmountFormatted);
    if (amountFormatted) lines.push(`${t.sum} ${amountFormatted}`);

    return lines;
  }, [report, t, rawStatus, orderStatus, dateText]);

  const reportAny = report as any;
  const aiSummaryText = sanitizeText(report?.aiSummary);
  const chatSummaryText = sanitizeText(reportAny?.chat_summary);

  const items: OrderItem[] = useMemo(() => Array.isArray(report?.items) ? report.items : [], [report?.items]);

  const finalSumText = useMemo(() => {
    const rawVal = totalAmount ?? report?.totalAmount;
    const formatted = sanitizeText(report?.totalAmountFormatted);
    const curr = sanitizeText(report?.currency) === 'UAH' ? t.currencyUah : sanitizeText(report?.currency) || t.currencyUah;

    if (formatted) return formatted;
    if (typeof rawVal === 'number') {
      return `${rawVal.toFixed(2)} ${curr}`;
    }
    return `${sanitizeText(rawVal) || '0.00'} ${curr}`;
  }, [totalAmount, report?.totalAmount, report?.totalAmountFormatted, report?.currency, t.currencyUah]);

  const handleStatusPress = useCallback(() => {
    if (nextStatus) setStatusOverride(nextStatus);
  }, [nextStatus]);

  return (
    <View style={styles.card}>
      <View style={styles.headerTop}>
        <Text style={styles.orderIdText} numberOfLines={1}>{headerTitle}</Text>
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
        <Text style={styles.locationText} numberOfLines={2}>{deliveryName}</Text>
      </View>

      {nextStatus ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleStatusPress}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.orderSum}>
          {t.sum} <Text style={styles.priceValue}>{finalSumText}</Text>
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand} style={styles.toggleButton}>
          <Text style={styles.expandHint}>
            {expanded ? t.collapse : t.expand}
          </Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.bodyContainer}>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>{t.detailsTitle}</Text>
          
          {prettyDetailsLines.map((line, index) => (
            <Text key={`line-${index}`} style={styles.detailLine}>{line}</Text>
          ))}

          {/* Інтегрований блок аналізу та чату від Claude ШІ */}
          <AIChatLogView aiSummary={aiSummaryText} chatSummary={chatSummaryText} />

          {items.length > 0 && (
            <>
              <Text style={[styles.detailLine, { fontWeight: '700', marginTop: 10 }]}>{t.itemsTitle}</Text>
              {items.map((item, index) => (
                <OrderItemRow key={`item-${item?.id || index}`} item={item} index={index} currency={report?.currency} />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default memo(AIReportView);

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e5e5ea', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderIdText: { fontSize: 13, fontWeight: '700', color: '#007aff', flex: 1, marginRight: 8 },
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
  pinIcon: { fontSize: 13, marginRight: 4, alignSelf: 'flex-start' },
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