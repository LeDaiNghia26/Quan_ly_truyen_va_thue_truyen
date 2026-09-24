import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { C } from '../theme';

export default function EditProfileScreen({ navigation }) {
  const { user, refreshProfile, updateUser } = useAuth();
  const p = user?.profile || {};
  const [hoTen, setHoTen] = useState(p.ho_ten || '');
  const [diaChi, setDiaChi] = useState(p.dia_chi || '');
  const [ngaySinh, setNgaySinh] = useState(p.ngay_sinh || (p.ngay_sinh && String(p.ngay_sinh).slice(0, 10)) || '');
  const [genres, setGenres] = useState([]);
  const [sel, setSel] = useState(() => (p.so_thich || []).map((s) => s.ma_the_loai));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/the-loai')
      .then((r) => setGenres(r.data || []))
      .catch(() => {});
  }, []);

  function toggle(id) {
    setSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await api.put('/auth/me', {
        ho_ten: hoTen,
        dia_chi: diaChi,
        ngay_sinh: ngaySinh || null,
        anh_dai_dien: p.anh_dai_dien,
        so_thich: sel,
      });
      updateUser({ profile: res.data });
      await refreshProfile().catch(() => {});
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const input = (label, val, set, placeholder, ks) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={val}
        onChangeText={set}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        autoCapitalize="none"
        keyboardType={ks}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
        {p.mat_khau_mac_dinh && (
          <View style={styles.warn}>
            <Text style={styles.warnTitle}>⚠ Bạn đang dùng mật khẩu mặc định</Text>
            <Text style={styles.warnText}>Mật khẩu hiện tại là "123456". Hãy đổi mật khẩu tại "Cài đặt & Đổi mật khẩu" để bảo vệ tài khoản.</Text>
          </View>
        )}
        {input('Họ tên', hoTen, setHoTen, 'Họ và tên')}
        {input('Địa chỉ', diaChi, setDiaChi, 'Số nhà, đường, quận huyện')}
        {input('Ngày sinh', ngaySinh, setNgaySinh, 'YYYY-MM-DD')}
        <Text style={styles.label}>Thể loại yêu thích</Text>
        <View style={styles.chipWrap}>
          {genres.length === 0 && <Text style={styles.static}>Chưa có thể loại.</Text>}
          {genres.map((g) => {
            const on = sel.includes(g.id);
            return (
              <TouchableOpacity key={g.id} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(g.id)}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{g.ten_the_loai}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.static}>Số điện thoại: {user?.so_dien_thoai || p.so_dien_thoai || '—'}</Text>
        <Text style={styles.static}>Email: {user?.email || '—'}</Text>
        <TouchableOpacity style={styles.btn} onPress={save} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lưu thay đổi</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  warn: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#f59e0b' },
  warnTitle: { color: '#92400e', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  warnText: { color: '#92400e', fontSize: 13, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.line },
  static: { fontSize: 13, color: C.sub, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.sub, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});