import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api';
import { C, fmtVND, fmtDate } from '../theme';

export default function RentalsScreen({ navigation }) {
  const [tab, setTab] = useState('renting');
  const [data, setData] = useState({ dang_thue: [], tong_coc_dang_giu: 0, lich_su_tra: [], lich_su_mua: [] });
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/khach-hang/me/thue');
      setData(res.data);
    } catch (e) {
      console.warn(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const RentingCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.title}>{item.ten_truyen}</Text>
        {item.so_ngay_tre > 0 && <Text style={styles.overdue}>Trễ {item.so_ngay_tre} ngày</Text>}
      </View>
      <Text style={styles.meta}>Thuê từ: {fmtDate(item.ngay_thue)}</Text>
      <Text style={styles.meta}>Hạn trả: {fmtDate(item.ngay_hen_tra)}{item.phi_tre_uoc_tinh > 0 ? ` (phạt ~${fmtVND(item.phi_tre_uoc_tinh)})` : ''}</Text>
      <Text style={styles.price}>Tiền cọc giữ: {fmtVND(item.tien_coc)}</Text>
      {item.ma_truyen != null && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => navigation.navigate('Đánh giá truyện', { truyenId: item.ma_truyen, tenTruyen: item.ten_truyen })}
        >
          <Text style={styles.reviewBtnText}>⭐ Đánh giá truyện</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const HistoryCard = ({ item, type }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.title}>{item.ten_truyen}</Text>
        <Text style={[styles.badge, { backgroundColor: type === 'mua' ? '#dbeafe' : '#dcfce7', color: type === 'mua' ? C.primary : C.success }]}>{type === 'mua' ? 'Mua' : 'Thuê'}</Text>
      </View>
      <Text style={styles.meta}>{type === 'mua' ? `Ngày mua: ${fmtDate(item.ngay_ban)}` : `Ngày trả: ${fmtDate(item.ngay_tra)}`}</Text>
      {item.thanh_tien && <Text style={styles.price}>Thanh toán: {fmtVND(item.thanh_tien)}</Text>}
      {item.phi_phat_sinh > 0 && <Text style={styles.overdue}>Phạt: {fmtVND(item.phi_phat_sinh)}</Text>}
      {item.tien_coc > 0 && <Text style={styles.meta}>Cọc: {fmtVND(item.tien_coc)}</Text>}
      {item.ma_truyen != null && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => navigation.navigate('Đánh giá truyện', { truyenId: item.ma_truyen, tenTruyen: item.ten_truyen })}
        >
          <Text style={styles.reviewBtnText}>⭐ Đánh giá truyện</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sách đang thuê & Lịch sử</Text>
      <View style={styles.tabs}>
        {[['renting', 'Đang thuê'], ['history', 'Lịch sử']].map(([k, l]) => (
          <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabOn]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : tab === 'renting' ? (
        <FlatList
          data={data.dang_thue}
          keyExtractor={(i, idx) => `r${idx}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={data.tong_coc_dang_giu > 0 && <Text style={styles.total}>💰 Tổng tiền cọc đang giữ: {fmtVND(data.tong_coc_dang_giu)}</Text>}
          ListEmptyComponent={<Text style={styles.empty}>Không có sách nào đang thuê.</Text>}
          renderItem={({ item }) => <RentingCard item={item} />}
        />
      ) : (
        <FlatList
          data={[...data.lich_su_tra.map((x) => ({ ...x, type: 'thue' })), ...data.lich_su_mua.map((x) => ({ ...x, type: 'mua' }))].sort((a, b) => new Date(b.ngay_tra || b.ngay_ban || 0) - new Date(a.ngay_tra || a.ngay_ban || 0))}
          keyExtractor={(i, idx) => `h${idx}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có lịch sử.</Text>}
          renderItem={({ item }) => <HistoryCard item={item} type={item.type} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  heading: { fontSize: 20, fontWeight: '800', color: C.text, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginHorizontal: 16, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabOn: { backgroundColor: C.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: C.sub },
  tabTextOn: { color: '#fff' },
  list: { padding: 16, paddingTop: 4 },
  total: { color: C.vip, fontWeight: '700', marginBottom: 10, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' },
  meta: { fontSize: 13, color: C.sub, marginTop: 6 },
  price: { fontSize: 13, fontWeight: '700', color: C.danger, marginTop: 6 },
  overdue: { fontSize: 12, color: C.danger, fontWeight: '700' },
  reviewBtn: { marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  reviewBtnText: { color: C.primary, fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', color: C.muted, marginTop: 50 },
});