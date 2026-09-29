import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nếu chạy trên máy thật (quét QR Expo Go), đổi IP này thành địa chỉ IP LAN của máy tính
// Cách tìm: chạy `ipconfig` trên CMD, lấy IPv4 của adapter đang dùng (ví dụ 192.168.1.10)
const API_URL = 'http://192.168.1.202:5000/api';

export const SERVER_BASE = API_URL.replace(/\/api\/?$/, '');

// Chuyển đường dẫn ảnh tương đối (/uploads/..) thành URL đầy đủ tới server
export function imageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return SERVER_BASE + (String(path).startsWith('/') ? path : '/' + path);
}

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err) {
  return err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.';
}

export default api;