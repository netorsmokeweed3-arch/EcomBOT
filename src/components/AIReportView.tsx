import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIReportViewProps {
  report: any;
  totalAmount?: number | string | null;
}

// Універсальний нормалізатор: перетворює будь-яку структуру (Prom або ШІ) на чисті дані
const normalizeOrderData = (input: any, fallbackAmount?: number | string | null) => {
  if (!input) return { name: 'Клієнт', phone: '', address: '', sum: '', orderId: '', rawText: '' };

  // Якщо вхідні дані — це строка (сирий звіт ШІ)
  if (typeof input === 'string') {
    return {
      name: 'Клієнт із чату',
      phone: '',
      address: 'Звіт ШІ',
      sum: fallbackAmount ? `${fallbackAmount} грн` : '',
      orderId: '',
      rawText: input,
    };
  }

  // Якщо це об'єкт замовлення з Prom (як на вашому JSON)
  const client = input.client || {};
  const firstName = client.first_name || '';
  const lastName = client.last_name || '';
  const fullName = (lastName || firstName) ? `${lastName} ${firstName}`.trim() : (input.customerName || 'Клієнт');

  const phone = input.phone || client.phone || '';
  const orderId = input.orderNumber || input.id || '';
  const status = input.status_name || input.orderStatus || 'Новий';

  // Сума замовлення
  const rawSum = fallbackAmount || input.totalAmount || input.price || '0';
  const sumText = `${String(rawSum).replace(/[^\d.]/g, '')} грн`;

  // Доставка
  const delivery = input.delivery_option || {};
  const city = input.city || '';
  const postOffice = input.postOffice || '';
  const deliveryName = [city, postOffice, delivery.name].filter(Boolean).join(', ') || 'Нова Пошта';

  // Повний текст для розгорнутого стану (очищений від зайвого JSON)
  const rawText = input.rawReport || input.text || JSON.stringify(input, null, 2);

  return {
    name: fullName,
    phone,
    address: deliveryName,
    sum: sumText,
    orderId,
    status,
    rawText,
  };
};

export default function AIReportView({ report, totalAmount }: AIReportViewProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const data = normalizeOrderData(report, totalAmount);

  return (
    <View style={styles.card}>
      {/* Головна професійна картка замовлення */}
      <View style={styles.headerTop}>
        <Text style={styles.orderIdText}>Prom #{data.orderId || '—'}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{data.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.clientName} numberOfLines={1}>{data.name}</Text>
      {data.phone ? <Text style={styles.phoneText}>📞 {data.phone}</Text> : null}

      <View style={styles.locationContainer}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>{data.address}</Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.orderSum}>{data.sum}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand} style={styles.toggleButton}>
          <Text style={styles.expandHint}>{expanded ? 'Згорнути ▲' : 'Деталі замовлення ▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Розгорнутий блок з повним звітом (ховається, поки не натиснули) */}
      {expanded && (
        <View style={styles.bodyContainer}>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>🤖 Повний звіт та аналіз ШІ</Text>
          <Text style={styles.fullReportText}>{data.rawText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e5e5ea', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderIdText: { fontSize: 13, fontWeight: '700', color: '#007aff' },
  statusBadge: { backgroundColor: '#fff0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#ff3b30' },
  clientName: { fontSize: 18, fontWeight: '700', color: '#1c1c1e', marginBottom: 2 },
  phoneText: { fontSize: 14, color: '#8e8e93', fontWeight: '500', marginBottom: 6 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pinIcon: { fontSize: 13, marginRight: 4 },
  locationText: { fontSize: 13, color: '#3a3a3c', fontWeight: '500', flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f2f2f7' },
  orderSum: { fontSize: 16, fontWeight: '700', color: '#34c759' },
  toggleButton: { paddingVertical: 4 },
  expandHint: { fontSize: 13, color: '#007aff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e5e5ea', marginVertical: 10 },
  bodyContainer: { marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1c1c1e', marginBottom: 6 },
  fullReportText: { fontSize: 12, color: '#3a3a3c', lineHeight: 18, backgroundColor: '#f9f9fb', padding: 10, borderRadius: 8 },
});