import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';
import api from '../api';
import { C } from '../theme';

const Input = ({ value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) => (
  <TextInput
    style={styles.input}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={C.muted}
    secureTextEntry={secureTextEntry}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize || 'none'}
  />
);

export default function AuthScreen({ navigation }) {
  const { login, register, getErrorMessage, setUser } = useAuth();
  const [tab, setTab] = useState('login');

  // login
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // register
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [soThich, setSoThich] = useState([]);
  const [theLoai, setTheLoai] = useState([]);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/the-loai').then((r) => setTheLoai(r.data)).catch(() => {});
  }, []);

  async function hLogin() {
    setBusy(true);
    try {
      await login({ so_dien_thoai: loginId.includes('@') ? undefined : loginId, email: loginId.includes('@') ? loginId : undefined, mat_khau: loginPw });
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function hSendOtp() {
    if (!sdt) return Alert.alert('Nhắc nhở', 'Nhập số điện thoại trước.');
    setBusy(true);
    try {
      const r = await api.post('/auth/send-otp', { so_dien_thoai: sdt, loai: 'dang_ky' });
      // Mã OTP chỉ được trả về khi backend bật DEV_EXPOSE_OTP (chế độ demo).
      if (r.data.ma_otp_hienthi) {
        setOtpHint(r.data.ma_otp_hienthi);
        Alert.alert('Đã gửi OTP', `SMS mô phỏng: mã OTP của bạn là ${r.data.ma_otp_hienthi}`);
      } else {
        setOtpHint('');
        Alert.alert('Đã gửi OTP', 'Mã OTP đã được gửi tới số điện thoại của bạn.');
      }
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function hRegister() {
    if (!hoTen || !sdt || !matKhau) return Alert.alert('Nhắc nhở', 'Hãy điền đủ tên, số điện thoại và mật khẩu.');
    if (!otp.trim()) return Alert.alert('Nhắc nhở', 'Hãy bấm "Gửi OTP" và nhập mã xác thực để đăng ký.');
    setBusy(true);
    try {
      await register({ ho_ten: hoTen, so_dien_thoai: sdt, mat_khau: matKhau, ma_otp: otp.trim(), so_thich: soThich });
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function hGoogle() {
    setBusy(true);
    try {
      const r = await api.post('/auth/login-google', { email: 'khach@shop.com', ho_ten: 'Vũ Ngọc Vy' });
      await AsyncStorage.multiSet([['token', r.data.token], ['user', JSON.stringify(r.data.user)]]);
      setUser(r.data.user);
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>📚</Text>
        <Text style={styles.brand}>Nhà Sách Truyện Hay</Text>
        <Text style={styles.subtitle}>Đặt trước, thuê & mua truyện dễ dàng</Text>

        <View style={styles.tabs}>
          {['login', 'register'].map((k) => (
            <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
              <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{k === 'login' ? 'Đăng nhập' : 'Đăng ký'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'login' ? (
          <View style={styles.form}>
            <Input value={loginId} onChangeText={setLoginId} placeholder="Số điện thoại hoặc email" />
            <Input value={loginPw} onChangeText={setLoginPw} placeholder="Mật khẩu" secureTextEntry />
            <TouchableOpacity style={styles.btnPrimary} onPress={hLogin} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Đăng nhập</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Quên mật khẩu')}>
              <Text style={styles.link}>Quên mật khẩu?</Text>
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.divider} />
            </View>
            <TouchableOpacity style={styles.btnGoogle} onPress={hGoogle} disabled={busy}>
              <Text style={styles.btnGoogleText}>Đăng nhập với Google (mô phỏng)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Input value={hoTen} onChangeText={setHoTen} placeholder="Họ tên" autoCapitalize="words" />
            <Input value={sdt} onChangeText={setSdt} placeholder="Số điện thoại" keyboardType="phone-pad" />
            <Input value={matKhau} onChangeText={setMatKhau} placeholder="Mật khẩu (tối thiểu 6 ký tự)" secureTextEntry />
            {otpHint !== '' && <Text style={styles.otpHint}>OTP mô phỏng (nhập mã này): {otpHint}</Text>}
            <View style={styles.otpRow}>
              <View style={{ flex: 1 }}>
                <Input value={otp} onChangeText={setOtp} placeholder="Mã OTP" keyboardType="number-pad" />
              </View>
              <TouchableOpacity style={styles.btnSendOtp} onPress={hSendOtp} disabled={busy}>
                <Text style={styles.btnSendOtpText}>{otpHint ? 'Gửi lại' : 'Gửi OTP'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.chipLabel}>Bạn yêu thích thể loại nào?</Text>
            <View style={styles.chips}>
              {theLoai.map((t) => {
                const on = soThich.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setSoThich((s) => (on ? s.filter((x) => x !== t.id) : [...s, t.id]))}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.ten_the_loai}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={hRegister} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Tạo tài khoản</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#eef2ff' },
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 70, paddingBottom: 40 },
  logo: { fontSize: 46, textAlign: 'center' },
  brand: { fontSize: 24, fontWeight: '800', color: C.text, textAlign: 'center', marginTop: 4 },
  subtitle: { fontSize: 13, color: C.sub, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  tabs: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: C.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: C.sub },
  tabTextActive: { color: '#fff' },
  form: { gap: 12 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.line },
  btnPrimary: { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: C.primary, textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  divider: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { color: C.muted, fontSize: 12, marginHorizontal: 10 },
  btnGoogle: { borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnGoogleText: { color: C.text, fontSize: 15, fontWeight: '600' },
  otpHint: { color: C.success, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  otpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnSendOtp: { backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', paddingVertical: 12 },
  btnSendOtpText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  chipLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.sub, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
});