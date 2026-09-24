import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import api, { getErrorMessage } from '../api';
import { C } from '../theme';

const STARS = [1, 2, 3, 4, 5];

export default function ReviewScreen({ route, navigation }) {
  const { truyenId, tenTruyen } = route.params;
  const [sao, setSao] = useState(0);
  const [noiDung, setNoiDung] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/khach-hang/me/danh-gia');
      const mine = res.data.find((x) => Number(x.ma_truyen) === Number(truyenId));
      if (mine) {
        setSao(Number(mine.so_sao) || 0);
        setNoiDung(mine.noi_dung || '');
      }
    } catch (e) {
      // Mạng lỗi: vẫn để người dùng đánh giá, backend sẽ tự kiểm tra quyền
      console.warn(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [truyenId]);

  useEffect(() => { load(); }, [load]);

  const lbl = ['', 'Tệ', 'Không hay', 'Bình thường', 'Hay', 'Tuyệt vời'][sao];

  async function submit() {
    if (sao < 1) {
      Alert.alert('Chưa chọn sao', 'Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/danh-gia', { ma_truyen: truyenId, so_sao: sao, noi_dung: noiDung.trim() || null });
      Alert.alert('Thành công', `Cảm ơn bạn đã đánh giá "${tenTruyen}"!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
      <Text style={styles.name}>{tenTruyen}</Text>
      <Text style={styles.hint}>Bạn đã trải nghiệm truyện này — hãy chia sẻ cảm nhận để giúp bạn đọc khác nhé.</Text>

      <View style={styles.starRow}>
        {STARS.map((s) => (
          <TouchableOpacity key={s} onPress={() => setSao(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text style={[styles.star, { color: s <= sao ? C.accent : '#cbd5e1' }]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.starLbl, { color: sao > 0 ? C.accent : C.muted }]}>{sao > 0 ? lbl : 'Chạm để chọn sao'}</Text>

      <Text style={styles.label}>Nhận xét (không bắt buộc)</Text>
      <TextInput
        style={styles.input}
        value={noiDung}
        onChangeText={setNoiDung}
        placeholder="Truyện này thế nào? Nội dung, hình ảnh, chất lượng sách..."
        placeholderTextColor={C.muted}
        multiline
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.count}>{noiDung.length}/500</Text>

      <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi đánh giá</Text>}
      </TouchableOpacity>
      <Text style={styles.note}>Bạn có thể gửi lại để cập nhật đánh giá của mình.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  name: { fontSize: 18, fontWeight: '800', color: C.text },
  hint: { fontSize: 13, color: C.sub, lineHeight: 19, marginTop: 6 },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  star: { fontSize: 46, marginHorizontal: 7 },
  starLbl: { textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 8 },
  label: { fontSize: 13, fontWeight: '700', color: C.sub, marginTop: 20, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, minHeight: 110, padding: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.line },
  count: { textAlign: 'right', fontSize: 11, color: C.muted, marginTop: 4 },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  note: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 12 },
});