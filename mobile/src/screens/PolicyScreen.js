import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import api from '../api';
import { C } from '../theme';

const SECTIONS = [
  { title: 'Phí thuê truyện', items: ['Phí thuê tính theo ngày, trả trước tại quầy.', 'Tiền cọc = giá bìa (giá bán) của truyện, hoàn lại 100% khi trả đúng hạn và sách còn nguyên vẹn.'] },
  { title: 'Phí phạt trả trễ', items: ['Quá hạn 1 ngày: 2.000đ/ngày/quyển.', 'Hư hỏng nặng / mất sách: thu theo giá bìa của truyện, đã bù trừ tiền cọc đã đóng.'] },
  { title: 'Đặt trước qua app', items: ['Đơn đặt trước có giá trị khi khách đến quầy; sách được giữ tối đa 2h sau giờ hẹn.', 'Hủy đơn trực tiếp trong app khi đơn còn ở trạng thái chờ nhận.', 'Đơn quá hạn giữ sách sẽ bị tự hủy để trả sách vào tồn kho.'] },
  { title: 'Hạng & ưu đãi thành viên', items: ['Mỗi 1.000đ giao dịch (thuê/mua) tích được 1 điểm.', 'Thành viên VIP (từ 100 điểm): giảm 10% khi mua sách, quy đổi điểm thanh toán theo tỷ lệ 200đ/điểm.', 'Điểm không đổi ra tiền mặt, không hết hạn.'] },
  { title: 'Chính sách khác', items: ['Khách mua sách được đổi trả trong 7 ngày nếu lỗi in ấn/đóng gói (kèm hóa đơn).', 'Miễn phí gói quà khi mua trên 100.000đ.', 'Mọi thắc mắc liên hệ quầy hoặc hotline 0900.000.001.'] },
];

export default function PolicyScreen() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => { api.get('/cau-hinh').then((r) => setCfg(r.data)).catch(() => {}); }, []);

  const qd = (ten) => Number((cfg?.quy_doi || []).find((x) => x.ten_quy_tac === ten)?.gia_tri) || 0;
  const sections = SECTIONS.map((s) => {
    if (s.title !== 'Hạng & ưu đãi thành viên' || !cfg || !cfg.hang_thanh_vien?.length) return s;
    const items = [
      ...cfg.hang_thanh_vien.map((h) => `${h.ten_hang} (từ ${Number(h.nguong_diem).toLocaleString('vi-VN')} điểm): ${Number(h.phan_tram_giam) > 0 ? `giảm ${Number(h.phan_tram_giam)}% khi mua` : 'không giảm giá'}.`),
      `Quy đổi điểm thanh toán: 1 điểm = ${qd('tien_moi_diem').toLocaleString('vi-VN')}đ (áp dụng cho hạng VIP).`,
      'Mỗi 1.000đ giao dịch (thuê/mua) tích được 1 điểm.',
      'Điểm không đổi ra tiền mặt, không hết hạn.',
    ].filter(Boolean);
    return { ...s, items };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {sections.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.title}>{s.title}</Text>
          {s.items.map((it, i) => <Text key={i} style={styles.text}>• {it}</Text>)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 8 },
  text: { fontSize: 13, color: C.sub, lineHeight: 21, marginBottom: 4 },
});