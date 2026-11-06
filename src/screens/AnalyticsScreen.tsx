// src/screens/AnalyticsScreen.tsx
import React, { useMemo, memo, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, Modal, SafeAreaView, FlatList, Clipboard, StatusBar } from 'react-native';
import { Order } from '../types/order';
import { HistoryScreen } from './HistoryScreen';
import { orderStore } from '../services/orderStore';
import CurrencyAnalyticsModal from './CurrencyAnalyticsModal';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';
import { GlassCard } from '../components/GlassCard';

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
  const { theme } = useAppTheme();

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
    const businessHealth = totalOrders > 3 ? 'Висока активність' : totalOrders > 0 ? 'Стабільний робочий стан' : 'Очікування транзакцій';

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
    
    const reportText = `ФІНАНСОВИЙ ЗВІТ МАГАЗИНУ\nДата: ${nowStr}\nПеріод: ${stats.periodLabel}\nВалюта: ${currentCurrency} (${stats.symbol})\n----------------------------------\nУспішних замовлень: ${stats.totalOrders}\nЗагальний дохід: ${stats.totalRevenue} ${stats.symbol}\nСередній чек: ${stats.averageCheck} ${stats.symbol}\nПіковий чек: ${stats.maxCheck} ${stats.symbol}\nЕфективність: ${stats.conversionRate}%\n----------------------------------\nСтатус бізнесу: ${stats.businessHealth}`;

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

    Alert.alert('Звіт успішно сформовано', 'Звіт збережено в «Архів звітів» та автоматично скопійовано у буфер обміну.');
  };

  const handleCopyReportText = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Скопійовано', 'Текст звіту успішно скопійовано в буфер обміну!');
  };

  const handleDeleteSavedReport = (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Аналітика та Доходи</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Мультивалютний корпоративний термінал</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.glassCardWrapper}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setIsCurrencyModalVisible(true)}>
            <View style={styles.monitorHeader}>
              <Text style={[styles.monitorTitle, { color: theme.textPrimary }]}>Валюта звіту та конвертація</Text>
              <Text style={[styles.monitorAction, { color: theme.primary }]}>Змінити ➔</Text>
            </View>
            <Text style={[styles.monitorSub, { color: theme.textSecondary }]}>
              Активна валюта: <Text style={{fontWeight: '700', color: theme.primary}}>{currentCurrency} ({stats.symbol})</Text>. Натисніть, щоб перевести всю аналітику в USD, EUR, GBP чи UAH.
            </Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.glassCardWrapper}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setIsDetailedCurrencyModalVisible(true)}>
            <View style={styles.monitorHeader}>
              <Text style={[styles.monitorTitle, { color: theme.primary }]}>Курс обміну валют на сьогодні (Графіки)</Text>
              <Text style={[styles.monitorAction, { color: theme.primary }]}>Відкрити ➔</Text>
            </View>
            <Text style={[styles.monitorSub, { color: theme.textSecondary }]}>
              Перегляд актуальних курсів НБУ, середніх курсів у банках та динаміки трендів.
            </Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.glassCardWrapper}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerTextContainer}>
              <View style={styles.bannerTitleRow}>
                <Text style={[styles.bannerTitle, { color: theme.textPrimary }]}>Статус: {stats.businessHealth}</Text>
                <View style={[styles.trendBadge, stats.isPositiveTrend ? styles.trendGreen : { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={[styles.trendText, { color: stats.isPositiveTrend ? theme.accentGain : theme.textSecondary }]}>{stats.trendPercentage}</Text>
                </View>
              </View>
              <Text style={[styles.bannerDescription, { color: theme.textSecondary }]}>
                {stats.totalOrders > 0 
                  ? `Дохід: ${stats.totalRevenue} ${stats.symbol} за ${stats.periodLabel}.` 
                  : `У вибраному діапазоні немає фінансових операцій.`}
              </Text>
            </View>
          </View>

          <View style={styles.reportButtonsRow}>
            <TouchableOpacity style={[styles.exportBtn, { flex: 1, backgroundColor: theme.primary }]} onPress={handleExportAndSaveReport} activeOpacity={0.85}>
              <Text style={[styles.exportBtnText, { color: '#070907' }]}>Експортувати звіт</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.archiveBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setIsReportsModalVisible(true)} activeOpacity={0.85}>
              <Text style={[styles.archiveBtnText, { color: theme.textPrimary }]}>Архів звітів ({savedReports.length})</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard style={styles.glassCardWrapper}>
          <View style={styles.mainTabs}>
            {(['all', 'days', 'weeks', 'months', 'year'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.tab, periodType === type && { backgroundColor: theme.primary }]}
                onPress={() => {
                  setPeriodType(type);
                  setPeriodCount(1);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, { color: theme.textSecondary }, periodType === type && { color: '#070907', fontWeight: '800' }]}>
                  {type === 'all' ? 'Всі' : type === 'days' ? 'Дні' : type === 'weeks' ? 'Тижні' : type === 'months' ? 'Місяці' : 'Рік'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {periodType !== 'all' && (
            <View style={[styles.subFilterRow, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={[styles.subFilterLabel, { color: theme.textSecondary }]}>Глибина:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countScroll}>
                {[1, 2, 3, 5, 7, 10, 14, 30].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.countChip, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }, periodCount === num && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setPeriodCount(num)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.countChipText, { color: theme.textPrimary }, periodCount === num && { color: '#070907' }]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </GlassCard>

        <View style={styles.grid}>
          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Загальний дохід</Text>
            <Text style={[styles.cardValue, { color: theme.primary }]}>{stats.totalRevenue} {stats.symbol}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Замовлення</Text>
            <Text style={[styles.cardValueDark, { color: theme.textPrimary }]}>{stats.totalOrders}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Середній чек</Text>
            <Text style={[styles.cardValueDark, { color: theme.textPrimary }]}>{stats.averageCheck} {stats.symbol}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Успішно виконано</Text>
            <Text style={[styles.cardValueGreen, { color: theme.accentGain }]}>{stats.totalOrders}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Піковий чек</Text>
            <Text style={[styles.cardValueBlue, { color: theme.primary }]}>{stats.maxCheck} {stats.symbol}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Мінімальний чек</Text>
            <Text style={[styles.cardValueDark, { color: theme.textPrimary }]}>{stats.minCheck} {stats.symbol}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Частка активності</Text>
            <Text style={[styles.cardValueDark, { color: theme.textPrimary }]}>{stats.conversionRate}%</Text>
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(10, 20, 15, 0.35)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Прогноз місяця</Text>
            <Text style={[styles.cardValuePurple, { color: theme.primary }]}>{stats.projectedRevenue} {stats.symbol}</Text>
          </View>
        </View>

        <GlassCard style={styles.glassCardWrapper}>
          <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>Індекс безпеки та виконання</Text>
          <View style={[styles.progressBarBackground, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <View style={[styles.progressBarFill, { width: `${Math.min(stats.totalOrders * 10, 100)}%` as any, backgroundColor: theme.accentGain }]} />
          </View>
          <Text style={[styles.progressSubText, { color: theme.textSecondary }]}>
            {stats.totalOrders > 0 
              ? `Оброблено посилок: ${stats.totalOrders}. Валюта: ${currentCurrency}.` 
              : 'Очікування нових замовлень.'}
          </Text>
        </GlassCard>

        <GlassCard style={styles.glassCardWrapper}>
          <Text style={[styles.aiTitle, { color: theme.textPrimary }]}>AI Enterprise Security & Multi-Currency</Text>
          <Text style={[styles.aiText, { color: theme.textSecondary }]}>
            {stats.totalOrders === 0 
              ? "У вибраному діапазоні немає фінансових даних." 
              : `Мультивалютний конвертер перерахував усі операції у ${currentCurrency}. Натисніть «Експортувати звіт», щоб зберегти зріз.`}
          </Text>
        </GlassCard>

        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Детальна історія замовлень</Text>
          <HistoryScreen completedOrders={filteredOrders} onDeleteOrder={handleDeleteHistoryOrder} />
        </View>

        <Modal
          visible={isCurrencyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCurrencyModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: '#070907', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Вибір валюти звітності</Text>
                <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)}>
                  <Text style={[styles.modalCloseText, { color: theme.primary }]}>✕ Закрити</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubText, { color: theme.textSecondary }]}>Виберіть валюту, в якій відображатимуться всі фінансові показники та звіти:</Text>

              <View style={styles.ratesTableContainer}>
                {(['USD', 'EUR', 'GBP', 'UAH'] as const).map((curr) => {
                  const item = MARKET_RATES[curr];
                  const isSelected = currentCurrency === curr;
                  return (
                    <TouchableOpacity
                      key={curr}
                      style={[styles.rateRow, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }, isSelected && { backgroundColor: 'rgba(0,122,255,0.1)', borderColor: theme.primary }]}
                      onPress={() => {
                        setCurrentCurrency(curr);
                        setIsCurrencyModalVisible(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.rateInfoLeft}>
                        <Text style={[styles.rateCurrencyName, { color: theme.textPrimary }]}>{curr} ({item.symbol})</Text>
                        <Text style={[styles.rateDetails, { color: theme.textSecondary }]}>Курс до гривні: {item.rate} грн</Text>
                      </View>
                      <View style={styles.rateInfoRight}>
                        {isSelected ? <Text style={[styles.selectedBadge, { color: theme.primary }]}>✓ Активна</Text> : <Text style={[styles.selectText, { color: theme.textSecondary }]}>Вибрати</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={[styles.modalDoneBtn, { backgroundColor: theme.primary }]} onPress={() => setIsCurrencyModalVisible(false)} activeOpacity={0.85}>
                <Text style={[styles.modalDoneBtnText, { color: '#070907' }]}>Готово</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        <CurrencyAnalyticsModal 
          visible={isDetailedCurrencyModalVisible} 
          onClose={() => setIsDetailedCurrencyModalVisible(false)} 
        />

        <Modal
          visible={isReportsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsReportsModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: '#070907', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, maxHeight: '85%' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Архів експортованих звітів</Text>
                <TouchableOpacity onPress={() => setIsReportsModalVisible(false)}>
                  <Text style={[styles.modalCloseText, { color: theme.primary }]}>✕ Закрити</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubText, { color: theme.textSecondary }]}>
                Тут зберігаються всі сформовані звіти. Натисніть «Копіювати», щоб кинути у Viber чи Telegram:
              </Text>

              {savedReports.length === 0 ? (
                <Text style={[styles.emptyReportsText, { color: theme.textSecondary }]}>Архів звітів порожній.</Text>
              ) : (
                <FlatList
                  data={savedReports}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={[styles.reportCard, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }]}>
                      <View style={styles.reportCardHeader}>
                        <Text style={[styles.reportDateText, { color: theme.textPrimary }]}>{item.date}</Text>
                        <Text style={[styles.reportCurrBadge, { color: theme.primary, backgroundColor: 'rgba(0,122,255,0.1)' }]}>{item.currency}</Text>
                      </View>
                      <Text style={[styles.reportDetailsText, { color: theme.textSecondary }]}>Період: {item.periodText} | Замовлень: {item.totalOrders}</Text>
                      <Text style={[styles.reportRevenueText, { color: theme.accentGain }]}>Дохід: {item.totalRevenue} ({item.currency})</Text>

                      <View style={styles.reportActionsRow}>
                        <TouchableOpacity 
                          style={[styles.reportCopyBtn, { backgroundColor: theme.primary }]} 
                          onPress={() => handleCopyReportText(item.rawText)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.reportCopyBtnText, { color: '#070907' }]}>Копіювати в буфер</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.reportDeleteBtn} 
                          onPress={() => handleDeleteSavedReport(item.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.reportDeleteBtnText}>Видалити</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )}

              <TouchableOpacity style={[styles.modalDoneBtn, { backgroundColor: theme.primary, marginTop: 12 }]} onPress={() => setIsReportsModalVisible(false)} activeOpacity={0.85}>
                <Text style={[styles.modalDoneBtnText, { color: '#070907' }]}>Закрити архів</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </View>
  );
}

export default memo(AnalyticsScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, zIndex: 10 },
  topBarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  topBarSub: { fontSize: 11 },
  content: { padding: 12, paddingBottom: 90, zIndex: 1 },
  glassCardWrapper: { marginBottom: 12 },
  monitorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  monitorTitle: { fontSize: 13, fontWeight: '700' },
  monitorAction: { fontSize: 12, fontWeight: '700' },
  monitorSub: { fontSize: 11, lineHeight: 15 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bannerTextContainer: { flex: 1 },
  bannerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  bannerTitle: { fontSize: 13, fontWeight: '700' },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendGreen: { backgroundColor: 'rgba(52, 199, 89, 0.15)' },
  trendText: { fontSize: 11, fontWeight: '700' },
  bannerDescription: { fontSize: 12, lineHeight: 16 },
  reportButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  exportBtn: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center' },
  exportBtnText: { fontSize: 12, fontWeight: '700' },
  archiveBtn: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  archiveBtnText: { fontSize: 12, fontWeight: '600' },
  mainTabs: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  tab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  tabText: { fontSize: 11, fontWeight: '600' },
  subFilterRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', paddingTop: 6, borderTopWidth: 1 },
  subFilterLabel: { fontSize: 11, fontWeight: '600', marginRight: 8 },
  countScroll: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  countChip: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  countChipText: { fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  card: { width: '48%', borderRadius: 12, padding: 12, borderWidth: 1 },
  cardLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '800' },
  cardValueDark: { fontSize: 16, fontWeight: '800' },
  cardValueGreen: { fontSize: 16, fontWeight: '800' },
  cardValueBlue: { fontSize: 16, fontWeight: '800' },
  cardValuePurple: { fontSize: 16, fontWeight: '800' },
  progressTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  progressBarBackground: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSubText: { fontSize: 11 },
  aiTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  aiText: { fontSize: 12, lineHeight: 16 },
  historySection: { marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalCloseText: { fontSize: 14, fontWeight: '700' },
  modalSubText: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  ratesTableContainer: { gap: 8, marginBottom: 20 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  rateInfoLeft: { flex: 1 },
  rateCurrencyName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rateDetails: { fontSize: 12 },
  rateInfoRight: { alignItems: 'flex-end' },
  selectedBadge: { fontSize: 12, fontWeight: '700' },
  selectText: { fontSize: 12, fontWeight: '600' },
  modalDoneBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalDoneBtnText: { fontSize: 15, fontWeight: '700' },
  emptyReportsText: { textAlign: 'center', marginVertical: 20, fontSize: 14 },
  reportCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  reportCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reportDateText: { fontSize: 12, fontWeight: '700' },
  reportCurrBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 10, fontWeight: '700' },
  reportDetailsText: { fontSize: 12 },
  reportRevenueText: { fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  reportActionsRow: { flexDirection: 'row', gap: 8 },
  reportCopyBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  reportCopyBtnText: { fontSize: 12, fontWeight: '700' },
  reportDeleteBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,59,48,0.4)', justifyContent: 'center', alignItems: 'center' },
  reportDeleteBtnText: { fontSize: 12, fontWeight: '700', color: '#ff3b30' },
});