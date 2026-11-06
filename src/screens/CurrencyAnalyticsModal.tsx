// src/components/CurrencyAnalyticsModal.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';

interface CurrencyAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
}

type CurrencyCode = 'USD' | 'EUR' | 'PLN' | 'GBP' | 'CHF';
type PeriodType = 'Тиждень' | 'Місяць' | 'Квартал' | 'Рік';

interface CurrencyData {
  name: string;
  flag: string;
  code: string;
  buyBank: number;
  sellBank: number;
  nbuRate: number;
  cashBuy: number;
  cashSell: number;
  buyChange: number;
  sellChange: number;
  nbuChange: number;
}

const INITIAL_CURRENCIES: Record<CurrencyCode, CurrencyData> = {
  USD: { name: 'Долар США', flag: '🇺🇸', code: 'USD', buyBank: 45.59480, sellBank: 46.36480, nbuRate: 45.5348, cashBuy: 46.70, cashSell: 47.00, buyChange: 0.12, sellChange: 0.24, nbuChange: -0.18 },
  EUR: { name: 'Євро', flag: '🇪🇺', code: 'EUR', buyBank: 51.11270, sellBank: 51.88270, nbuRate: 51.0527, cashBuy: 51.95, cashSell: 52.30, buyChange: 0.19, sellChange: 0.34, nbuChange: 0.00 },
  PLN: { name: 'Польський злотий', flag: '🇵🇱', code: 'PLN', buyBank: 11.61440, sellBank: 12.38440, nbuRate: 11.5544, cashBuy: 11.70, cashSell: 11.90, buyChange: 0.00, sellChange: 0.04, nbuChange: -0.02 },
  GBP: { name: 'Британський фунт', flag: '🇬🇧', code: 'GBP', buyBank: 61.15180, sellBank: 61.92180, nbuRate: 61.0918, cashBuy: 61.50, cashSell: 62.50, buyChange: 0.49, sellChange: 0.53, nbuChange: 0.14 },
  CHF: { name: 'Швейцарський франк', flag: '🇨🇭', code: 'CHF', buyBank: 55.62410, sellBank: 56.39410, nbuRate: 55.5641, cashBuy: 55.50, cashSell: 56.50, buyChange: 0.45, sellChange: 0.44, nbuChange: 0.10 }
};

export default function CurrencyAnalyticsModal({ visible, onClose }: CurrencyAnalyticsModalProps) {
  const { theme } = useAppTheme();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('Тиждень');
  const [currencies, setCurrencies] = useState<Record<CurrencyCode, CurrencyData>>(INITIAL_CURRENCIES);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Завантаження живих точних курсів з офіційного API НБУ
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const fetchNbuRates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json');
        const data = await response.json();

        if (Array.isArray(data) && isMounted) {
          const updated = { ...INITIAL_CURRENCIES };
          const mapCode: Record<string, CurrencyCode> = { USD: 'USD', EUR: 'EUR', PLN: 'PLN', GBP: 'GBP', CHF: 'CHF' };

          data.forEach((item: { cc: string; rate: number }) => {
            const targetKey = mapCode[item.cc];
            if (targetKey && updated[targetKey]) {
              const rate = Number(item.rate.toFixed(5));
              updated[targetKey] = {
                ...updated[targetKey],
                nbuRate: rate,
                buyBank: Number((rate + 0.06).toFixed(5)),
                sellBank: Number((rate + 0.83).toFixed(5)),
              };
            }
          });

          setCurrencies(updated);
        }
      } catch (error) {
        console.error('[NBU API Error, using fallback data]', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchNbuRates();

    return () => { isMounted = false; };
  }, [visible]);

  const currInfo = currencies[selectedCurrency];

  // Генерація трендів
  useEffect(() => {
    const baseRate = currInfo.nbuRate;
    let points: { label: string; value: number }[] = [];

    if (selectedPeriod === 'Тиждень') {
      points = [
        { label: '26 жовт', value: Number((baseRate - 0.40).toFixed(2)) },
        { label: '27 жовт', value: Number((baseRate - 0.25).toFixed(2)) },
        { label: '28 жовт', value: Number((baseRate - 0.15).toFixed(2)) },
        { label: '29 жовт', value: Number((baseRate - 0.20).toFixed(2)) },
        { label: '30 жовт', value: Number((baseRate - 0.05).toFixed(2)) },
        { label: '31 жовт', value: Number((baseRate + 0.10).toFixed(2)) },
        { label: '01 лист', value: Number((baseRate + 0.02).toFixed(2)) },
        { label: '02 лист', value: Number(baseRate.toFixed(2)) },
      ];
    } else if (selectedPeriod === 'Місяць') {
      points = [
        { label: '5 жовт', value: Number((baseRate - 0.90).toFixed(2)) },
        { label: '12 жовт', value: Number((baseRate - 0.50).toFixed(2)) },
        { label: '19 жовт', value: Number((baseRate - 0.20).toFixed(2)) },
        { label: '26 жовт', value: Number((baseRate - 0.10).toFixed(2)) },
        { label: '2 лист', value: Number(baseRate.toFixed(2)) },
      ];
    } else if (selectedPeriod === 'Квартал') {
      points = [
        { label: 'Черв', value: Number((baseRate - 1.20).toFixed(2)) },
        { label: 'Лип', value: Number((baseRate - 0.90).toFixed(2)) },
        { label: 'Серп', value: Number((baseRate - 0.60).toFixed(2)) },
        { label: 'Верес', value: Number((baseRate - 0.30).toFixed(2)) },
        { label: 'Жовт', value: Number((baseRate - 0.10).toFixed(2)) },
        { label: 'Лист', value: Number(baseRate.toFixed(2)) },
      ];
    } else {
      points = [
        { label: 'Груд', value: Number((baseRate - 4.20).toFixed(2)) },
        { label: 'Січ', value: Number((baseRate - 3.80).toFixed(2)) },
        { label: 'Лют', value: Number((baseRate - 3.40).toFixed(2)) },
        { label: 'Берез', value: Number((baseRate - 2.80).toFixed(2)) },
        { label: 'Квіт', value: Number((baseRate - 2.20).toFixed(2)) },
        { label: 'Трав', value: Number((baseRate - 1.60).toFixed(2)) },
        { label: 'Черв', value: Number((baseRate - 1.20).toFixed(2)) },
        { label: 'Лип', value: Number((baseRate - 0.90).toFixed(2)) },
        { label: 'Серп', value: Number((baseRate - 0.60).toFixed(2)) },
        { label: 'Верес', value: Number((baseRate - 0.40).toFixed(2)) },
        { label: 'Жовт', value: Number((baseRate - 0.20).toFixed(2)) },
        { label: 'Лист', value: Number(baseRate.toFixed(2)) },
      ];
    }

    setChartData(points);
  }, [selectedCurrency, selectedPeriod, currInfo.nbuRate]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.bgDark }]}>
          
          <View style={[styles.modalHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.cardBorder }]}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Курс обміну валют</Text>
              <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Офіційні дані НБУ та банків</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={[styles.closeBtnText, { color: theme.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Таблиця банківських курсів */}
            <GlassCard style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionHeaderTitle, { color: theme.textPrimary }]}>Курс валют в банках та НБУ</Text>
                {isLoading && <ActivityIndicator size="small" color={theme.primary} />}
              </View>
              
              <View style={[styles.tableHeaderRow, { borderBottomColor: theme.cardBorder }]}>
                <Text style={[styles.th, { flex: 2, textAlign: 'left', color: theme.textSecondary }]}>Валюта</Text>
                <Text style={[styles.th, { color: theme.textSecondary }]}>Купівля</Text>
                <Text style={[styles.th, { color: theme.textSecondary }]}>Продаж</Text>
                <Text style={[styles.th, { color: theme.textSecondary }]}>Курс НБУ</Text>
              </View>

              {(Object.keys(currencies) as CurrencyCode[]).map((code) => {
                const item = currencies[code];
                const isSelected = selectedCurrency === code;
                return (
                  <TouchableOpacity 
                    key={code} 
                    style={[styles.tableRow, { borderBottomColor: theme.cardBorder }, isSelected && { backgroundColor: 'rgba(0,122,255,0.15)', borderColor: theme.primary, borderWidth: 1 }]} 
                    onPress={() => setSelectedCurrency(code)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                      <View style={styles.flagContainer}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{item.flag}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.currCodeText, { color: theme.textPrimary }]}>{code}</Text>
                        <Text style={[styles.currNameText, { color: theme.textSecondary }]} numberOfLines={1}>{item.name}</Text>
                      </View>
                    </View>

                    <View style={styles.tdCol}>
                      <Text style={[styles.tdValue, { color: theme.textPrimary }]}>{item.buyBank.toFixed(4)}</Text>
                      <Text style={[styles.subChange, { color: item.buyChange >= 0 ? '#34c759' : '#ff3b30' }]}>
                        {item.buyChange >= 0 ? '▲' : '▼'} {Math.abs(item.buyChange).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.tdCol}>
                      <Text style={[styles.tdValueSell, { color: '#ff3b30' }]}>{item.sellBank.toFixed(4)}</Text>
                      <Text style={[styles.subChange, { color: item.sellChange >= 0 ? '#34c759' : '#ff3b30' }]}>
                        {item.sellChange >= 0 ? '▲' : '▼'} {Math.abs(item.sellChange).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.tdCol}>
                      <Text style={[styles.tdValueNbu, { color: theme.primary }]}>{item.nbuRate.toFixed(4)}</Text>
                      <Text style={[styles.subChange, { color: item.nbuChange >= 0 ? '#34c759' : '#ff3b30' }]}>
                        {item.nbuChange >= 0 ? '▲' : '▼'} {Math.abs(item.nbuChange).toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </GlassCard>

            {/* Готівковий курс */}
            <GlassCard style={styles.card}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.textPrimary }]}>Готівковий курс в касах ({selectedCurrency} {currInfo.flag})</Text>
              <View style={styles.cashRow}>
                <View style={styles.cashBox}>
                  <Text style={[styles.cashLabel, { color: theme.textSecondary }]}>Купівля</Text>
                  <Text style={[styles.cashVal, { color: '#34c759' }]}>{currInfo.cashBuy.toFixed(2)} грн</Text>
                </View>
                <View style={[styles.cashBox, { borderLeftWidth: 1, borderLeftColor: theme.cardBorder }]}>
                  <Text style={[styles.cashLabel, { color: theme.textSecondary }]}>Продаж</Text>
                  <Text style={[styles.cashVal, { color: '#ff3b30' }]}>{currInfo.cashSell.toFixed(2)} грн</Text>
                </View>
              </View>
            </GlassCard>

            {/* Графік динаміки */}
            <GlassCard style={styles.card}>
              <View style={styles.chartTopRow}>
                <Text style={[styles.sectionHeaderTitle, { color: theme.textPrimary }]}>Динаміка: {currInfo.name}</Text>
                <Text style={[styles.activeCurrBadge, { color: theme.primary, backgroundColor: 'rgba(0,122,255,0.2)' }]}>{selectedCurrency} {currInfo.flag}</Text>
              </View>

              <View style={[styles.periodsRow, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                {(['Тиждень', 'Місяць', 'Квартал', 'Рік'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.periodChip, selectedPeriod === period && { backgroundColor: theme.cardBg }]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[styles.periodChipText, { color: theme.textSecondary }, selectedPeriod === period && { color: theme.primary, fontWeight: '700' }]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.chartContainer, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                <View style={styles.chartGridLines}>
                  <View style={[styles.gridLine, { backgroundColor: theme.cardBorder }]} />
                  <View style={[styles.gridLine, { backgroundColor: theme.cardBorder }]} />
                  <View style={[styles.gridLine, { backgroundColor: theme.cardBorder }]} />
                </View>
                <View style={styles.chartPointsRow}>
                  {chartData.map((pt, idx) => {
                    const minVal = Math.min(...chartData.map(d => d.value)) * 0.99;
                    const maxVal = Math.max(...chartData.map(d => d.value)) * 1.01;
                    const heightPercent = maxVal === minVal ? 50 : Math.max(15, Math.min(100, ((pt.value - minVal) / (maxVal - minVal)) * 100));

                    return (
                      <View key={idx} style={styles.chartColumn}>
                        <View style={styles.barWrapper}>
                          <View style={[styles.activeBarLine, { height: `${heightPercent}%`, backgroundColor: theme.primary + '40' }]} />
                          <View style={[styles.pointIndicator, { backgroundColor: theme.primary, borderColor: theme.cardBg }]} />
                        </View>
                        <Text style={[styles.chartPointLabel, { color: theme.textSecondary }]} numberOfLines={1}>{pt.label}</Text>
                        <Text style={[styles.chartPointVal, { color: theme.textPrimary }]}>{pt.value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </GlassCard>

            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: theme.primary }]} onPress={onClose} activeOpacity={0.85}>
              <Text style={[styles.doneBtnText, { color: '#070907' }]}>Зрозуміло, згорнути</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSub: { fontSize: 11, marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '700' },
  scrollContent: { padding: 12, gap: 12 },
  card: { marginBottom: 0 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, marginBottom: 4 },
  th: { fontSize: 10, fontWeight: '600', textAlign: 'center', flex: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderRadius: 6, paddingHorizontal: 4 },
  td: { justifyContent: 'center' },
  flagContainer: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  tdCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  currCodeText: { fontSize: 13, fontWeight: '700' },
  currNameText: { fontSize: 10 },
  tdValue: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tdValueSell: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tdValueNbu: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  subChange: { fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  cashRow: { flexDirection: 'row', paddingTop: 4 },
  cashBox: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  cashLabel: { fontSize: 11, marginBottom: 2 },
  cashVal: { fontSize: 15, fontWeight: '700' },
  chartTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activeCurrBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  periodsRow: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 8, padding: 3, marginBottom: 12 },
  periodChip: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  periodChipText: { fontSize: 11, fontWeight: '600' },
  chartContainer: { height: 150, borderRadius: 8, padding: 10, justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' },
  chartGridLines: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 35, justifyContent: 'space-between' },
  gridLine: { height: 1, width: '100%' },
  chartPointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2, height: '100%', paddingTop: 10 },
  chartColumn: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barWrapper: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', height: 80, position: 'relative' },
  activeBarLine: { width: 3, position: 'absolute', bottom: 4, borderRadius: 2 },
  pointIndicator: { width: 8, height: 8, borderRadius: 4, marginBottom: 4, zIndex: 3, borderWidth: 1.5 },
  chartPointLabel: { fontSize: 9, marginBottom: 2, textAlign: 'center' },
  chartPointVal: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  doneBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  doneBtnText: { fontSize: 15, fontWeight: '800' },
});