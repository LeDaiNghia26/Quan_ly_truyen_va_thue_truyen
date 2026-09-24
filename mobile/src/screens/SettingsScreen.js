import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { C } from '../theme';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [cu, setCu] = useState('');
  const [moi, setMoi] = useState('');
  const [nlai, setNlai] = useState('');
  const [busy, setBusy] = useState(false);

  const input = (label, val, set, ph) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={val} onChangeText={set} placeholder={ph} placeholderTextColor={C.muted} secureTextEntry />
    </View>
  );

  async function doi() {
    if (!cu || !moi) return Alert.alert('Nhắc nhở', 'Nhập đủ mật khẩu.');
    if (moi.length < 6) return Alert.alert('Nhắc nhở', 'Mật khẩu mới tối thiểu 6 ký tự.');
    if (moi !== nlai) return Alert.alert('Nhắc nhở', 'Xác nhận mật khẩu không khớp.');
    setBusy(true);
    try {
      await api.put('/auth/change-password', { mat_khau_cu: cu, mat_khau_moi: moi });
      Alert.alert('Thành công', 'Đã đổi mật khẩu. Bạn sẽ đăng nhập lại.');
      await logout();
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Đổi mật khẩu</Text>
          {input('Mật khẩu hiện tại', cu, setCu, '••••••')}
          {input('Mật khẩu mới', moi, setMoi, 'Tối thiểu 6 ký tự')}
          {input('Xác nhận mật khẩu mới', nlai, setNlai, 'Nhập lại mật khẩu mới')}
          <TouchableOpacity style={styles.btn} onPress={doi} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đổi mật khẩu</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.policyBtn} onPress={() => navigation.navigate('Chính sách')}>
          <Text style={styles.policyText}>Xem chính sách phí & quy định →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 18 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  title: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.line },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '800' },
  policyBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  policyText: { color: C.primary, fontWeight: '700' },
});