import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../AuthContext';
import { C, HANG_MAP } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshProfile } = useAuth();
  const p = user?.profile;
  const hangStyle =
    p?.hang_thanh_vien === 'vip' ? { backgroundColor: '#f3e8ff', color: C.vip }
    : p?.hang_thanh_vien === 'than_thiet' ? { backgroundColor: '#fef3c7', color: '#b45309' }
    : { backgroundColor: '#eef2ff', color: C.primary };
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    setRefreshing(true);
    refreshProfile().catch(() => {}).finally(() => setRefreshing(false));
  }, []));

  const menu = [
    { icon: '📖', label: 'Sách đang thuê & Lịch sử', screen: 'Đang thuê' },
    { icon: '👑', label: 'Tài khoản VIP & Điểm', screen: 'VIP' },
    { icon: '🔔', label: 'Thông báo', screen: 'Thông báo' },
    { icon: '❤️', label: 'Yêu thích của tôi', screen: 'Yêu thích' },
    { icon: '✏️', label: 'Chỉnh sửa hồ sơ', screen: 'Hồ sơ' },
    { icon: '⚙️', label: 'Cài đặt & Đổi mật khẩu', screen: 'Cài đặt' },
    { icon: '📄', label: 'Chính sách phí & quy định', screen: 'Chính sách' },
  ];

  return (
    <FlatList
      style={styles.container}
      data={menu}
      keyExtractor={(item) => item.label}
      refreshing={refreshing}
      onRefresh={() => refreshProfile().catch(() => {})}
      ListHeaderComponent={
        <TouchableOpacity style={styles.userCard} onPress={() => navigation.navigate('Hồ sơ')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(p?.ho_ten || user?.email || '?').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name}>{p?.ho_ten || 'Khách hàng'}</Text>
            <View style={styles.badges}>
              <Text style={[styles.badge, hangStyle]}>
                {HANG_MAP[p?.hang_thanh_vien] || 'Thành viên thường'}
              </Text>
              <Text style={styles.points}>⭐ {Number(p?.diem_tich_luy) || 0} điểm</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity
          style={styles.logout}
          onPress={() => Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [{ text: 'Không' }, { text: 'Đăng xuất', style: 'destructive', onPress: logout }])}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 18, margin: 16, marginTop: 56, marginBottom: 6 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800', color: C.text },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, overflow: 'hidden' },
  points: { fontSize: 12, color: C.sub, fontWeight: '600' },
  chevron: { fontSize: 22, color: C.muted, marginLeft: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginHorizontal: 16, marginBottom: 8 },
  menuIcon: { fontSize: 18, width: 34 },
  menuLabel: { flex: 1, fontSize: 15, color: C.text, fontWeight: '600' },
  logout: { marginHorizontal: 16, marginTop: 14, marginBottom: 30, borderWidth: 1, borderColor: C.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: C.danger, fontWeight: '700' },
});