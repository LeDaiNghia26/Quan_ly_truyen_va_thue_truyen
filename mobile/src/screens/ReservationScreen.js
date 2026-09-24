import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { C, fmtVND } from '../theme';

export default function ReservationScreen({ route, navigation }) {
  const { truyen, loai } = route.params;
  const { user, refreshProfile } = useAuth();
  const profile = user?.profile;

  const [hanNhan, setHanNhan] = useState(new Date());
  const [khungGio, setKhungGio] = useState('');
  const [suKien, setSuKien] = useState([]);
  const [maSuKien, setMaSuKien] = useState(null);
  const [diem, setDiem] = useState(null);
  const [cfg, setCfg] = useState({ hang_thanh_vien: [], quy_doi: [] });
  const [showDate, setShowDate] = useState(false);
  const [nut, setNut] = useState('');

  useEffect(() => {
    api.get('/su-kien-giam-gia/cong-khai').then((r) => setSuKien(r.data)).catch(() => {});
    api.get('/cau-hinh').then((r) => setCfg(r.data)).catch(() => {});
    setNut(loai === 'thue' ? 'Xác nhận đặt trước thuê' : 'Xác nhận đặt trước mua');
  }, []);

  const tienMoiDiem = Number((cfg.quy_doi || []).find((x) => x.ten_quy_tac === 'tien_moi_diem')?.gia_tri) || 200;

  const kq = useMemo(() => {
    const giaGoc = loai === 'thue' ? Number(truyen.gia_thue) : Number(truyen.gia_ban);
    const tier = (cfg.hang_thanh_vien || []).find((h) => h.ma_hang === profile?.hang_thanh_vien);
    const phanTram = loai === 'mua' ? Number(tier?.phan_tram_giam || 0) : 0;
    const giamHang = (giaGoc * phanTram) / 100;
    const sauHang = giaGoc - giamHang;
    const sk = suKien.find((s) => s.id === maSuKien);
    let giamVoucher = 0;
    if (sk) giamVoucher = sk.kieu_giam === 'phan_tram' ? (sauHang * Number(sk.gia_tri)) / 100 : Number(sk.gia_tri);
    const conLai = Math.max(0, sauHang - giamVoucher);
    const vip = profile?.hang_thanh_vien === 'vip';
    const diemCo = Number(profile?.diem_tich_luy) || 0;
    const diemToiDa = Math.min(diemCo, Math.floor(conLai / tienMoiDiem));
    const diemMuon = Math.min(Number(diem) || 0, diemCo);
    let diemDung = 0;
    if (vip && loai === 'mua' && diemMuon > 0) diemDung = Math.min(diemMuon, diemToiDa);
    const giamDiem = diemDung * tienMoiDiem;
    const tong = Math.max(0, giaGoc - giamHang - giamVoucher - giamDiem);
    return { gia: giaGoc, giamHang, giamVoucher, giamDiem, tong, vip, diemDung, diemToiDa };
  }, [loai, truyen, suKien, maSuKien, diem, profile, cfg, tienMoiDiem]);

  async function submit() {
    if (!hanNhan) return Alert.alert('Nhắc nhở', 'Chọn ngày hẹn đến quầy.');
    try {
      const res = await api.post('/dat-truoc', {
        ma_truyen: truyen.id,
        loai,
        han_nhan: `${hanNhan.getFullYear()}-${String(hanNhan.getMonth() + 1).padStart(2, '0')}-${String(hanNhan.getDate()).padStart(2, '0')}`,
        khung_gio: khungGio || undefined,
        ma_su_kien: maSuKien || undefined,
        diem_su_dung: loai === 'mua' && kq.diemDung > 0 ? kq.diemDung : undefined,
      });
      await refreshProfile().catch(() => {});
      navigation.replace('Mã đặt trước', { id: res.data.id, chiTiet: res.data.chi_tiet });
    } catch (e) {
      Alert.alert('Không đặt được', getErrorMessage(e));
    }
  }

  const line = (label, val, color) => (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineVal, color && { color }]}>{val}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.sumTitle}>Đặt trước: {truyen.ten_truyen}</Text>
        <Text style={styles.sumSub}>{truyen.tac_gia}</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDate(true)}>
          <Text style={styles.dateLabel}>Ngày hẹn đến quầy</Text>
          <Text style={styles.dateVal}>{hanNhan.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>Khung giờ (tùy chọn)</Text>
        <View style={styles.timeRow}>
          {['09:00-11:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'].map((k) => (
            <TouchableOpacity key={k} style={[styles.timeChip, khungGio === k && styles.timeChipOn]} onPress={() => setKhungGio(khungGio === k ? '' : k)}>
              <Text style={[styles.timeChipText, khungGio === k && styles.timeChipTextOn]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <DateTimePickerModal isVisible={showDate} mode="date" minimumDate={new Date()} maximumDate={new Date(Date.now() + 30 * 864e5)} onConfirm={(d) => { setHanNhan(d); setShowDate(false); }} onCancel={() => setShowDate(false)} />
      </View>

      <Text style={styles.section}>Mã giảm giá / sự kiện</Text>
      <View style={styles.card}>
        {suKien.length === 0 && <Text style={styles.empty}>Hiện không có chương trình khuyến mãi.</Text>}
        {suKien.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.opt, maSuKien === s.id && styles.optOn]} onPress={() => setMaSuKien(maSuKien === s.id ? null : s.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{s.ten_su_kien}</Text>
              <Text style={styles.optDesc}>Hết ngày {String(s.ngay_ket_thuc).slice(0, 10)}</Text>
            </View>
            <Text style={[styles.optVal, maSuKien === s.id && styles.optValOn]}>{s.kieu_giam === 'phan_tram' ? `−${s.gia_tri}%` : `−${fmtVND(s.gia_tri)}`}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {kq.vip && loai === 'mua' && (
        <>
          <Text style={styles.section}>Điểm ưu đãi ({tienMoiDiem.toLocaleString('vi-VN')}đ/điểm)</Text>
          <View style={styles.card}>
            {line('Số điểm dùng tối đa', String(kq.diemToiDa), C.vip)}
            <View style={styles.diemRow}>
              {[0, 5, 10, 20, 50].filter((x) => x <= (Number(profile?.diem_tich_luy) || 0)).map((x) => (
                <TouchableOpacity key={x} style={[styles.timeChip, diem === x && styles.timeChipOn]} onPress={() => setDiem(diem === x ? null : x)}>
                  <Text style={[styles.timeChipText, diem === x && styles.timeChipTextOn]}>{x === 0 ? 'Không dùng' : `${x} điểm`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      <Text style={styles.section}>Dự kiến phải trả tại quầy</Text>
      <View style={styles.card}>
        {line(loai === 'thue' ? 'Giá thuê / ngày' : 'Giá bán', fmtVND(kq.gia))}
        {kq.giamHang > 0 && line('Giảm hạng thành viên', `−${fmtVND(kq.giamHang)}`, C.success)}
        {kq.giamVoucher > 0 && line('Giảm từ sự kiện', `−${fmtVND(kq.giamVoucher)}`, C.success)}
        {kq.giamDiem > 0 && line('Giảm từ điểm VIP', `−${fmtVND(kq.giamDiem)}`, C.vip)}
        <View style={styles.divider} />
        {line('Tổng thanh toán', fmtVND(kq.tong), C.danger)}
        {loai === 'thue' && line('Tiền cọc (hoàn trả)', fmtVND(truyen.tien_coc || truyen.gia_ban), C.sub)}
        <Text style={styles.note}>Mang CCCD đến quầy trong ngày/hengiờ đã chọn. Quầy sẽ liên hệ để xác nhận sách sẵn sàng.</Text>
      </View>

      <TouchableOpacity style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>{nut}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 30 },
  summary: { backgroundColor: C.primary, borderRadius: 16, padding: 16 },
  sumTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sumSub: { color: '#c7d2fe', fontSize: 13, marginTop: 2 },
  dateBtn: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 12 },
  dateLabel: { color: '#c7d2fe', fontSize: 12, marginTop: 12 },
  dateVal: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  timeChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  timeChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  timeChipText: { color: C.sub, fontSize: 12, fontWeight: '600' },
  timeChipTextOn: { color: '#fff' },
  section: { fontSize: 15, fontWeight: '700', color: C.text, marginTop: 18, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  opt: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, marginBottom: 8 },
  optOn: { borderColor: C.primary, backgroundColor: '#eef2ff' },
  optTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  optDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  optVal: { fontSize: 16, fontWeight: '800', color: C.accent },
  optValOn: { color: C.primary },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lineLabel: { fontSize: 14, color: C.sub },
  lineVal: { fontSize: 14, fontWeight: '700', color: C.text },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 8 },
  note: { fontSize: 12, color: C.muted, lineHeight: 18, marginTop: 10 },
  empty: { color: C.muted, fontSize: 13 },
  diemRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  submit: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});