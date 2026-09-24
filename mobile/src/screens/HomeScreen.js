import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import api, { getErrorMessage } from '../api';
import { BookCard } from '../components/BookCard';
import { useAuth } from '../AuthContext';
import { C, fmtVND } from '../theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [truyen, setTruyen] = useState([]);
  const [suKien, setSuKien] = useState([]);
  const [nl, setNl] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [loading, setLoading] = useState(true);
  const bannerRef = useRef(null);
  const [bannerIdx, setBannerIdx] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const [ts, ks, nlRes] = await Promise.all([
        api.get('/truyen', { params: { chi_con_hang: 1, phan_trang: 0 } }),
        api.get('/su-kien-giam-gia/cong-khai'),
        api.get('/the-loai'),
      ]);
      setTruyen(ts.data);
      setSuKien(ks.data);
      setNl(nlRes.data);
    } catch (e) {
      // im lặng lỗi mạng
      console.warn(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!suKien.length) return;
    const iv = setInterval(() => setBannerIdx((i) => (i + 1) % suKien.length), 4000);
    return () => clearInterval(iv);
  }, [suKien]);

  const list = selectedGenre
    ? truyen.filter((t) => (t.the_loai_ids || '').split(',').map((x) => Number(x)).includes(selectedGenre))
    : truyen;

  const sothich = (user?.profile?.so_thich || []).map((s) => Number(s.ma_the_loai));
  const sortedTop = [...truyen].sort((a, b) => Number(b.luot_thue) - Number(a.luot_thue));
  const recommend = sothich.length
    ? truyen
        .filter((t) => (t.the_loai_ids || '').split(',').map((x) => Number(x)).some((x) => sothich.includes(x)))
        .sort((a, b) => Number(b.luot_thue) - Number(a.luot_thue))
    : sortedTop;
  const recommendList = recommend.slice(0, 10);

  function Banner() {
    if (!suKien.length) return null;
    const sk = suKien[bannerIdx];
    return (
      <View style={styles.bannerWrap}>
        <ScrollView horizontal pagingEnabled ref={bannerRef} showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / width))}>
          {suKien.map((k, i) => (
            <View key={k.id} style={[styles.banner, { backgroundColor: i % 2 ? '#7c3aed' : C.primary }]}>
              <Text style={styles.bannerTag}>🎉 SỰ KIỆN</Text>
              <Text style={styles.bannerTitle}>{k.ten_su_kien}</Text>
              <Text style={styles.bannerDesc}>
                {k.kieu_giam === 'phan_tram' ? `Giảm ${k.gia_tri}%` : `Giảm ${fmtVND(k.gia_tri)}`} — Hết ngày {String(k.ngay_ket_thuc).slice(0, 10)}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {suKien.map((k, i) => <View key={k.id} style={[styles.dot, i === bannerIdx && styles.dotOn]} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>📚 Nhà Sách Truyện Hay</Text>
      <FlatList
        data={list}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <Banner />
            {recommendList.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>{sothich.length ? '🎯 Gợi ý cho bạn' : '🔥 Top truyện thuê nhiều'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recRow}>
                  {recommendList.map((t) => (
                    <BookCard key={t.id} item={t} onPress={() => navigation.navigate('Chi tiết truyện', { truyenId: t.id })} />
                  ))}
                </ScrollView>
              </View>
            )}
            <Text style={styles.sectionTitle}>Thể loại</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <TouchableOpacity style={[styles.chip, selectedGenre === null && styles.chipOn]} onPress={() => setSelectedGenre(null)}>
                <Text style={[styles.chipText, selectedGenre === null && styles.chipTextOn]}>Tất cả</Text>
              </TouchableOpacity>
              {nl.map((g) => (
                <TouchableOpacity key={g.id} style={[styles.chip, selectedGenre === g.id && styles.chipOn]} onPress={() => setSelectedGenre(g.id)}>
                  <Text style={[styles.chipText, selectedGenre === g.id && styles.chipTextOn]}>{g.ten_the_loai}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.sectionTitle}>Sách nổi bật</Text>
            {loading && <ActivityIndicator style={{ marginVertical: 30 }} />}
            {!loading && list.length === 0 && <Text style={styles.empty}>Không có truyện còn hàng.</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: '50%', paddingHorizontal: 6 }}>
            <BookCard item={item} onPress={() => navigation.navigate('Chi tiết truyện', { truyenId: item.id })} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  greeting: { fontSize: 20, fontWeight: '800', color: C.text, paddingHorizontal: 14, paddingTop: 56, paddingBottom: 10 },
  listContent: { paddingHorizontal: 10, paddingBottom: 20 },
  bannerWrap: { marginBottom: 16, marginTop: 4 },
  banner: { width: width - 20, borderRadius: 14, padding: 18, marginRight: 0, marginHorizontal: 0, alignSelf: 'center' },
  bannerTag: { color: '#fbbf24', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 6 },
  bannerDesc: { color: '#e0e7ff', fontSize: 13, marginTop: 6 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginHorizontal: 3 },
  dotOn: { backgroundColor: C.primary },
  recRow: { paddingHorizontal: 4, paddingBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 10, marginTop: 4, paddingLeft: 6 },
  chips: { paddingHorizontal: 4, paddingBottom: 4 },
  chip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.sub, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  empty: { textAlign: 'center', color: C.muted, marginVertical: 20 },
});