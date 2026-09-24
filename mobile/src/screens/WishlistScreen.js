import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api';
import { C, fmtVND } from '../theme';

export default function WishlistScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/yeu-thich');
      setList(res.data || []);
    } catch (e) {
      console.warn(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function remove(item) {
    await api.post('/yeu-thich/toggle', { ma_truyen: item.ma_truyen });
    setList((l) => l.filter((x) => x.ma_truyen !== item.ma_truyen));
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.ma_truyen)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : <Text style={styles.empty}>Bạn chưa yêu thích truyện nào.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Chi tiết truyện', { truyenId: item.ma_truyen })}>
            <View style={styles.cover}><Text style={styles.coverText}>{(item.ten_truyen || '?').slice(0, 2)}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>{item.ten_truyen}</Text>
              <Text style={styles.author}>{item.tac_gia}</Text>
              <Text style={styles.price}>
                {Number(item.gia_thue) > 0 ? `Thuê ${fmtVND(item.gia_thue)}/ngày · ` : ''}Bán {fmtVND(item.gia_ban)}
              </Text>
            </View>
            <TouchableOpacity style={styles.rm} onPress={() => remove(item)}>
              <Text style={styles.rmText}>Bỏ</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, alignItems: 'center' },
  cover: { width: 52, height: 72, borderRadius: 8, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  coverText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  title: { fontSize: 15, fontWeight: '700', color: C.text },
  author: { fontSize: 12, color: C.sub, marginTop: 3 },
  price: { fontSize: 13, color: C.danger, fontWeight: '700', marginTop: 5 },
  rm: { padding: 10 },
  rmText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: C.muted, marginTop: 50 },
});