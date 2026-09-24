import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api';
import { C, fmtDate } from '../theme';

const ICON = { tra_sach: '⏰', dat_truoc: '📦', khuyen_mai: '🎟️' };
const COLOR = { tra_sach: C.danger, dat_truoc: C.primary, khuyen_mai: C.accent };

export default function NotificationsScreen() {
  const [list, setList] = useState([]);
  const [chuaDoc, setChuaDoc] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/khach-hang/me/thong-bao');
      setList(res.data.thong_bao || []);
      setChuaDoc(res.data.so_chua_doc || 0);
    } catch (e) {
      console.warn(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function read(item) {
    if (item.da_doc) return;
    setList((l) => l.map((x) => (x.id === item.id ? { ...x, da_doc: 1 } : x)));
    setChuaDoc((n) => Math.max(0, n - 1));
    api.put(`/khach-hang/me/thong-bao/${item.id}/read`).catch(() => {});
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Có {chuaDoc} thông báo chưa đọc</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : <Text style={styles.empty}>Chưa có thông báo.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, !item.da_doc && styles.cardNew]} onPress={() => read(item)}>
            <Text style={styles.icon}>{ICON[item.loai] || '🔔'}</Text>
            <View style={styles.body}>
              <View style={styles.top}>
                <Text style={[styles.title, !item.da_doc && styles.titleNew]}>{item.tieu_de}</Text>
                {!item.da_doc && <View style={styles.dot} />}
              </View>
              <Text style={styles.text}>{item.noi_dung}</Text>
              <Text style={styles.date}>{fmtDate(item.ngay_tao)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  hint: { fontSize: 13, color: C.sub, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardNew: { backgroundColor: '#eef2ff' },
  icon: { fontSize: 22, marginRight: 12, marginTop: 2 },
  body: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  titleNew: { color: C.primary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger, marginLeft: 6 },
  text: { fontSize: 13, color: C.sub, marginTop: 4, lineHeight: 19 },
  date: { fontSize: 11, color: C.muted, marginTop: 8 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 50 },
});