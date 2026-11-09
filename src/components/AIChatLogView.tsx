// src/components/AIChatLogView.tsx
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

interface AIChatLogViewProps {
  readonly chatSummary?: string;
  readonly aiSummary?: string;
}

function AIChatLogView({ chatSummary, aiSummary }: AIChatLogViewProps) {
  const { theme } = useAppTheme();

  if (!chatSummary && !aiSummary) return null;

  return (
    <View style={[styles.container, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
      {aiSummary ? (
        <View style={[styles.summaryBox, { backgroundColor: 'rgba(0, 122, 255, 0.08)', borderColor: 'rgba(0, 122, 255, 0.2)', borderWidth: 1 }]}>
          <Text style={[styles.title, { color: theme.primary }]}>Аналіз замовлення ШІ</Text>
          <Text style={[styles.text, { color: theme.textPrimary }]}>{aiSummary}</Text>
        </View>
      ) : null}

      {chatSummary ? (
        <View style={[styles.chatBox, { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1 }]}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>Діалог ШІ з покупцем</Text>
          <View style={[styles.bubble, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.06)' }]}>
            <Text style={[styles.chatText, { color: theme.textSecondary }]}>{chatSummary}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default memo(AIChatLogView);

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  summaryBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  chatBox: {
    borderRadius: 10,
    padding: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubble: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
  },
});