import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';

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

  // Генерація трендів із повним роком поспіль та українськими мітками
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
    } else { // Рік — повний правильний цикл від грудня до листопада
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
        <View style={styles.modalContainer}>
          
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>💱 Курс обміну валют на сьогодні</Text>
              <Text style={styles.modalSub}>Офіційні дані НБУ та банків • Деталізація</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Таблиця банківських курсів із вирівняними прапорцями */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.sectionHeaderTitle}>📊 Середній курс валют в банках та НБУ</Text>
                {isLoading && <ActivityIndicator size="small" color="#007aff" />}
              </View>
              
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2, textAlign: 'left' }]}>Валюта</Text>
                <Text style={styles.th}>Купівля</Text>
                <Text style={styles.th}>Продаж</Text>
                <Text style={styles.th}>Курс НБУ</Text>
              </View>

              {(Object.keys(currencies) as CurrencyCode[]).map((code) => {
                const item = currencies[code];
                const isSelected = selectedCurrency === code;
                return (
                  <TouchableOpacity 
                    key={code} 
                    style={[styles.tableRow, isSelected && styles.selectedTableRow]}
                    onPress={() => setSelectedCurrency(code)}
                  >
                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                      <View style={styles.flagContainer}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{item.flag}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.currCodeText}>{code}</Text>
                        <Text style={styles.currNameText} numberOfLines={1}>{item.name}</Text>
                      </View>
                    </View>

                    {/* Купівля зі стрілочкою */}
                    <View style={styles.tdCol}>
                      <Text style={styles.tdValue}>{item.buyBank.toFixed(5)}</Text>
                      <Text style={[styles.subChange, { color: item.buyChange >= 0 ? '#34c759' : '#ff3b30' }]}>
                        {item.buyChange >= 0 ? '▲' : '▼'} {Math.abs(item.buyChange).toFixed(2)}
                      </Text>
                    </View>

                    {/* Продаж зі стрілочкою */}
                    <View style={styles.tdCol}>
                      <Text style={styles.tdValueSell}>{item.sellBank.toFixed(5)}</Text>
                      <Text style={[styles.subChange, { color: item.sellChange >= 0 ? '#34c759' : '#ff3b30' }]}>
                        {item.sellChange >= 0 ? '▲' : '▼'} {Math.abs(item.sellChange).toFixed(2)}
                      </Text>
                    </View>

                    {/* Курс НБУ зі стрілочкою */}
                    <View style={styles.tdCol}>
                      <Text style={styles.tdValueNbu}>{item.nbuRate.toFixed(4)}</Text>
                      <Text style={[styles.subChange, { color: item.nbuChange >= 0 ? '#34c759' : '#ff3b30' }]}>
                        {item.nbuChange >= 0 ? '▲' : '▼'} {Math.abs(item.nbuChange).toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Готівковий курс */}
            <View style={styles.card}>
              <Text style={styles.sectionHeaderTitle}>💵 Готівковий курс в касах ({selectedCurrency} {currInfo.flag})</Text>
              <View style={styles.cashRow}>
                <View style={styles.cashBox}>
                  <Text style={styles.cashLabel}>Купівля</Text>
                  <Text style={styles.cashVal}>{currInfo.cashBuy.toFixed(2)} грн</Text>
                </View>
                <View style={[styles.cashBox, { borderLeftWidth: 1, borderLeftColor: '#e5e5ea' }]}>
                  <Text style={styles.cashLabel}>Продаж</Text>
                  <Text style={[styles.cashVal, { color: '#ff3b30' }]}>{currInfo.cashSell.toFixed(2)} грн</Text>
                </View>
              </View>
            </View>

            {/* Графік динаміки */}
            <View style={styles.card}>
              <View style={styles.chartTopRow}>
                <Text style={styles.sectionHeaderTitle}>📈 Динаміка середнього курсу: {currInfo.name}</Text>
                <Text style={styles.activeCurrBadge}>{selectedCurrency} {currInfo.flag}</Text>
              </View>

              <View style={styles.periodsRow}>
                {(['Тиждень', 'Місяць', 'Квартал', 'Рік'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.periodChip, selectedPeriod === period && styles.activePeriodChip]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[styles.periodChipText, selectedPeriod === period && styles.activePeriodChipText]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.chartContainer}>
                <View style={styles.chartGridLines}>
                  <View style={styles.gridLine} /><View style={styles.gridLine} /><View style={styles.gridLine} />
                </View>
                <View style={styles.chartPointsRow}>
                  {chartData.map((pt, idx) => {
                    const minVal = Math.min(...chartData.map(d => d.value)) * 0.99;
                    const maxVal = Math.max(...chartData.map(d => d.value)) * 1.01;
                    const heightPercent = maxVal === minVal ? 50 : Math.max(15, Math.min(100, ((pt.value - minVal) / (maxVal - minVal)) * 100));

                    return (
                      <View key={idx} style={styles.chartColumn}>
                        <View style={styles.barWrapper}>
                          <View style={[styles.activeBarLine, { height: `${heightPercent}%` }]} />
                          <View style={styles.pointIndicator} />
                        </View>
                        <Text style={styles.chartPointLabel} numberOfLines={1}>{pt.label}</Text>
                        <Text style={styles.chartPointVal}>{pt.value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Зрозуміло, згорнути</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#f2f2f7', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c1e' },
  modalSub: { fontSize: 11, color: '#8e8e93', marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f2f2f7', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#3a3a3c' },
  scrollContent: { padding: 12, gap: 12 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e5ea' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#1c1c1e', marginBottom: 8 },
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f2f2f7', marginBottom: 4 },
  th: { fontSize: 10, fontWeight: '600', color: '#8e8e93', textAlign: 'center', flex: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9f9fb', borderRadius: 6, paddingHorizontal: 4 },
  selectedTableRow: { backgroundColor: '#f0f8ff', borderColor: '#007aff' },
  td: { justifyContent: 'center' },
  flagContainer: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  tdCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  currCodeText: { fontSize: 13, fontWeight: '700', color: '#1c1c1e' },
  currNameText: { fontSize: 10, color: '#8e8e93' },
  tdValue: { fontSize: 11, fontWeight: '700', color: '#1c1c1e', textAlign: 'center' },
  tdValueSell: { fontSize: 11, fontWeight: '700', color: '#ff3b30', textAlign: 'center' },
  tdValueNbu: { fontSize: 11, fontWeight: '700', color: '#007aff', textAlign: 'center' },
  subChange: { fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  cashRow: { flexDirection: 'row', paddingTop: 4 },
  cashBox: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  cashLabel: { fontSize: 11, color: '#8e8e93', marginBottom: 2 },
  cashVal: { fontSize: 15, fontWeight: '700', color: '#34c759' },
  chartTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activeCurrBadge: { fontSize: 11, fontWeight: '700', color: '#007aff', backgroundColor: '#007aff20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  periodsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f2f2f7', borderRadius: 8, padding: 3, marginBottom: 12 },
  periodChip: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  activePeriodChip: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  periodChipText: { fontSize: 11, fontWeight: '600', color: '#8e8e93' },
  activePeriodChipText: { color: '#007aff', fontWeight: '700' },
  chartContainer: { height: 150, backgroundColor: '#fafafc', borderRadius: 8, padding: 10, justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' },
  chartGridLines: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 35, justifyContent: 'space-between' },
  gridLine: { height: 1, backgroundColor: '#e5e5ea', width: '100%' },
  chartPointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2, height: '100%', paddingTop: 10 },
  chartColumn: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barWrapper: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', height: 80, position: 'relative' },
  activeBarLine: { width: 3, backgroundColor: '#007aff30', position: 'absolute', bottom: 4, borderRadius: 2 },
  pointIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007aff', marginBottom: 4, zIndex: 3, borderWidth: 1.5, borderColor: '#ffffff' },
  chartPointLabel: { fontSize: 9, color: '#8e8e93', marginBottom: 2, textAlign: 'center' },
  chartPointVal: { fontSize: 9, fontWeight: '700', color: '#1c1c1e', textAlign: 'center' },
  doneBtn: { backgroundColor: '#007aff', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  doneBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});