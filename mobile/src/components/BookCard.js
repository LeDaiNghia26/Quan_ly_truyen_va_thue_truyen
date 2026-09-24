import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { C } from '../theme';
import { imageUrl } from '../api';

function Cover({ item, size = 'md' }) {
  const dim = size === 'lg' ? { width: 120, height: 164 } : size === 'sm' ? { width: 48, height: 66 } : { width: 84, height: 116 };
  const uri = imageUrl(item.anh_bia);
  if (uri) {
    return <Image source={{ uri }} style={[styles.cover, dim]} resizeMode="cover" />;
  }
  return (
    <View style={[styles.cover, dim, styles.coverFallback]}>
      <Text style={styles.coverText}>{(item.ten_truyen || '?').slice(0, 2)}</Text>
    </View>
  );
}

export function BookCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Cover item={item} />
      <Text style={styles.title} numberOfLines={2}>{item.ten_truyen}</Text>
      <Text style={styles.author} numberOfLines={1}>{item.tac_gia}</Text>
      <Text style={styles.price} numberOfLines={1}>
        {Number(item.gia_thue) > 0 ? `Thuê ${Number(item.gia_thue).toLocaleString('vi-VN')}đ/ngày` : `Bán ${Number(item.gia_ban).toLocaleString('vi-VN')}đ`}
      </Text>
    </TouchableOpacity>
  );
}

export function StarRating({ value, size = 13 }) {
  const v = Math.round(Number(value) * 2) / 2;
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: size, color: v >= i ? C.accent : C.line }}>★</Text>
      ))}
    </View>
  );
}

export function Empty({ text }) {
  return <Text style={styles.empty}>{text || 'Không có dữ liệu'}</Text>;
}

const styles = StyleSheet.create({
  card: { width: 122, marginRight: 12, marginBottom: 6 },
  cover: { borderRadius: 10, backgroundColor: '#c7d2fe' },
  coverFallback: { backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  coverText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  title: { fontSize: 13, fontWeight: '600', color: C.text, marginTop: 6 },
  author: { fontSize: 11, color: C.sub, marginTop: 2 },
  price: { fontSize: 12, color: C.danger, fontWeight: '700', marginTop: 4 },
  stars: { flexDirection: 'row' },
  empty: { textAlign: 'center', color: C.muted, marginTop: 48, fontSize: 14 },
});

export default Cover;