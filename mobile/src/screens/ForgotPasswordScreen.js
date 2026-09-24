import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api, { getErrorMessage } from '../api';
import { C } from '../theme';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);
  const [sdt, setSdt] = useState('');
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const r = await api.post('/auth/send-otp', { so_dien_thoai: sdt, loai: 'quen_mat_khau' });
      setOtpHint(r.data.ma_otp_hienthi || '');
      setStep(2);
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { so_dien_thoai: sdt, ma_otp: otp, mat_khau_moi: pw });
      Alert.alert('Thành công', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.');
      setStep(1); setSdt(''); setOtp(''); setPw(''); setOtpHint('');
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const input = (v, set) => (
    <TextInput
      style={styles.input}
      value={v}
      onChangeText={set}
      placeholderTextColor={C.muted}
      keyboardType={step === 2 ? 'number-pad' : undefined}
      secureTextEntry={step === 3}
      autoCapitalize="none"
    />
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.desc}>
          {step === 1 && 'Nhập số điện thoại đã đăng ký để nhận mã OTP.'}
          {step === 2 && `Mã OTP mô phỏng: ${otpHint}`}
          {step === 3 && 'Nhập mật khẩu mới.'}
        </Text>

        {step === 1 && (<>{input(sdt, setSdt)}<TouchableOpacity style={styles.btn} onPress={send} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi mã OTP</Text>}</TouchableOpacity></>)}
        {step === 2 && (<>
          {input(otp, setOtp)}
          <TouchableOpacity style={styles.btn} onPress={() => { if (otp) setStep(3); else Alert.alert('Nhắc nhở', 'Nhập mã OTP.'); }} disabled={busy}><Text style={styles.btnText}>Xác nhận OTP</Text></TouchableOpacity>
          <TouchableOpacity onPress={send}><Text style={styles.link}>Gửi lại mã</Text></TouchableOpacity>
        </>)}
        {step === 3 && (<>
          {input(pw, setPw)}
          <TouchableOpacity style={styles.btn} onPress={reset} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đặt lại mật khẩu</Text>}</TouchableOpacity>
        </>)}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#eef2ff' },
  container: { flex: 1, padding: 24, paddingTop: 90 },
  icon: { fontSize: 44, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginTop: 8 },
  desc: { fontSize: 14, color: C.sub, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.line, marginBottom: 12 },
  btn: { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: C.primary, textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 12 },
});