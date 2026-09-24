import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, ScrollView } from 'react-native';
import api, { getErrorMessage } from '../api';
import { BookCard } from '../components/BookCard';
import { C } from '../theme';

const SORTS = [
  { k: 'top_thue', label: 'Most rented' },
  { k: 'moi_nhat', label: 'Mới nhất' },
  { k: 'danh_gia', label: 'Đánh giá cao' },
  { k: 'gia_thue_asc', label: 'Giá thuê thấp nhất' },
  { k: 'gia_thue_desc', label: 'Giá thuê cao nhất' },
];

function FilterSheet({ visible, onClose, filters, setFilters }) {
  const [nl, setNl] = useState([]);
  const [draft, setDraft] = useState({ ...filters });

  useEffect(() => {
    api.get('/the-loai').then((r) => setNl(r.data)).catch(() => {});
  }, []);

  useEffect(() => { visible && setDraft({ ...filters }); }, [visible]);

  const toggleGenre = (id) => {
    const g = draft.the_loai || [];
    setDraft({ ...draft, the_loai: g.includes(id) ? g.filter((x) => x !== id) : [...g, id] });
  };

  const Chip = ({ on, label, onPress }) => (
    <TouchableOpacity style={[styles.fChip, on && styles.fChipOn]} onPress={onPress}>
      <Text style={[styles.fChipText, on && styles.fChipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Bộ lọc nâng cao</Text>
          <ScrollView style={{ flex: 1 }}>
            <Text style={styles.fLabel}>Sắp xếp theo</Text>
            <View style={styles.fWrap}>
              {SORTS.map((s) => <Chip key={s.k} on={draft.sort === s.k} label={s.label} onPress={() => setDraft({ ...draft, sort: s.k })} />)}
            </View>
            <Text style={styles.fLabel}>Thể loại</Text>
            <View style={styles.fWrap}>
              {nl.map((g) => <Chip key={g.id} on={(draft.the_loai || []).includes(g.id)} label={g.ten_the_loai} onPress={() => toggleGenre(g.id)} />)}
            </View>
            <Text style={styles.fLabel}>Loại</Text>
            <View style={styles.fWrap}>
              <Chip on={draft.loai === 'TRUYEN_TRANH'} label="Truyện tranh" onPress={() => setDraft({ ...draft, loai: draft.loai === 'TRUYEN_TRANH' ? undefined : 'TRUYEN_TRANH' })} />
              <Chip on={draft.loai === 'TIEU_THUYET'} label="Tiểu thuyết" onPress={() => setDraft({ ...draft, loai: draft.loai === 'TIEU_THUYET' ? undefined : 'TIEU_THUYET' })} />
              <Chip on={draft.loai === 'TRUYEN_NGAN'} label="Truyện ngắn" onPress={() => setDraft({ ...draft, loai: draft.loai === 'TRUYEN_NGAN' ? undefined : 'TRUYEN_NGAN' })} />
              <Chip on={draft.loai === 'LIGHT_NOVEL'} label="Light Novel" onPress={() => setDraft({ ...draft, loai: draft.loai === 'LIGHT_NOVEL' ? undefined : 'LIGHT_NOVEL' })} />
            </View>
            <Text style={styles.fLabel}>Hình thức</Text>
            <View style={styles.fWrap}>
              <Chip on={draft.chi_thue === '1'} label="Cho thuê" onPress={() => setDraft({ ...draft, chi_thue: draft.chi_thue === '1' ? undefined : '1' })} />
              <Chip on={draft.chi_ban === '1'} label="Bán" onPress={() => setDraft({ ...draft, chi_ban: draft.chi_ban === '1' ? undefined : '1' })} />
            </View>
            <Text style={styles.fLabel}>Giá thuê (đ/ngày)</Text>
            <View style={styles.priceRow}>
              <TextInput style={styles.priceInput} placeholder="Từ" keyboardType="number-pad" value={draft.gia_thue_from || ''} onChangeText={(v) => setDraft({ ...draft, gia_thue_from: v })} />
              <TextInput style={styles.priceInput} placeholder="Đến" keyboardType="number-pad" value={draft.gia_thue_to || ''} onChangeText={(v) => setDraft({ ...draft, gia_thue_to: v })} />
            </View>
            <Text style={styles.fLabel}>Giá bán</Text>
            <View style={styles.priceRow}>
              <TextInput style={styles.priceInput} placeholder="Từ" keyboardType="number-pad" value={draft.gia_ban_from || ''} onChangeText={(v) => setDraft({ ...draft, gia_ban_from: v })} />
              <TextInput style={styles.priceInput} placeholder="Đến" keyboardType="number-pad" value={draft.gia_ban_to || ''} onChangeText={(v) => setDraft({ ...draft, gia_ban_to: v })} />
            </View>
          </ScrollView>
          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.resetBtn} onPress={() => setDraft({})}><Text style={styles.resetText}>Đặt lại</Text></TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { setFilters(draft); onClose(); }}><Text style={styles.applyText}>Áp dụng</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SearchScreen({ navigation }) {
  const [kw, setKw] = useState('');
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const iv = setTimeout(load, 350);
    return () => clearTimeout(iv);
  }, [kw, filters]);

  async function load() {
    setLoading(true);
    try {
      const params = { ...filters, phan_trang: 0 };
      if (kw.trim()) { params.tu_khoa = kw.trim(); delete params.phan_trang; }
      const res = await api.get('/truyen', { params });
      setData(res.data);
    } catch (e) {
      console.warn(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>🔍 Tìm truyện</Text>
        <View style={styles.searchRow}>
          <TextInput style={styles.searchInput} placeholder="Tên truyện, tác giả, nhà xuất bản..." placeholderTextColor={C.muted} value={kw} onChangeText={setKw} />
          <TouchableOpacity style={[styles.filterBtn, Object.keys(filters).length > 0 && styles.filterBtnOn]} onPress={() => setShowFilter(true)}>
            <Text style={styles.filterBtnText}>Lọc{Object.keys(filters).length > 0 ? ` (${Object.keys(filters).length})` : ''}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : <Text style={styles.empty}>Không tìm thấy truyện phù hợp.</Text>}
        renderItem={({ item }) => (
          <View style={{ width: '50%', paddingHorizontal: 6 }}>
            <BookCard item={item} onPress={() => navigation.navigate('Chi tiết truyện', { truyenId: item.id })} />
          </View>
        )}
      />
      <FilterSheet visible={showFilter} onClose={() => setShowFilter(false)} filters={filters} setFilters={setFilters} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  top: { paddingTop: 56, paddingHorizontal: 14 },
  title: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.line },
  filterBtn: { backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  filterBtnOn: { backgroundColor: C.primary },
  filterBtnText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingHorizontal: 10, paddingBottom: 20 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 48 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30, maxHeight: '85%' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 12 },
  fLabel: { fontSize: 13, fontWeight: '700', color: C.sub, marginTop: 12, marginBottom: 8 },
  fWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fChip: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.line },
  fChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  fChipText: { color: C.sub, fontSize: 13, fontWeight: '600' },
  fChipTextOn: { color: '#fff' },
  priceRow: { flexDirection: 'row', gap: 8 },
  priceInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: C.line },
  sheetBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  resetBtn: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  resetText: { color: C.sub, fontWeight: '600' },
  applyBtn: { flex: 2, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '700' },
});