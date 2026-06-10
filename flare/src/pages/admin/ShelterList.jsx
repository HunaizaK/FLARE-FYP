import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  SearchOutlined, CloseOutlined,
  KeyboardArrowUpOutlined, KeyboardArrowDownOutlined,
  UnfoldMoreOutlined,
} from '@mui/icons-material';
import api from '../../services/api';

const COLUMNS = [
  { key: 'shelter_name', label: 'Shelter Name' },
  { key: 'location',     label: 'Location' },
  { key: 'capacity',     label: 'Capacity' },
];

const ShelterList = () => {
  const navigate = useNavigate();
  const [shelters, setShelters]       = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField]     = useState('shelter_name');
  const [sortDir, setSortDir]         = useState('asc');

  useEffect(() => {
    api.get('/shelters')
      .then((res) => setShelters(res.data.data))
      .catch((err) => console.error('Failed to load shelters:', err));
  }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <UnfoldMoreOutlined style={{ fontSize: '16px', color: '#9CA3AF' }} />;
    return sortDir === 'asc'
      ? <KeyboardArrowUpOutlined style={{ fontSize: '16px', color: '#1F618A' }} />
      : <KeyboardArrowDownOutlined style={{ fontSize: '16px', color: '#1F618A' }} />;
  };

  const rows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = shelters.filter(
      (s) =>
        (s.shelter_name ?? '').toLowerCase().includes(q) ||
        (s.location     ?? '').toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [shelters, searchQuery, sortField, sortDir]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>
        <div style={{ padding: '40px 40px 40px 30px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>Shelters</h1>
            <button onClick={() => navigate('/admin/shelter-approvals')} style={{ height: '48px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000', boxShadow: '0 0px 12px rgba(0,0,0,0.18)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}>
              Approve Requests
            </button>
          </div>

          <div style={{ maxWidth: '560px', marginBottom: '20px' }}>
            <div style={{ height: '45px', paddingLeft: '16px', paddingRight: '12px', backgroundColor: '#FFFFFF', border: '1px solid #5f6063ab', borderRadius: '30px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <SearchOutlined style={{ color: '#9CA3AF', fontSize: '22px', marginRight: '12px', flexShrink: 0 }} />
              <input type="text" placeholder="Search by name or location" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, outline: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#1F2937', backgroundColor: 'transparent' }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%', flexShrink: 0 }}>
                  <CloseOutlined style={{ color: '#9CA3AF', fontSize: '18px' }} />
                </button>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 0px 20px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f8fb', borderBottom: '1px solid #E5E7EB' }}>
                  {COLUMNS.map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{col.label}<SortIcon field={col.key} /></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: '56px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF' }}>{searchQuery ? 'No results match your search' : 'No approved shelters yet'}</td></tr>
                ) : rows.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: index < rows.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background-color 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.shelter_name}</td>
                    <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.location || '—'}</td>
                    <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.capacity ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
            {rows.length} {rows.length === 1 ? 'shelter' : 'shelters'}{searchQuery && ' matching your search'}
          </p>

        </div>
      </div>
    </div>
  );
};

export default ShelterList;
