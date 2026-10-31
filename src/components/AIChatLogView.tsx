import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AIChatLogViewProps {
  readonly chatSummary?: string;
  readonly aiSummary?: string;
}

function AIChatLogView({ chatSummary, aiSummary }: AIChatLogViewProps) {
  if (!chatSummary && !aiSummary) return null;

  return (
    <View style={styles.container}>
      {aiSummary ? (
        <View style={styles.summaryBox}>
          <Text style={styles.title}>🤖 Аналіз замовлення ШІ:</Text>
          <Text style={styles.text}>{aiSummary}</Text>
        </View>
      ) : null}

      {chatSummary ? (
        <View style={styles.chatBox}>
          <Text style={styles.title}>💬 Діалог ШІ з покупцем:</Text>
          <View style={styles.bubble}>
            <Text style={styles.chatText}>{chatSummary}</Text>
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
    borderTopColor: '#f2f2f7',
  },
  summaryBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  chatBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    padding: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: '#3a3a3c',
    lineHeight: 18,
  },
  chatText: {
    fontSize: 13,
    color: '#0040dd',
    lineHeight: 18,
  },
  bubble: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#d0e1fd',
  },
});