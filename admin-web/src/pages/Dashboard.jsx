import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import api from '../api';
import { fmt, fmtDate } from '../ui';
import { exportExcel, exportPdf } from '../exportUtils';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

const LOAI_HD = {
  ban: ['Bán', 'b-green'],
  thue: ['Thuê', 'b-blue'],
  tra: ['Trả', 'b-purple'],
  dat_truoc: ['Đặt trước', 'b-yellow'],
};

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/thong-ke/dashboard').then((r) => setD(r.data)).catch((e) => setErr(e.response?.data?.message || e.message));
  }, []);

  if (err) return <div className="msg err">{err}</div>;
  if (!d) return <div className="card">Đang tải dữ liệu...</div>;

  const tq = d.tong_quan;

  function onExcel() {
    exportExcel([
      {
        name: 'Doanh thu 7 ngày',
        rows: d.doanh_thu_7_ngay.map((x) => ({ Ngay: x.ngay, 'Ban (d)': x.ban, 'Thue (d)': x.thue })),
      },
      {
        name: 'Doanh thu 12 tháng',
        rows: d.doanh_thu_12_thang.map((x) => ({ Thang: x.thang, 'Ban (d)': x.ban, 'Thue (d)': x.thue })),
      },
      { name: 'Top bán', rows: d.truyen_ban_nhieu_nhat.map((x) => ({ Truyen: x.ten_truyen, 'So lan': x.so_lan, 'Doanh thu': x.doanh_thu })) },
      { name: 'Top thuê', rows: d.truyen_thue_nhieu_nhat.map((x) => ({ Truyen: x.ten_truyen, 'So lan': x.so_lan })) },
    ], 'bang-dieu-khien.xlsx');
  }

  function onPdf() {
    exportPdf({
      title: 'Bảng điều khiển — Quản lý truyện',
      sections: [
        {
          name: 'Tổng quan',
          head: ['Chỉ số', 'Giá trị'],
          body: [
            ['Đầu truyện đang hoạt động', String(tq.dau_truyen)],
            ['Khách hàng', String(tq.khach_hang)],
            ['Doanh thu bán', fmt(tq.doanh_thu_ban) + ' đ'],
            ['Doanh thu cho thuê', fmt(tq.doanh_thu_thue) + ' đ'],
            ['Đơn đặt trước chờ nhận', String(tq.don_cho_nhan)],
            ['Sách đang cho thuê', String(tq.dang_cho_thue)],
            ['Sách đang bảo trì', String(tq.dang_bao_tri)],
            ['Đầu truyện tồn kho thấp', String(tq.ton_kho_thap)],
            ['Lượt trả sách', String(tq.so_lan_tra)],
            ['Trả đúng hạn', String(tq.so_lan_tra_dung_han)],
            ['Tỷ lệ trả đúng hạn', fmt(tq.ty_le_tra_dung_han) + '%'],
          ],
        },
        {
          name: 'Doanh thu 7 ngày gần nhất',
          head: ['Ngày', 'Bán (đ)', 'Thuê (đ)'],
          body: d.doanh_thu_7_ngay.map((x) => [x.ngay, fmt(x.ban), fmt(x.thue)]),
        },
        {
          name: 'Top truyện bán chạy',
          head: ['Truyện', 'Số lần', 'Doanh thu (đ)'],
          body: d.truyen_ban_nhieu_nhat.map((x) => [x.ten_truyen, String(x.so_lan), fmt(x.doanh_thu)]),
        },
      ],
    }, 'bang-dieu-khien.pdf');
  }

  return (
    <div>
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h3>Bảng điều khiển</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary" onClick={onExcel}>Xuất Excel</button>
          <button className="secondary" onClick={onPdf}>Xuất PDF</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat"><div className="lbl">Đầu truyện</div><div className="num">{fmt(tq.dau_truyen)}</div></div>
        <div className="stat"><div className="lbl">Khách hàng</div><div className="num">{fmt(tq.khach_hang)}</div></div>
        <div className="stat"><div className="lbl">Doanh thu bán</div><div className="num">{fmt(tq.doanh_thu_ban)}₫</div></div>
        <div className="stat"><div className="lbl">Doanh thu cho thuê</div><div className="num">{fmt(tq.doanh_thu_thue)}₫</div></div>
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="lbl">Doanh thu thuê (gốc)</div><div className="num">{fmt(tq.doanh_thu_thue_goc)}₫</div></div>
        <div className="stat"><div className="lbl">Phí chậm / phạt</div><div className="num">{fmt(tq.phi_phat_sinh)}₫</div></div>
        <div className="stat"><div className="lbl">Đơn đặt trước chờ nhận</div><div className="num">{fmt(tq.don_cho_nhan)}</div></div>
        <div className="stat"><div className="lbl">Sách đang cho thuê</div><div className="num">{fmt(tq.dang_cho_thue)}</div></div>
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="lbl">Lượt trả sách</div><div className="num">{fmt(tq.so_lan_tra)}</div></div>
        <div className="stat"><div className="lbl">Trả đúng hạn</div><div className="num">{fmt(tq.so_lan_tra_dung_han)}</div></div>
        <div className="stat"><div className="lbl">Tỷ lệ trả đúng hạn</div><div className="num" style={{ color: tq.so_lan_tra > 0 && (tq.ty_le_tra_dung_han || 0) < 80 ? '#b91c1c' : undefined }}>{fmt(tq.ty_le_tra_dung_han)}%</div></div>
        <div className="stat"><div className="lbl">Sách đang bảo trì</div><div className="num">{fmt(tq.dang_bao_tri)}</div></div>
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="lbl">Tồn kho thấp (≤1)</div><div className="num" style={{ color: tq.ton_kho_thap > 0 ? '#b91c1c' : undefined }}>{fmt(tq.ton_kho_thap)}</div></div>
        <div className="stat"><div className="lbl">Đầu truyện</div><div className="num">{fmt(tq.dau_truyen)}</div></div>
        <div className="stat"><div className="lbl">Khách hàng</div><div className="num">{fmt(tq.khach_hang)}</div></div>
        <div className="stat" style={{ opacity: 1 }}><div className="lbl">.</div><div className="num" style={{ fontSize: 12 }}>Doanh thu thuê = gốc + phí phạt</div></div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3>Doanh thu 7 ngày gần nhất</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={d.doanh_thu_7_ngay}>
              <defs>
                <linearGradient id="gBan" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                <linearGradient id="gThue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ngay" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => fmt(v) + ' đ'} />
              <Legend />
              <Area type="monotone" dataKey="ban" name="Bán" stroke="#4f46e5" fill="url(#gBan)" />
              <Area type="monotone" dataKey="thue" name="Thuê" stroke="#0ea5e9" fill="url(#gThue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Phân bố theo thể loại</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={d.phan_bo_the_loai} dataKey="so_luong" nameKey="ten" outerRadius={95} label>
                {d.phan_bo_the_loai.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} truyện`, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3>Doanh thu 12 tháng</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={d.doanh_thu_12_thang}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="thang" fontSize={11} />
              <YAxis fontSize={12} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => fmt(v) + ' đ'} />
              <Legend />
              <Bar dataKey="ban" name="Bán" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="thue" name="Thuê" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Hoạt động gần đây</h3>
          {d.hoat_dong_gan_day.length === 0 && <div className="empty">Chưa có giao dịch.</div>}
          <div className="activity">
            {d.hoat_dong_gan_day.map((h, i) => {
              const [label, cls] = LOAI_HD[h.loai] || [h.loai, 'b-gray'];
              return (
                <div key={i} className="activity-item">
                  <span className={`badge ${cls}`}>{label}</span>
                  <span>{h.tieu_de}</span>
                  <span className="muted">{fmtDate(h.thoi_gian)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3>Top truyện bán chạy</h3>
          {d.truyen_ban_nhieu_nhat.length === 0 && <div className="empty">Chưa có dữ liệu.</div>}
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.truyen_ban_nhieu_nhat} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="ten_truyen" fontSize={11} width={140} />
              <Tooltip formatter={(v) => `${v} lượt`} />
              <Bar dataKey="so_lan" name="Số lần bán" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Top truyện được thuê</h3>
          {d.truyen_thue_nhieu_nhat.length === 0 && <div className="empty">Chưa có dữ liệu.</div>}
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.truyen_thue_nhieu_nhat} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="ten_truyen" fontSize={11} width={140} />
              <Tooltip formatter={(v) => `${v} lượt`} />
              <Bar dataKey="so_lan" name="Số lần thuê" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
