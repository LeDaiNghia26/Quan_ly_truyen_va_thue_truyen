import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../AuthContext';
import { C } from '../theme';

import AuthScreen from '../screens/AuthScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import DetailScreen from '../screens/DetailScreen';
import ReservationScreen from '../screens/ReservationScreen';
import MyReservationsScreen from '../screens/MyReservationsScreen';
import ReserveDetailScreen from '../screens/ReserveDetailScreen';
import RentalsScreen from '../screens/RentalsScreen';
import VipScreen from '../screens/VipScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PolicyScreen from '../screens/PolicyScreen';
import ReviewScreen from '../screens/ReviewScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoginPrompt({ navigation }) {
  return (
    <View style={styles.gate}>
      <Text style={styles.gateIcon}>🔒</Text>
      <Text style={styles.gateTitle}>Cần đăng nhập</Text>
      <Text style={styles.gateDesc}>Đăng nhập để xem đơn đặt trước, sách đang thuê, điểm VIP và nhiều tiện ích khác.</Text>
      <TouchableOpacity style={styles.gateBtn} onPress={() => navigation.navigate('Đăng nhập')}>
        <Text style={styles.gateBtnText}>Đăng nhập / Đăng ký</Text>
      </TouchableOpacity>
    </View>
  );
}

function AuthGate(Wrapped) {
  return function AuthGateScreen(props) {
    const { user } = useAuth();
    if (!user) return <LoginPrompt navigation={props.navigation} />;
    return <Wrapped {...props} />;
  };
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: C.primary, tabBarInactiveTintColor: C.muted }}>
      <Tab.Screen name="Trang chủ" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }} />
      <Tab.Screen name="Tìm kiếm" component={SearchScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔍</Text> }} />
      <Tab.Screen name="Đơn của tôi" component={AuthGate(MyReservationsScreen)} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📌</Text> }} />
      <Tab.Screen name="Tài khoản" component={AuthGate(ProfileScreen)} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: C.text, headerTitleStyle: { fontWeight: '700' } }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Chi tiết truyện" component={DetailScreen} />
          <Stack.Screen name="Đặt trước" component={ReservationScreen} options={{ title: 'Đặt trước truyện' }} />
          <Stack.Screen name="Mã đặt trước" component={AuthGate(ReserveDetailScreen)} options={{ title: 'Mã đặt trước' }} />
          <Stack.Screen name="Đang thuê" component={AuthGate(RentalsScreen)} options={{ title: 'Đang thuê & Lịch sử' }} />
          <Stack.Screen name="VIP" component={AuthGate(VipScreen)} options={{ title: 'Tài khoản VIP & Điểm' }} />
          <Stack.Screen name="Thông báo" component={AuthGate(NotificationsScreen)} options={{ title: 'Thông báo' }} />
          <Stack.Screen name="Yêu thích" component={AuthGate(WishlistScreen)} options={{ title: 'Yêu thích của tôi' }} />
          <Stack.Screen name="Hồ sơ" component={AuthGate(EditProfileScreen)} options={{ title: 'Chỉnh sửa hồ sơ' }} />
          <Stack.Screen name="Cài đặt" component={AuthGate(SettingsScreen)} options={{ title: 'Cài đặt & Bảo mật' }} />
          <Stack.Screen name="Chính sách" component={PolicyScreen} options={{ title: 'Chính sách phí' }} />
          <Stack.Screen name="Đánh giá truyện" component={ReviewScreen} options={{ title: 'Đánh giá truyện', presentation: 'modal' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Đăng nhập" component={AuthScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Quên mật khẩu" component={ForgotPasswordScreen} options={{ title: 'Khôi phục mật khẩu' }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Chi tiết truyện" component={DetailScreen} />
          <Stack.Screen name="Đặt trước" component={ReservationScreen} options={{ title: 'Đặt trước truyện' }} />
          <Stack.Screen name="Chính sách" component={PolicyScreen} options={{ title: 'Chính sách phí' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: 28 },
  gateIcon: { fontSize: 40 },
  gateTitle: { fontSize: 19, fontWeight: '700', color: C.text, marginTop: 10 },
  gateDesc: { fontSize: 14, color: C.sub, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  gateBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 13, marginTop: 18 },
  gateBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});