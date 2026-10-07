import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage, imageUrl } from '../api';
import { StarRating } from '../components/BookCard';
import { useAuth } from '../AuthContext';
import { C, fmtVND, fmtDate } from '../theme';

export default function DetailScreen({ route, navigation }) {
  const { truyenId } = route.params;
  const { user } = useAuth();
  const [t, setT] = useState(null);
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);
  const daDangNhap = !!user;

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [detail, favRes] = await Promise.all([
        api.get(`/truyen/${truyenId}`),
        daDangNhap ? api.get('/yeu-thich') : Promise.resolve({ data: [] }),
      ]);
      setT(detail.data);
      setFav(favRes.data.some((f) => f.ma_truyen === Number(truyenId)));
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [truyenId, daDangNhap]);

  // Refetch mỗi lần quay lại màn hình để tồn kho không bị cũ
  // (ví dụ vừa đặt trước xong, bản sao đã chuyển sang "đang giữ")
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  async function toggleFav() {
    if (!user) return navigation.navigate('Đăng nhập');
    try {
      const r = await api.post('/yeu-thich/toggle', { ma_truyen: truyenId });
      setFav(r.data.yeu_thich);
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    }
  }

  if (!t) return <View style={styles.center}><ActivityIndicator /></View>;

  // Ưu tiên số liệu tồn kho do backend tính sẵn; fallback đếm từ danh sách bản sao
  const con = t.so_san_sang != null
    ? Number(t.so_san_sang)
    : t.ban_sao.filter((b) => b.trang_thai === 'san_sang').length;
  const hetHang = con === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {imageUrl(t.anh_bia) ? (
          <Image source={{ uri: imageUrl(t.anh_bia) }} style={styles.coverBox} resizeMode="cover" />
        ) : (
          <View style={styles.coverBox}>
            <Text style={styles.coverText}>{(t.ten_truyen || '?').slice(0, 2)}</Text>
          </View>
        )}
        <View style={styles.heroInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t.ten_truyen}</Text>
            {hetHang && (
              <View style={styles.outBadge}>
                <Text style={styles.outBadgeText}>Hết hàng</Text>
              </View>
            )}
          </View>
          <Text style={styles.author}>✍️ {t.tac_gia}</Text>
          <View style={styles.infoLine}><Text style={styles.infoLabel}>Thể loại:</Text><Text style={styles.infoVal}> {t.the_loai_ten || '—'}</Text></View>
          <View style={styles.infoLine}><Text style={styles.infoLabel}>Loại:</Text><Text style={styles.infoVal}> {{ TRUYEN_TRANH: 'Truyện tranh', TIEU_THUYET: 'Tiểu thuyết', TRUYEN_NGAN: 'Truyện ngắn', LIGHT_NOVEL: 'Light Novel' }[t.loai] || '—'}</Text></View>
          <View style={styles.infoLine}><Text style={styles.infoLabel}>NXB:</Text><Text style={styles.infoVal}> {t.nha_xuat_ban} ({t.nam_xuat_ban})</Text></View>
          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>Đánh giá:</Text>
            <StarRating value={t.danh_gia_tb} />
            <Text style={styles.ratingText}> {Number(t.danh_gia_tb || 0).toFixed(1)} ({t.so_danh_gia} lượt)</Text>
          </View>
        </View>
      </View>
      <View style={styles.statRow}>
        <View style={styles.stat}><Text style={styles.statNum}>{con}</Text><Text style={styles.statLabel}>còn sách</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{t.luot_thue}</Text><Text style={styles.statLabel}>lượt thuê</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{t.luot_mua}</Text><Text style={styles.statLabel}>lượt mua</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Giá tại quầy</Text>
      <View style={styles.priceCard}>
        {Number(t.gia_thue) > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Thuê một ngày</Text>
            <Text style={styles.priceValblue}>{fmtVND(t.gia_thue)}</Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Mua / đặt cọc (thuê)</Text>
          <Text style={styles.priceValRed}>{fmtVND(t.gia_ban)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Bản sẵn sàng</Text>
          <Text style={[styles.priceValRed, hetHang && styles.priceValGray]}>{hetHang ? 'Hết hàng' : `Còn ${con} bản`}</Text>
        </View>
        <Text style={styles.hint}>Tiền cọc sẽ hoàn lại 100% khi bạn trả sách đúng hạn với tình trạng tốt.</Text>
      </View>

      <Text style={styles.sectionTitle}>Mô tả</Text>
      <Text style={styles.desc}>{t.mo_ta || 'Chưa có mô tả.'}</Text>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Đánh giá từ bạn đọc</Text>
        <TouchableOpacity onPress={() => (user ? navigation.navigate('Đánh giá truyện', { truyenId: t.id, tenTruyen: t.ten_truyen }) : navigation.navigate('Đăng nhập'))}>
          <Text style={styles.reviewLink}>✍️ Đánh giá</Text>
        </TouchableOpacity>
      </View>
      {!t.danh_gia?.length && <Text style={styles.empty}>Chưa có đánh giá nào.</Text>}
      {t.danh_gia?.map((d) => (
        <View key={d.id} style={styles.review}>
          <View style={styles.reviewTop}>
            <Text style={styles.reviewWho}>{d.ho_ten || 'Khách'}</Text>
            <StarRating value={d.so_sao} />
          </View>
          <Text style={styles.reviewText}>{d.noi_dung}</Text>
          <Text style={styles.reviewDate}>{fmtDate(d.ngay_danh_gia)}</Text>
        </View>
      ))}

      <View style={styles.cta}>
        {hetHang ? (
          <View style={[styles.btn, styles.btnDisabled]}>
            <Text style={styles.btnText}>Hết hàng — chưa có bản sẵn sàng</Text>
          </View>
        ) : (
          <>
            {Number(t.gia_thue) > 0 && (
              <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={() => navigation.navigate('Đặt trước', { truyen: t, loai: 'thue' })}>
                <Text style={styles.btnText}>Thuê {fmtVND(t.gia_thue)}/ngày</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={() => navigation.navigate('Đặt trước', { truyen: t, loai: 'mua' })}>
              <Text style={styles.btnText}>Mua {fmtVND(t.gia_ban)}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <TouchableOpacity style={styles.favBtn} onPress={toggleFav}>
        <Text style={styles.favText}>{fav ? '❤️ Đã yêu thích' : '🤍 Thêm vào yêu thích'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  hero: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  coverBox: { width: 110, height: 148, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  coverText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  heroInfo: { flex: 1, marginLeft: 14 },
  title: { fontSize: 19, fontWeight: '800', color: C.text, flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outBadge: { backgroundColor: C.danger, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  outBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  author: { fontSize: 13, color: C.sub, marginTop: 4 },
  infoLine: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoLabel: { fontSize: 13, color: C.sub },
  infoVal: { fontSize: 13, color: C.text, fontWeight: '600' },
  ratingText: { fontSize: 13, color: C.sub },
  statRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginTop: 12, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: 12, color: C.sub, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewLink: { color: C.primary, fontWeight: '700', fontSize: 13, marginTop: 20 },
  priceCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  priceLabel: { fontSize: 14, color: C.text },
  priceValblue: { fontSize: 15, fontWeight: '800', color: C.primary },
  priceValRed: { fontSize: 15, fontWeight: '800', color: C.danger },
  priceValGray: { color: C.muted },
  hint: { fontSize: 12, color: C.muted, marginTop: 8 },
  desc: { fontSize: 14, lineHeight: 22, color: C.sub },
  review: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewWho: { fontSize: 14, fontWeight: '700', color: C.text },
  reviewText: { fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 20 },
  reviewDate: { fontSize: 11, color: C.muted, marginTop: 6 },
  empty: { color: C.muted, fontSize: 13 },
  cta: { flexDirection: 'row', gap: 10, marginTop: 22 },
  btn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnBlue: { backgroundColor: C.primary },
  btnRed: { backgroundColor: C.danger },
  btnDisabled: { backgroundColor: '#cbd5e1' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  favBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 12 },
  favText: { color: C.primary, fontWeight: '600', fontSize: 14 },
});