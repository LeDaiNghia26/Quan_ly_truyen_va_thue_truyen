import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PriceText({ label, value }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{Number(value).toLocaleString('vi-VN')}₫</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginRight: 14 },
  label: { fontSize: 11, color: '#94a3b8' },
  value: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
});