import React, { useState } from 'react';

export function useFetch(fetcher) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function reload(params) {
    setLoading(true);
    setError('');
    try {
      const res = await fetcher(params);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  return { data, setData, loading, error, reload, setError };
}

export function SearchBar({ placeholder = 'Tìm kiếm...', onSearch }) {
  const [kw, setKw] = useState('');
  return (
    <div className="toolbar">
      <input
        placeholder={placeholder}
        value={kw}
        onChange={(e) => setKw(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(kw)}
        style={{ width: 260 }}
      />
      <button onClick={() => onSearch(kw)}>Tìm kiếm</button>
    </div>
  );
}