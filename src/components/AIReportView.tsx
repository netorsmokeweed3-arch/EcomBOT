// src/components/AIReportView.tsx
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View, Alert } from 'react-native';
import { Order, OrderItem } from '../types/order';
import AIChatLogView from './AIChatLogView';
import { useAppTheme } from '../theme/ThemeContext';
import { GlassCard } from './GlassCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIReportViewProps {
  readonly report?: Order | null;
  readonly totalAmount?: number | string | null;
  readonly onAddOrder?: (order: Order) => void;
  readonly onDeleteOrder?: (orderId: string) => void;
  readonly showAddButton?: boolean;
}

const DICTIONARY = {
  uk: {
    noClient: 'Клієнт не вказано', noPhone: 'Телефон не вказано', noAddress: 'Адресу не вказано', noDetails: 'Деталі відсутні',
    shop: 'Магазин:', orderNum: 'Номер замовлення:', status: 'Статус:', date: 'Дата та час:',
    client: 'Покупець:', deliveryMethod: 'Спосіб доставки:', deliveryAddress: 'Адреса доставки:',
    country: 'Країна:', city: 'Місто:', sum: 'Сума:', itemsTitle: 'Товари у замовленні:',
    detailsTitle: 'Детальна інформація замовлення', collapse: '− Згорнути', expand: '+ Деталі замовлення',
    addToOrders: '+ Додати в замовлення', addedToOrders: '✓ Додано в замовлення', currencyUah: 'грн',
    menuTitle: 'Керування замовленням', deleteOption: 'Видалити замовлення', cancel: 'Скасувати'
  },
  ru: {
    noClient: 'Клиент не указан', noPhone: 'Телефон не указан', noAddress: 'Адрес не указан', noDetails: 'Детали отсутствуют',
    shop: 'Магазин:', orderNum: 'Номер заказа:', status: 'Статус:', date: 'Дата и время:',
    client: 'Клиент:', deliveryMethod: 'Способ доставки:', deliveryAddress: 'Адрес доставки:',
    country: 'Страна:', city: 'Город:', sum: 'Сумма:', itemsTitle: 'Товары в заказе:',
    detailsTitle: 'Подробная информация заказа', collapse: '− Свернуть', expand: '+ Детали заказа',
    addToOrders: '+ Добавить в заказ', addedToOrders: '✓ Добавлено в заказ', currencyUah: 'грн',
    menuTitle: 'Управление заказом', deleteOption: 'Удалить заказ', cancel: 'Отмена'
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
  const textFields = [sanitizeText(input.shopName), sanitizeText(input.customerName), sanitizeText(input.status), sanitizeText(input.aiSummary), sanitizeText(rawAny.chat_summary)].join(' ');
  return /[ыэъё]|обработке|новый|выполнен|отменен/i.test(textFields);
};

const getLocalizedStatus = (status?: string, isRu: boolean = false): string => {
  const cleanStatus = sanitizeText(status);
  if (!cleanStatus) return isRu ? 'НОВЫЙ' : 'НОВИЙ';
  const lower = cleanStatus.toLowerCase();
  if (lower.includes('pending') || lower === 'new' || lower.includes('новий')) return isRu ? 'НОВЫЙ' : 'НОВИЙ';
  if (lower.includes('processing') || lower.includes('обробці')) return isRu ? 'В ОБРАБОТКЕ' : 'В ОБРОБЦІ';
  if (lower.includes('shipped') || lower.includes('відправлено')) return isRu ? 'ОТПРАВЛЕН' : 'ВІДПРАВЛЕНО';
  if (lower.includes('completed') || lower.includes('fulfilled') || lower.includes('виконано')) return isRu ? 'ВЫПОЛНЕН' : 'ВИКОНАНО';
  return cleanStatus.toUpperCase();
};

const OrderItemRow = memo(({ item, index, currency }: { readonly item: OrderItem; readonly index: number; readonly currency?: string }) => {
  const { theme } = useAppTheme();
  const currencyLabel = sanitizeText(currency) === 'UAH' ? 'грн' : sanitizeText(currency) || 'UAH';
  const uPrice = typeof item?.price === 'number' ? item.price : 0;
  const q = typeof item?.quantity === 'number' ? item.quantity : 1;
  
  // Виправлено синтаксичну помилку множення
  const itemTotal = sanitizeText(item?.lineTotalFormatted) || `${(uPrice * q).toFixed(2)} ${currencyLabel}`;
  const unitPrice = sanitizeText(item?.priceFormatted) || `${uPrice.toFixed(2)} ${currencyLabel}`;
  
  return (
    <Text style={[styles.detailLine, { color: theme.textSecondary }]}>
      {`  • ${index + 1}. ${sanitizeText(item?.name || item?.title) || 'Товар'} — ${q} шт. × ${unitPrice} = ${itemTotal}`}
    </Text>
  );
});
OrderItemRow.displayName = 'OrderItemRow';

function AIReportView({ report, totalAmount, onAddOrder, onDeleteOrder, showAddButton = false }: AIReportViewProps) {
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  useEffect(() => {
    setIsAdded(false);
  }, [report?.id, report?.orderNumber]);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const isRu = useMemo(() => isRussianLanguage(report), [report]);
  const t = DICTIONARY[isRu ? 'ru' : 'uk'];

  const rawStatus = sanitizeText(typeof report?.status === 'object' ? (report?.status as any)?.text : report?.status) || 'new';
  const orderStatus = useMemo(() => getLocalizedStatus(rawStatus, isRu), [rawStatus, isRu]);
  const clientName = sanitizeText(report?.customerName || report?.customer_name) || t.noClient;
  const phone = sanitizeText(report?.phone) || t.noPhone;
  
  const headerTitle = useMemo(() => {
    return [sanitizeText(report?.shopName || report?.shop_name), sanitizeText(report?.orderNumber || report?.order_number) || sanitizeText(report?.id)].filter(Boolean).join(' #');
  }, [report?.shopName, report?.shop_name, report?.orderNumber, report?.order_number, report?.id]);

  const dateText = useMemo(() => {
    const rawDate = report?.createdAt || report?.created_at;
    if (!rawDate) return '';
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleString(isRu ? 'ru-RU' : 'uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, [report?.createdAt, report?.created_at, isRu]);

  const deliveryName = sanitizeText(typeof report?.deliveryAddress === 'object' && report?.deliveryAddress !== null ? (report?.deliveryAddress as any).full : report?.deliveryAddress) || t.noAddress;

  const prettyDetailsLines = useMemo(() => {
    if (!report) return [t.noDetails];
    const lines: string[] = [];
    const shop = sanitizeText(report.shopName || report.shop_name);
    if (shop) lines.push(`${t.shop} ${shop}`);
    
    const orderNum = sanitizeText(report.orderNumber || report.order_number) || sanitizeText(report.id);
    if (orderNum) lines.push(`${t.orderNum} ${orderNum}`);
    
    if (rawStatus) lines.push(`${t.status} ${orderStatus}`);
    if (dateText) lines.push(`${t.date} ${dateText}`);
    
    const customer = sanitizeText(report.customerName || report.customer_name);
    if (customer) lines.push(`${t.client} ${customer}`);
    
    const clientPhone = sanitizeText(report.phone);
    if (clientPhone) lines.push(`Телефон: ${clientPhone}`);
    
    const email = sanitizeText(report.email);
    if (email) lines.push(`Email: ${email}`);
    
    const deliveryMethod = sanitizeText(report.deliveryMethod || report.delivery_method);
    if (deliveryMethod) lines.push(`${t.deliveryMethod} ${deliveryMethod}`);
    
    if (report.deliveryAddress) {
      const addrStr = typeof report.deliveryAddress === 'object' && report.deliveryAddress !== null ? (report.deliveryAddress as any).full : report.deliveryAddress;
      if (addrStr) lines.push(`${t.deliveryAddress} ${sanitizeText(addrStr)}`);
    }

    return lines;
  }, [report, t, rawStatus, orderStatus, dateText]);

  const handleMenuPress = useCallback(() => {
    Alert.alert(t.menuTitle, `Замовлення #${report?.orderNumber || report?.order_number || report?.id || ''}`, [
      { text: t.cancel, style: 'cancel' },
      { text: t.deleteOption, style: 'destructive', onPress: () => report?.id && onDeleteOrder?.(report.id) }
    ]);
  }, [report, onDeleteOrder, t]);

  const handleAddToOrdersPress = useCallback(() => {
    if (report && onAddOrder) {
      onAddOrder(report);
      setIsAdded(true);
    }
  }, [report, onAddOrder]);

  const finalSumText = useMemo(() => {
    const rawVal = totalAmount ?? report?.totalAmount ?? report?.total_amount;
    const formatted = sanitizeText(report?.totalFormatted);
    const curr = sanitizeText(report?.currency) === 'UAH' ? t.currencyUah : sanitizeText(report?.currency) || t.currencyUah;
    if (formatted) return formatted;
    if (typeof rawVal === 'number') return `${rawVal.toFixed(2)} ${curr}`;
    if (typeof rawVal === 'object' && rawVal !== null && 'formatted' in rawVal) return (rawVal as any).formatted;
    return `${sanitizeText(rawVal) || '0.00'} ${curr}`;
  }, [totalAmount, report?.totalAmount, report?.total_amount, report?.totalFormatted, report?.currency, t.currencyUah]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerTop}>
        <Text style={[styles.orderIdText, { color: theme.primary }]} numberOfLines={1}>{headerTitle}</Text>
        <View style={styles.rightHeaderInfo}>
          {dateText ? <Text style={[styles.dateText, { color: theme.textSecondary }]}>{dateText}</Text> : null}
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: 'rgba(255, 59, 48, 0.3)', borderWidth: 1 }]}>
            <Text style={styles.statusText}>{orderStatus}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={handleMenuPress} style={styles.menuButton}>
            <Text style={[styles.menuDots, { color: theme.textSecondary }]}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.clientName, { color: theme.textPrimary }]}>{clientName}</Text>
      <Text style={[styles.phoneText, { color: theme.textSecondary }]}>Телефон: {phone}</Text>

      <View style={styles.locationContainer}>
        <Text style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={2}>Адреса: {deliveryName}</Text>
      </View>

      {showAddButton && (
        <TouchableOpacity 
          activeOpacity={0.85} 
          onPress={handleAddToOrdersPress} 
          style={[styles.actionButton, { backgroundColor: theme.primary }, isAdded && styles.actionButtonAdded]}
        >
          <Text style={[styles.actionButtonText, { color: '#070907' }, isAdded && styles.actionButtonTextAdded]}>
            {isAdded ? t.addedToOrders : t.addToOrders}
          </Text>
        </TouchableOpacity>
      )}

      <View style={[styles.footerRow, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
        <Text style={[styles.orderSum, { color: theme.textSecondary }]}>
          {t.sum} <Text style={[styles.priceValue, { color: theme.primary }]}>{finalSumText}</Text>
        </Text>
        <TouchableOpacity activeOpacity={0.8} onPress={toggleExpand} style={[styles.toggleButton, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={[styles.expandHint, { color: theme.primary }]}>{expanded ? t.collapse : t.expand}</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.bodyContainer}>
          <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t.detailsTitle}</Text>
          
          {prettyDetailsLines.map((line, index) => (
            <Text key={`line-${index}`} style={[styles.detailLine, { color: theme.textSecondary }]}>{line}</Text>
          ))}

          <AIChatLogView aiSummary={sanitizeText(report?.aiSummary)} chatSummary={sanitizeText(report?.chatHistory || (report as any)?.chat_summary)} />

          {Array.isArray(report?.items) && report.items.length > 0 && (
            <>
              <Text style={[styles.detailLine, { fontWeight: '700', marginTop: 10, color: theme.textPrimary }]}>{t.itemsTitle}</Text>
              {report.items.map((item, index) => <OrderItemRow key={`item-${item?.id || index}`} item={item} index={index} currency={report?.currency} />)}
            </>
          )}
        </View>
      )}
    </GlassCard>
  );
}

export default memo(AIReportView);

const styles = StyleSheet.create({
  card: { 
    marginTop: 12, 
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderIdText: { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
  rightHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 11, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#ff3b30' },
  menuButton: { paddingHorizontal: 6, paddingVertical: 2 },
  menuDots: { fontSize: 18, fontWeight: 'bold' },
  actionButton: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 10 },
  actionButtonAdded: { backgroundColor: '#34c759' },
  actionButtonText: { fontSize: 13, fontWeight: '800' },
  actionButtonTextAdded: { color: '#ffffff' },
  clientName: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  phoneText: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locationText: { fontSize: 13, fontWeight: '500', flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  orderSum: { fontSize: 13, fontWeight: '600' },
  priceValue: { fontSize: 16, fontWeight: '700' },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  expandHint: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  bodyContainer: { marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  detailLine: { fontSize: 13, lineHeight: 20, marginBottom: 2 },
});