import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../AuthContext';
import api from '../api';
import { C, fmtDate, HANG_MAP } from '../theme';

export default function VipScreen() {
  const { user, refreshProfile } = useAuth();
  const p = user?.profile;
  const [refreshing, setRefreshing] = useState(false);
  const [diem, setDiem] = useState([]);
  const [cfg, setCfg] = useState({ hang_thanh_vien: [], quy_doi: [] });

  async function load() {
    setRefreshing(true);
    try {
      const [prof, cf] = await Promise.all([
        refreshProfile(),
        api.get('/cau-hinh').then((r) => r.data).catch(() => ({ hang_thanh_vien: [], quy_doi: [] })),
      ]);
      setDiem(prof.lich_su_diem || []);
      setCfg(cf);
    } finally {
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const qd = (ten) => Number(cfg.quy_doi.find((x) => x.ten_quy_tac === ten)?.gia_tri) || 0;
  const tienMoiDiem = qd('tien_moi_diem') || 200;

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <View style={[styles.hero, { backgroundColor: p?.hang_thanh_vien === 'vip' ? C.vip : C.primary }]}>
              <Text style={styles.hang}>{HANG_MAP[p?.hang_thanh_vien] || 'Thành viên thường'}</Text>
              <Text style={styles.diemNum}>{Number(p?.diem_tich_luy) || 0}</Text>
              <Text style={styles.diemLabel}>điểm hiện tại (dùng để thanh toán)</Text>
              <View style={styles.pill}><Text style={styles.pillText}>Tổng điểm tích lũy: {Number(p?.tong_diem_tich_luy) || 0} — hạng được xét theo tổng tích lũy, không bị giảm khi tiêu điểm</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>Tích 1 điểm cho mỗi 1.000đ giao dịch (thuê/mua)</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>Quy đổi điểm: 1 điểm = {tienMoiDiem.toLocaleString('vi-VN')}đ khi thanh toán (hạng VIP)</Text></View>
            </View>

            <Text style={styles.section}>Hạng thành viên & ưu đãi</Text>
            <View style={styles.card}>
              {cfg.hang_thanh_vien.length === 0 && <Text style={styles.empty}>Chưa có cấu hình hạng.</Text>}
              {cfg.hang_thanh_vien.map((h, i) => (
                <View key={h.id} style={[styles.tierRow, i === cfg.hang_thanh_vien.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierName}>{h.ten_hang}</Text>
                    <Text style={styles.tierSub}>Từ {Number(h.nguong_diem).toLocaleString('vi-VN')} điểm</Text>
                  </View>
                  <Text style={[styles.tierGiam, h.ma_hang === p?.hang_thanh_vien && { color: C.vip }]}>
                    {Number(h.phan_tram_giam) > 0 ? `-${Number(h.phan_tram_giam)}%` : '—'}
                  </Text>
                  {h.ma_hang === p?.hang_thanh_vien && <Text style={styles.current}>Hiện tại</Text>}
                </View>
              ))}
            </View>

            <Text style={styles.section}>Lịch sử điểm</Text>
            {diem.length === 0 && <Text style={styles.empty}>Chưa có giao dịch điểm nào.</Text>}
          </View>
        }
        data={diem}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={[styles.delta, Number(item.so_diem) >= 0 ? styles.pos : styles.neg]}>
                {Number(item.so_diem) >= 0 ? `+${item.so_diem}` : item.so_diem}
              </Text>
              <Text style={styles.date}>{fmtDate(item.ngay_tao)}</Text>
            </View>
            <Text style={styles.reason}>{item.ly_do}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  hero: { borderRadius: 18, padding: 22, marginBottom: 6 },
  hang: { color: '#fbbf24', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  diemNum: { color: '#fff', fontSize: 46, fontWeight: '900', marginTop: 6 },
  diemLabel: { color: '#e0e7ff', fontSize: 14, marginBottom: 14 },
  pill: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10, padding: 10, marginBottom: 6 },
  pillText: { color: '#fff', fontSize: 12, lineHeight: 18 },
  section: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 10 },
  tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  tierName: { fontSize: 15, fontWeight: '700', color: C.text },
  tierSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  tierGiam: { fontSize: 16, fontWeight: '800', color: C.success, marginRight: 8 },
  current: { fontSize: 10, fontWeight: '700', color: '#fff', backgroundColor: C.vip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  delta: { fontSize: 18, fontWeight: '800' },
  pos: { color: C.success },
  neg: { color: C.danger },
  date: { fontSize: 12, color: C.muted },
  reason: { fontSize: 13, color: C.sub, marginTop: 6 },
  empty: { color: C.muted, fontSize: 13 },
});