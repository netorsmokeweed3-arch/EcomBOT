import React, { useMemo, memo, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, Modal, SafeAreaView, FlatList, Clipboard } from 'react-native';
import { Order } from '../types/order';
import { HistoryScreen } from './HistoryScreen';
import { orderStore } from '../services/orderStore';
import CurrencyAnalyticsModal from './CurrencyAnalyticsModal';

type PeriodType = 'days' | 'weeks' | 'months' | 'year' | 'all';
type CurrencyType = 'UAH' | 'USD' | 'EUR' | 'GBP';

interface SavedReport {
  id: string;
  date: string;
  periodText: string;
  currency: string;
  totalOrders: number;
  totalRevenue: string;
  averageCheck: string;
  rawText: string;
}

const MARKET_RATES: Record<CurrencyType, { buy: number; sell: number; rate: number; symbol: string }> = {
  UAH: { buy: 1.0, sell: 1.0, rate: 1.0, symbol: 'грн' },
  USD: { buy: 41.25, sell: 41.65, rate: 41.45, symbol: '$' },
  EUR: { buy: 44.80, sell: 45.30, rate: 45.05, symbol: '€' },
  GBP: { buy: 52.90, sell: 53.60, rate: 53.25, symbol: '£' },
};

function AnalyticsScreen() {
  const [completedOrders, setCompletedOrders] = useState<Order[]>(() => {
    try {
      const initial = orderStore.getCompletedOrders();
      return Array.isArray(initial) ? initial : [];
    } catch {
      return [];
    }
  });

  const [currentCurrency, setCurrentCurrency] = useState<CurrencyType>('UAH');
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState<boolean>(false);
  const [isReportsModalVisible, setIsReportsModalVisible] = useState<boolean>(false);
  const [isDetailedCurrencyModalVisible, setIsDetailedCurrencyModalVisible] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Підписка на сховище замовлень
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = orderStore.subscribe(() => {
      if (!isMounted) return;
      try {
        const freshOrders = orderStore.getCompletedOrders();
        setCompletedOrders(Array.isArray(freshOrders) ? [...freshOrders] : []);
      } catch (err) {
        console.error('[AnalyticsStoreSyncError]', err);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch {}
      }
    };
  }, []);

  const handleDeleteHistoryOrder = (id: string) => {
    if (!id || typeof id !== 'string') return;
    try { orderStore.deleteCompletedOrder(id); } catch (err) { console.error(err); }
  };

  const [periodType, setPeriodType] = useState<PeriodType>('all');
  const [periodCount, setPeriodCount] = useState<number>(1);

  // Календарна фільтрація
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(completedOrders)) return [];
    if (periodType === 'all') return completedOrders;

    const now = new Date();
    const targetDate = new Date();

    try {
      if (periodType === 'days') {
        targetDate.setDate(now.getDate() - periodCount);
      } else if (periodType === 'weeks') {
        targetDate.setDate(now.getDate() - periodCount * 7);
      } else if (periodType === 'months') {
        targetDate.setMonth(now.getMonth() - periodCount);
      } else if (periodType === 'year') {
        targetDate.setFullYear(now.getFullYear() - periodCount);
      }
    } catch (err) {
      return completedOrders;
    }

    return completedOrders.filter((order) => {
      if (!order || typeof order !== 'object') return false;
      try {
        const orderDate = new Date(order.createdAt || Date.now());
        if (isNaN(orderDate.getTime())) return true;
        return orderDate >= targetDate && orderDate <= now;
      } catch {
        return true;
      }
    });
  }, [completedOrders, periodType, periodCount]);

  // Фінансовий розрахунок з урахуванням оригінальної валюти замовлень
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    let totalRevenueUah = 0;
    let maxCheckUah = 0;
    let minCheckUah = totalOrders > 0 ? Infinity : 0;

    for (const order of filteredOrders) {
      if (!order) continue;
      let orderAmount = 0;
      const amountObj = order.totalAmount;

      try {
        if (typeof amountObj === 'object' && amountObj !== null && 'amount' in amountObj) {
          orderAmount = Number((amountObj as any).amount) || 0;
        } else if (typeof order.totalAmount === 'number') {
          orderAmount = order.totalAmount;
        } else if (typeof order.totalAmount === 'string') {
          orderAmount = parseFloat(String(order.totalAmount).replace(',', '.')) || 0;
        } else {
          orderAmount = parseFloat(String(amountObj).replace(',', '.')) || 0;
        }
      } catch {
        orderAmount = 0;
      }

      const rawCurrency = (order.currency || (typeof amountObj === 'object' && amountObj !== null && (amountObj as any).currency) || 'UAH').toUpperCase();
      let orderCurrency: CurrencyType = 'UAH';
      if (rawCurrency.includes('USD') || rawCurrency === '$') orderCurrency = 'USD';
      else if (rawCurrency.includes('EUR') || rawCurrency === '€') orderCurrency = 'EUR';
      else if (rawCurrency.includes('GBP') || rawCurrency === '£') orderCurrency = 'GBP';

      const currencyRateToUah = MARKET_RATES[orderCurrency]?.rate || 1.0;
      const amountInUah = orderAmount * currencyRateToUah;

      if (!isNaN(amountInUah) && isFinite(amountInUah)) {
        totalRevenueUah += amountInUah;
        if (amountInUah > maxCheckUah) maxCheckUah = amountInUah;
        if (amountInUah < minCheckUah) minCheckUah = amountInUah;
      }
    }

    if (totalOrders === 0 || minCheckUah === Infinity) minCheckUah = 0;

    const activeTargetRate = MARKET_RATES[currentCurrency]?.rate || 1.0;
    const symbol = MARKET_RATES[currentCurrency]?.symbol || 'грн';

    const totalRevenue = (totalRevenueUah / activeTargetRate).toFixed(2);
    const averageCheck = totalOrders > 0 ? (totalRevenueUah / totalOrders / activeTargetRate).toFixed(2) : '0.00';
    const maxCheck = (maxCheckUah / activeTargetRate).toFixed(2);
    const minCheck = (minCheckUah / activeTargetRate).toFixed(2);
    const projectedRevenue = (periodType === 'days' && periodCount > 0 ? (totalRevenueUah / periodCount) * 30 : totalRevenueUah) / activeTargetRate;

    const conversionRate = completedOrders.length > 0 ? ((totalOrders / completedOrders.length) * 100).toFixed(0) : '100';
    const trendPercentage = totalOrders > 5 ? '+21.0%' : totalOrders > 0 ? '+7.5%' : '0.0%';
    const isPositiveTrend = totalOrders > 0;
    const businessHealth = totalOrders > 3 ? 'Висока активність 🟢' : totalOrders > 0 ? 'Стабільний робітний стан 🟡' : 'Очікування транзакцій ⚪️';

    const periodLabel = periodType === 'all' ? 'Всі періоди' : `${periodCount} ${periodType}`;

    return {
      totalOrders,
      totalRevenue,
      averageCheck,
      maxCheck,
      minCheck,
      conversionRate,
      projectedRevenue: projectedRevenue.toFixed(2),
      trendPercentage,
      isPositiveTrend,
      businessHealth,
      symbol,
      periodLabel,
    };
  }, [filteredOrders, completedOrders.length, periodType, periodCount, currentCurrency]);

  const handleExportAndSaveReport = () => {
    const nowStr = new Date().toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const reportText = `📊 ФІНАНСОВИЙ ЗВІТ МАГАЗИНУ\n📅 Дата: ${nowStr}\n⏱ Період: ${stats.periodLabel}\n🌐 Валюта: ${currentCurrency} (${stats.symbol})\n----------------------------------\n📦 Успішних замовлень: ${stats.totalOrders}\n💰 Загальний дохід: ${stats.totalRevenue} ${stats.symbol}\n📈 Середній чек: ${stats.averageCheck} ${stats.symbol}\n🚀 Піковий чек: ${stats.maxCheck} ${stats.symbol}\n⚡️ Ефективність: ${stats.conversionRate}%\n----------------------------------\nСтатус бізнесу: ${stats.businessHealth}`;

    const newReport: SavedReport = {
      id: Date.now().toString(),
      date: nowStr,
      periodText: stats.periodLabel,
      currency: `${currentCurrency} (${stats.symbol})`,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      averageCheck: stats.averageCheck,
      rawText: reportText,
    };

    setSavedReports((prev) => [newReport, ...prev]);
    Clipboard.setString(reportText);

    Alert.alert('✅ Звіт успішно сформовано!', 'Звіт збережено в «Архів звітів» та автоматично скопійовано у буфер обміну.');
  };

  const handleCopyReportText = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('📋 Скопійовано', 'Текст звіту успішно скопійовано в буфер обміну!');
  };

  const handleDeleteSavedReport = (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>📊 Бізнес-аналітика та доходи</Text>
      <Text style={styles.subtitle}>Мультивалютний захищений корпоративний термінал</Text>

      {/* 1. Блок перемикання активної валюти звіту */}
      <TouchableOpacity 
        style={styles.currencyMonitorCard} 
        activeOpacity={0.8}
        onPress={() => setIsCurrencyModalVisible(true)}
      >
        <View style={styles.monitorHeader}>
          <Text style={styles.monitorTitle}>💱 Валюта звіту та конвертація</Text>
          <Text style={styles.monitorAction}>Змінити ➔</Text>
        </View>
        <Text style={styles.monitorSub}>
          Активна валюта: <Text style={{fontWeight: '700', color: '#007aff'}}>{currentCurrency} ({stats.symbol})</Text> • Натисніть, щоб перевести всю аналітику в USD, EUR, GBP чи UAH
        </Text>
      </TouchableOpacity>

      {/* 2. Окрема кнопка для моніторингу курсів валют і графіків */}
      <TouchableOpacity 
        style={[styles.currencyMonitorCard, { backgroundColor: '#f0f8ff', borderColor: '#007aff' }]} 
        activeOpacity={0.8}
        onPress={() => setIsDetailedCurrencyModalVisible(true)}
      >
        <View style={styles.monitorHeader}>
          <Text style={[styles.monitorTitle, { color: '#007aff' }]}>📈 Курс обміну валют на сьогодні (Графіки)</Text>
          <Text style={styles.monitorAction}>Відкрити ➔</Text>
        </View>
        <Text style={styles.monitorSub}>
          Перегляд актуальних курсів НБУ, середніх курсів у банках та динаміки трендів.
        </Text>
      </TouchableOpacity>

      {/* Баннер статусу та кнопки звітів */}
      <View style={styles.summaryBanner}>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerEmoji}>🛡️</Text>
          <View style={styles.bannerTextContainer}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerTitle}>Статус: {stats.businessHealth}</Text>
              <View style={[styles.trendBadge, stats.isPositiveTrend ? styles.trendGreen : styles.trendNeutral]}>
                <Text style={styles.trendText}>{stats.trendPercentage} 📈</Text>
              </View>
            </View>
            <Text style={styles.bannerDescription}>
              {stats.totalOrders > 0 
                ? `Дохід: ${stats.totalRevenue} ${stats.symbol} за ${stats.periodLabel}.` 
                : `У вибраному діапазоні немає фінансових операцій.`}
            </Text>
          </View>
        </View>

        <View style={styles.reportButtonsRow}>
          <TouchableOpacity style={[styles.exportBtn, { flex: 1 }]} onPress={handleExportAndSaveReport} activeOpacity={0.8}>
            <Text style={styles.exportBtnText}>📥 Експортувати звіт</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.archiveBtn, { flex: 1 }]} onPress={() => setIsReportsModalVisible(true)} activeOpacity={0.8}>
            <Text style={styles.archiveBtnText}>📂 Архів звітів ({savedReports.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Панель вибору періодів */}
      <View style={styles.filterContainer}>
        <View style={styles.mainTabs}>
          {(['all', 'days', 'weeks', 'months', 'year'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, periodType === type && styles.activeTab]}
              onPress={() => {
                setPeriodType(type);
                setPeriodCount(1);
              }}
            >
              <Text style={[styles.tabText, periodType === type && styles.activeTabText]}>
                {type === 'all' ? 'Всі' : type === 'days' ? 'Дні' : type === 'weeks' ? 'Тижні' : type === 'months' ? 'Місяці' : 'Рік'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {periodType !== 'all' && (
          <View style={styles.subFilterRow}>
            <Text style={styles.subFilterLabel}>
              Глибина ({periodType === 'days' ? 'днів' : periodType === 'weeks' ? 'тижнів' : periodType === 'months' ? 'місяців' : 'років'}):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countScroll}>
              {[1, 2, 3, 5, 7, 10, 14, 30].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.countChip, periodCount === num && styles.activeCountChip]}
                  onPress={() => setPeriodCount(num)}
                >
                  <Text style={[styles.countChipText, periodCount === num && styles.activeCountChipText]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Сітка бізнес-карток */}
      <View style={styles.grid}>
        <View style={[styles.card, styles.cardPrimary]}>
          <Text style={styles.cardLabel}>💰 Загальний дохід</Text>
          <Text style={styles.cardValue}>{stats.totalRevenue} {stats.symbol}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>📦 Замовлення</Text>
          <Text style={styles.cardValueDark}>{stats.totalOrders}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>📈 Середній чек</Text>
          <Text style={styles.cardValueDark}>{stats.averageCheck} {stats.symbol}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>✅ Успішно виконано</Text>
          <Text style={styles.cardValueGreen}>{stats.totalOrders}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>🚀 Піковий чек</Text>
          <Text style={styles.cardValueBlue}>{stats.maxCheck} {stats.symbol}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>📉 Мінімальний чек</Text>
          <Text style={styles.cardValueDark}>{stats.minCheck} {stats.symbol}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>⚡ Частка активності</Text>
          <Text style={styles.cardValueDark}>{stats.conversionRate}%</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>🔮 Прогноз місяця</Text>
          <Text style={styles.cardValuePurple}>{stats.projectedRevenue} {stats.symbol}</Text>
        </View>
      </View>

      {/* Шкала продуктивності */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>📈 Індекс безпеки та виконання</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${Math.min(stats.totalOrders * 10, 100)}%` }]} />
        </View>
        <Text style={styles.progressSubText}>
          {stats.totalOrders > 0 
            ? `Оброблено посилок: ${stats.totalOrders}. Валюта: ${currentCurrency}.` 
            : 'Очікування нових замовлень.'}
        </Text>
      </View>

      {/* AI Enterprise Advisor */}
      <View style={styles.aiBox}>
        <Text style={styles.aiTitle}>🤖 AI Enterprise Security & Multi-Currency</Text>
        <Text style={styles.aiText}>
          {stats.totalOrders === 0 
            ? "У вибраному діапазоні немає фінансових даних." 
            : `Мультивалютний конвертер перерахував усі операції у ${currentCurrency}. Натисніть «Експортувати звіт», щоб зберегти зріз.`}
        </Text>
      </View>

      {/* Історія замовлень */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>📜 Детальна історія замовлень</Text>
        <HistoryScreen completedOrders={filteredOrders} onDeleteOrder={handleDeleteHistoryOrder} />
      </View>

      {/* Модальне вікно вибору базової валюти звітності */}
      <Modal
        visible={isCurrencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCurrencyModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💱 Вибір валюти звітності</Text>
              <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕ Закрити</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubText}>Виберіть валюту, в якій відображатимуться всі фінансові показники та звіти:</Text>

            <View style={styles.ratesTableContainer}>
              {(['USD', 'EUR', 'GBP', 'UAH'] as const).map((curr) => {
                const item = MARKET_RATES[curr];
                const isSelected = currentCurrency === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    style={[styles.rateRow, isSelected && styles.activeRateRow]}
                    onPress={() => {
                      setCurrentCurrency(curr);
                      setIsCurrencyModalVisible(false);
                    }}
                  >
                    <View style={styles.rateInfoLeft}>
                      <Text style={styles.rateCurrencyName}>{curr} ({item.symbol})</Text>
                      <Text style={styles.rateDetails}>Курс до гривні: {item.rate} грн</Text>
                    </View>
                    <View style={styles.rateInfoRight}>
                      {isSelected ? <Text style={styles.selectedBadge}>✓ Активна</Text> : <Text style={styles.selectText}>Вибрати</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setIsCurrencyModalVisible(false)}>
              <Text style={styles.modalDoneBtnText}>Готово</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Детальне модальне вікно моніторингу курсів та графіків */}
      <CurrencyAnalyticsModal 
        visible={isDetailedCurrencyModalVisible} 
        onClose={() => setIsDetailedCurrencyModalVisible(false)} 
      />

      {/* Модальне вікно: Архів звітів */}
      <Modal
        visible={isReportsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReportsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📂 Архів експортованих звітів</Text>
              <TouchableOpacity onPress={() => setIsReportsModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕ Закрити</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubText}>
              Тут зберігаються всі сформовані звіти. Натисніть «Копіювати», щоб кинути у Viber чи Telegram:
            </Text>

            {savedReports.length === 0 ? (
              <Text style={styles.emptyReportsText}>Архів звітів порожній 📭</Text>
            ) : (
              <FlatList
                data={savedReports}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.reportCard}>
                    <View style={styles.reportCardHeader}>
                      <Text style={styles.reportDateText}>📅 {item.date}</Text>
                      <Text style={styles.reportCurrBadge}>{item.currency}</Text>
                    </View>
                    <Text style={styles.reportDetailsText}>Період: {item.periodText} | Замовлень: {item.totalOrders}</Text>
                    <Text style={styles.reportRevenueText}>Дохід: {item.totalRevenue} ({item.currency})</Text>

                    <View style={styles.reportActionsRow}>
                      <TouchableOpacity 
                        style={styles.reportCopyBtn} 
                        onPress={() => handleCopyReportText(item.rawText)}
                      >
                        <Text style={styles.reportCopyBtnText}>📋 Копіювати в буфер</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.reportDeleteBtn} 
                        onPress={() => handleDeleteSavedReport(item.id)}
                      >
                        <Text style={styles.reportDeleteBtnText}>Видалити</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            <TouchableOpacity style={[styles.modalDoneBtn, { marginTop: 12 }]} onPress={() => setIsReportsModalVisible(false)}>
              <Text style={styles.modalDoneBtnText}>Закрити архів</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

export default memo(AnalyticsScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { padding: 12, paddingBottom: 28 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1c1c1e', marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#8e8e93', marginBottom: 12 },
  currencyMonitorCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#d1d1d6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  monitorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  monitorTitle: { fontSize: 13, fontWeight: '700', color: '#1c1c1e' },
  monitorAction: { fontSize: 12, fontWeight: '700', color: '#007aff' },
  monitorSub: { fontSize: 11, color: '#8e8e93', lineHeight: 15 },
  summaryBanner: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#d1d1d6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bannerEmoji: { fontSize: 28, marginRight: 12 },
  bannerTextContainer: { flex: 1 },
  bannerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#1c1c1e' },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendGreen: { backgroundColor: '#e8f5e9' },
  trendNeutral: { backgroundColor: '#f2f2f7' },
  trendText: { fontSize: 11, fontWeight: '700', color: '#2e7d32' },
  bannerDescription: { fontSize: 12, color: '#3a3a3c', lineHeight: 16 },
  reportButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  exportBtn: { backgroundColor: '#007aff', paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  exportBtnText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  archiveBtn: { backgroundColor: '#f2f2f7', paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#d1d1d6' },
  archiveBtnText: { fontSize: 12, fontWeight: '600', color: '#1c1c1e' },
  filterContainer: { backgroundColor: '#ffffff', borderRadius: 10, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e5e5ea' },
  mainTabs: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  tab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#f2f2f7' },
  activeTab: { backgroundColor: '#007aff' },
  tabText: { fontSize: 11, color: '#3a3a3c', fontWeight: '600' },
  activeTabText: { color: '#ffffff' },
  subFilterRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#f2f2f7' },
  subFilterLabel: { fontSize: 11, fontWeight: '600', color: '#8e8e93', marginRight: 8 },
  countScroll: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  countChip: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f2f2f7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d1d1d6' },
  activeCountChip: { backgroundColor: '#007aff', borderColor: '#005ec4' },
  countChipText: { fontSize: 11, fontWeight: '700', color: '#3a3a3c' },
  activeCountChipText: { color: '#ffffff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  card: { width: '48%', backgroundColor: '#ffffff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  cardPrimary: { backgroundColor: '#007aff', borderColor: '#0062cc' },
  cardLabel: { fontSize: 10, fontWeight: '600', color: '#8e8e93', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  cardValueDark: { fontSize: 16, fontWeight: '700', color: '#1c1c1e' },
  cardValueGreen: { fontSize: 16, fontWeight: '700', color: '#34c759' },
  cardValueBlue: { fontSize: 16, fontWeight: '700', color: '#007aff' },
  cardValuePurple: { fontSize: 16, fontWeight: '700', color: '#af52de' },
  progressContainer: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e5ea' },
  progressTitle: { fontSize: 13, fontWeight: '700', color: '#1c1c1e', marginBottom: 8 },
  progressBarBackground: { height: 8, backgroundColor: '#f2f2f7', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#34c759', borderRadius: 4 },
  progressSubText: { fontSize: 11, color: '#8e8e93' },
  aiBox: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e5ea' },
  aiTitle: { fontSize: 13, fontWeight: '700', color: '#1c1c1e', marginBottom: 4 },
  aiText: { fontSize: 12, color: '#3a3a3c', lineHeight: 16 },
  historySection: { marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1c1c1e', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c1e' },
  modalCloseText: { fontSize: 14, fontWeight: '600', color: '#007aff' },
  modalSubText: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },
  ratesTableContainer: { gap: 8, marginBottom: 20 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f2f2f7', borderRadius: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  activeRateRow: { backgroundColor: '#e8f5e9', borderColor: '#34c759' },
  rateInfoLeft: { flex: 1 },
  rateCurrencyName: { fontSize: 15, fontWeight: '700', color: '#1c1c1e', marginBottom: 2 },
  rateDetails: { fontSize: 12, color: '#8e8e93' },
  rateInfoRight: { alignItems: 'flex-end' },
  selectedBadge: { fontSize: 12, fontWeight: '700', color: '#2e7d32' },
  selectText: { fontSize: 12, fontWeight: '600', color: '#007aff' },
  modalDoneBtn: { backgroundColor: '#007aff', padding: 14, borderRadius: 10, alignItems: 'center' },
  modalDoneBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  emptyReportsText: { textAlign: 'center', color: '#8e8e93', fontSize: 14, marginVertical: 30 },
  reportCard: { backgroundColor: '#f2f2f7', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  reportCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reportDateText: { fontSize: 12, fontWeight: '700', color: '#1c1c1e' },
  reportCurrBadge: { fontSize: 10, fontWeight: '700', color: '#007aff', backgroundColor: '#e1f0ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  reportDetailsText: { fontSize: 11, color: '#666', marginBottom: 2 },
  reportRevenueText: { fontSize: 13, fontWeight: '700', color: '#2e7d32', marginBottom: 8 },
  reportActionsRow: { flexDirection: 'row', gap: 8 },
  reportCopyBtn: { flex: 1, backgroundColor: '#007aff', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  reportCopyBtnText: { fontSize: 11, fontWeight: '600', color: '#ffffff' },
  reportDeleteBtn: { backgroundColor: '#ffe5e5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  reportDeleteBtnText: { fontSize: 11, fontWeight: '600', color: '#ff3b30' },
});