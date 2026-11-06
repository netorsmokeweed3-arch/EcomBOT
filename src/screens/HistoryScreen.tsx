
// src/components/HistoryScreen.tsx
import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Order } from '../types/order';
import { useAppTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';

interface HistoryScreenProps {
  completedOrders: Order[];
  onDeleteOrder?: (id: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ completedOrders, onDeleteOrder }) => {
  const { theme } = useAppTheme();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const rawAmount = item.totalAmount;
    const amountVal = typeof rawAmount === 'object' && rawAmount !== null && 'amount' in rawAmount
      ? (rawAmount as any).amount
      : typeof rawAmount === 'number' ? rawAmount : 0;

    const formattedAmount = item.totalAmountFormatted || (item as any).totalFormatted || `${amountVal} грн`;
    const formattedDate = formatDate(item.createdAt || item.created_at);

    return (
      <GlassCard style={styles.glassCardWrapper}>
        <View style={styles.row}>
          <Text style={[styles.orderNumber, { color: theme.textPrimary }]}>
            #{item.orderNumber || item.order_number || item.id}
          </Text>
          <Text style={[styles.price, { color: theme.primary }]}>{formattedAmount}</Text>
        </View>

        <Text style={[styles.text, { color: theme.textSecondary }]} numberOfLines={1}>
          Клієнт: {item.customerName || item.customer_name || 'Не вказано'}
        </Text>

        {formattedDate ? (
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>Дата: {formattedDate}</Text>
        ) : null}

        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: 'rgba(52, 199, 89, 0.15)', borderColor: 'rgba(52, 199, 89, 0.3)', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: theme.accentGain }]}>Виконано</Text>
          </View>
          {onDeleteOrder && (
            <TouchableOpacity onPress={() => Alert.alert('Видалення', 'Видалити замовлення з історії?', [
              { text: 'Ні', style: 'cancel' },
              { text: 'Так', style: 'destructive', onPress: () => onDeleteOrder(item.id) },
            ])} activeOpacity={0.85}>
              <Text style={styles.deleteText}>Видалити</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      {completedOrders.length === 0 ? (
        <GlassCard style={styles.glassCardWrapper}>
          <Text style={[styles.empty, { color: theme.textSecondary }]}>Історія замовлень у цьому періоді порожня.</Text>
        </GlassCard>
      ) : (
        <FlatList
          data={completedOrders}
          keyExtractor={(item, index) => item?.id ? String(item.id) : `history-${index}`}
          renderItem={renderOrderItem}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  glassCardWrapper: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  orderNumber: { fontSize: 13, fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '700' },
  text: { fontSize: 12, marginVertical: 2 },
  dateText: { fontSize: 11, marginBottom: 4, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  deleteText: { fontSize: 11, color: '#FF3B30', fontWeight: '700' },
  empty: { textAlign: 'center', fontSize: 13, marginVertical: 10 },
});