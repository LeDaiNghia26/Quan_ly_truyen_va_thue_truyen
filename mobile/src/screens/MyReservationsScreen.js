import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api';
import { C, fmtDate, trangThaiDon } from '../theme';

const COLOR = { cho_nhan: C.accent, da_xac_nhan: C.success, da_huy: C.muted, qua_han: C.danger };

export default function MyReservationsScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/khach-hang/me/dat-truoc');
      setList(res.data || []);
    } catch (e) {
      console.warn(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đơn đặt trước của tôi</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 50 }} /> : <Text style={styles.empty}>Bạn chưa có đơn đặt trước nào.</Text>}
        renderItem={({ item }) => {
          const tt = trangThaiDon(item.trang_thai);
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Mã đặt trước', { id: item.id })}>
              <View style={styles.top}>
                <Text style={styles.id}>#{String(item.id).padStart(4, '0')} · {item.loai === 'thue' ? 'Thuê' : 'Mua'}</Text>
                <Text style={[styles.badge, { color: COLOR[item.trang_thai], backgroundColor: COLOR[item.trang_thai] + '1a' }]}>{tt}</Text>
              </View>
              <Text style={styles.books}>{item.danh_sach_truyen || '—'}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>Hẹn: {fmtDate(item.han_nhan)} {item.khung_gio ? `(${item.khung_gio})` : ''}</Text>
                {item.ten_su_kien && <Text style={styles.metaText}>🎟️ {item.ten_su_kien}</Text>}
              </View>
              <Text style={styles.hint}>Chạm để xem mã QR khi đến quầy →</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  title: { fontSize: 20, fontWeight: '800', color: C.text, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontSize: 14, fontWeight: '800', color: C.text },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, overflow: 'hidden' },
  books: { fontSize: 15, fontWeight: '700', color: C.text, marginTop: 10 },
  meta: { marginTop: 8, gap: 3 },
  metaText: { fontSize: 12, color: C.sub },
  hint: { fontSize: 12, color: C.primary, fontWeight: '600', marginTop: 10 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 50 },
});