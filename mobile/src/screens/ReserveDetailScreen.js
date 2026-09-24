import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import api, { getErrorMessage } from '../api';
import { C, fmtDate, trangThaiDon } from '../theme';

export default function ReserveDetailScreen({ route }) {
  const { id } = route.params;
  const [don, setDon] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [r, c] = await Promise.all([
        api.get(`/dat-truoc/${id}`),
        api.get('/cau-hinh').then((rr) => rr.data).catch(() => null),
      ]);
      setDon(r.data);
      setCfg(c);
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    }
  }

  useEffect(() => { load(); }, [id]);

  async function huy() {
    setBusy(true);
    try {
      await api.post(`/dat-truoc/${id}/huy`);
      await load();
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (!don) return <View style={styles.center}><ActivityIndicator /></View>;

  const qrData = JSON.stringify({ id: don.id, loai: don.loai, han_nhan: don.han_nhan, khung_gio: don.khung_gio || '', sach: don.danh_sach_truyen || '' });
  const coTheHuy = don.trang_thai === 'cho_nhan';

  // Giá cam kết: hiển thị ĐÚNG giá trị đã khóa lúc đặt (không đổi theo cấu hình hiện tại)
  const tienMoiDiem = Number((cfg?.quy_doi || []).find((x) => x.ten_quy_tac === 'tien_moi_diem')?.gia_tri) || 200;
  const giaGoc = Number(don.gia_goc || 0);
  const pctHang = Number(don.phan_tram_giam_hang || 0);
  const giamVoucher = Number(don.so_tien_giam || 0);
  const giamDiem = Number(don.diem_su_dung || 0) * tienMoiDiem;
  const giaCamKet = don.loai === 'thue'
    ? Math.max(0, giaGoc - giamVoucher)
    : Math.max(0, Math.round((giaGoc - (giaGoc * pctHang) / 100 - giamVoucher - giamDiem) * 100) / 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.qrCard}>
        <Text style={styles.badge} numberOfLines={1}>#{String(don.id).padStart(4, '0')} {don.loai === 'thue' ? 'THUÊ' : 'MUA'}</Text>
        <View style={styles.qrBox}>
          <QRCode value={qrData} size={Platform.OS === 'web' ? 200 : 190} color="#0f172a" backgroundColor="#ffffff" />
        </View>
        <Text style={styles.qrHint}>Đưa mã QR này cho nhân viên quầy khi nhận sách</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}><Text style={styles.lbl}>Trạng thái</Text><Text style={[styles.val, { color: don.trang_thai === 'cho_nhan' ? C.accent : C.success }]}>{trangThaiDon(don.trang_thai)}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>Truyện</Text><Text style={[styles.val, { flex: 1, textAlign: 'right' }]}>{don.danh_sach_truyen}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>Ngày hẹn</Text><Text style={styles.val}>{fmtDate(don.han_nhan)}</Text></View>
        {don.khung_gio && <View style={styles.row}><Text style={styles.lbl}>Khung giờ</Text><Text style={styles.val}>{don.khung_gio}</Text></View>}
        {don.ten_su_kien && <View style={styles.row}><Text style={styles.lbl}>Sự kiện</Text><Text style={styles.val}>{don.ten_su_kien}</Text></View>}
        {don.diem_su_dung > 0 && <View style={styles.row}><Text style={styles.lbl}>Điểm VIP dùng</Text><Text style={styles.val}>{don.diem_su_dung} điểm (giảm {giamDiem.toLocaleString('vi-VN')}đ)</Text></View>}
        {don.loai === 'thue' && <View style={styles.row}><Text style={styles.lbl}>Cọc giữ sách</Text><Text style={styles.val}>{Number(don.tien_coc || 0).toLocaleString('vi-VN')}đ</Text></View>}
        <View style={styles.row}><Text style={styles.lbl}>Đặt lúc</Text><Text style={styles.val}>{fmtDate(don.ngay_dat)}</Text></View>
        <View style={[styles.row, styles.camKetRow]}>
          <Text style={styles.lbl}>{don.loai === 'thue' ? 'Tiền thuê cam kết' : 'Số tiền trả tại quầy'}</Text>
          <Text style={styles.camKetVal}>{giaCamKet.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.stepTitle}>Các bước tiếp theo</Text>
        {[
          'Đến quầy trong khung giờ đã chọn.',
          'Đưa mã QR (hoặc số đơn) cho nhân viên.',
          'Nhận sách, nộp tiền thuê/mua và tiền cọc (nếu thuê).',
          'Trả sách đúng hạn để hoàn lại 100% tiền cọc.',
        ].map((s, i) => (
          <Text key={i} style={styles.step}>{i + 1}. {s}</Text>
        ))}
      </View>

      {coTheHuy && (
        <TouchableOpacity style={styles.huy} onPress={() => Alert.alert('Hủy đơn', 'Hủy đơn đặt trước này?', [{ text: 'Không' }, { text: 'Hủy đơn', style: 'destructive', onPress: huy }])} disabled={busy}>
          <Text style={styles.huyText}>{busy ? 'Đang hủy...' : 'Hủy đơn đặt trước'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  qrCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  badge: { fontSize: 15, fontWeight: '800', color: C.primary, textAlign: 'center' },
  qrBox: { marginVertical: 18, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 14 },
  qrHint: { color: C.sub, fontSize: 13, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  lbl: { fontSize: 14, color: C.sub },
  val: { fontSize: 14, fontWeight: '700', color: C.text },
  camKetRow: { borderTopWidth: 1, borderTopColor: C.line, marginTop: 4, paddingTop: 10 },
  camKetVal: { fontSize: 17, fontWeight: '900', color: C.success },
  stepTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8 },
  step: { fontSize: 13, color: C.sub, lineHeight: 22 },
  huy: { marginTop: 14, borderWidth: 1, borderColor: C.danger, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  huyText: { color: C.danger, fontWeight: '700' },
});