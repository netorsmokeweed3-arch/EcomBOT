import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AIReport } from '../types/aiReport';

interface AIReportViewProps {
  report: AIReport;
}

export default function AIReportView({ report }: AIReportViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Звіт ШІ</Text>

      <Row label="Клієнт" value={report.customerName} />
      <Row label="Телефон" value={report.phone} />
      <Row label="Місто" value={report.city} />
      <Row label="Відділення НП" value={report.postOffice} />
      <Row label="Статус" value={report.orderStatus} />

      <Text style={styles.sectionTitle}>Товари</Text>
      {report.products.length > 0 ? (
        report.products.map((product, index) => (
          <Text key={`${product}-${index}`} style={styles.listItem}>• {product}</Text>
        ))
      ) : (
        <Text style={styles.muted}>Товари не вказано</Text>
      )}

      <Text style={styles.sectionTitle}>Аналіз переписки</Text>
      <Text style={styles.bodyText}>{report.chatAnalysis || 'Переписка відсутня'}</Text>

      {report.recommendations.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Рекомендації</Text>
          {report.recommendations.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.listItem}>• {item}</Text>
          ))}
        </>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f9f9fb', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#e5e5ea' },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontSize: 14, color: '#8e8e93', width: 120 },
  value: { flex: 1, fontSize: 14, color: '#1c1c1e', fontWeight: '500' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#3a3a3c', marginTop: 10, marginBottom: 4 },
  listItem: { fontSize: 14, color: '#3a3a3c', marginBottom: 2 },
  bodyText: { fontSize: 14, color: '#3a3a3c', lineHeight: 20 },
  muted: { fontSize: 14, color: '#8e8e93' },
});
