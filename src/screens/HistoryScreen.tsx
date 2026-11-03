import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Order } from '../types/order';

interface HistoryScreenProps {
  completedOrders: Order[];
  onDeleteOrder?: (id: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ completedOrders, onDeleteOrder }) => {
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
    const amountVal = typeof item.totalAmount === 'object' && item.totalAmount !== null && 'amount' in item.totalAmount
      ? (item.totalAmount as any).amount
      : item.totalAmount || 0;

    const formattedDate = formatDate(item.createdAt);

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.orderNumber}>#{item.orderNumber || item.id}</Text>
          <Text style={styles.price}>{item.totalAmountFormatted || `${amountVal} грн`}</Text>
        </View>

        <Text style={styles.text} numberOfLines={1}>👤 {item.customerName || 'Клієнт'}</Text>

        {/* Відображення дати та часу */}
        {formattedDate ? (
          <Text style={styles.dateText}>📅 {formattedDate}</Text>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.badge}>Виконано</Text>
          {onDeleteOrder && (
            <TouchableOpacity onPress={() => Alert.alert('Видалення', 'Видалити замовлення з історії?', [
              { text: 'Ні', style: 'cancel' },
              { text: 'Так', style: 'destructive', onPress: () => onDeleteOrder(item.id) },
            ])}>
              <Text style={styles.deleteText}>Видалити</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {completedOrders.length === 0 ? (
        <Text style={styles.empty}>Історія замовлень у цьому періоді порожня 📭</Text>
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
  card: { backgroundColor: '#FFF', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  orderNumber: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  price: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
  text: { fontSize: 12, color: '#3A3A3C', marginVertical: 2 },
  dateText: { fontSize: 11, color: '#8E8E93', marginBottom: 4, fontWeight: '500' },
  badge: { fontSize: 10, color: '#2E7D32', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '600' },
  deleteText: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#8E8E93', fontSize: 13, marginTop: 15 },
});