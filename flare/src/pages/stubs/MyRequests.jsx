import { useState, useMemo, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import {
  SearchOutlined, CloseOutlined,
  KeyboardArrowUpOutlined, KeyboardArrowDownOutlined,
  UnfoldMoreOutlined,
} from '@mui/icons-material';
import api from '../../services/api';

const TABLE_LABEL = {
  lost_found_posts:  'Lost & Found',
  shelters:          'Shelter',
  donation_accounts: 'Donation',
};

const STATUS_STYLE = {
  pending:  { backgroundColor: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE047' },
  approved: { backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' },
  rejected: { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' },
};

const COLUMNS = [
  { key: 'category',  label: 'Category' },
  { key: 'action',    label: 'Action' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
];

const MyRequests = () => {
  const [requests, setRequests]       = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField]     = useState('date');
  const [sortDir, setSortDir]         = useState('desc');

  const loadRequests = useCallback(async () => {
    try {
      const res = await api.get('/change-requests/my');
      setRequests(res.data.data.map((r) => ({
        id:       String(r.id),
        category: TABLE_LABEL[r.table_name] || r.table_name,
        action:   r.request_type,
        status:   r.status,
        date:     r.created_at ? new Date(r.created_at).toLocaleDateString() : '—',
        _rawDate: r.created_at || '',
      })));
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

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
    const filtered = requests.filter(
      (r) =>
        r.category.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q)   ||
        r.status.toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const key = sortField === 'date' ? '_rawDate' : sortField;
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [requests, searchQuery, sortField, sortDir]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <div className="flare-page-main absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: 'var(--nav-left)', width: 'var(--nav-width)', paddingBottom: 'var(--nav-bottom-pad)' }}>
        <div style={{ padding: '40px 40px 40px 30px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>My Requests</h1>
          </div>

          <div style={{ maxWidth: '560px', marginBottom: '20px' }}>
            <div style={{ height: '45px', paddingLeft: '16px', paddingRight: '12px', backgroundColor: '#FFFFFF', border: '1px solid #5f6063ab', borderRadius: '30px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <SearchOutlined style={{ color: '#9CA3AF', fontSize: '22px', marginRight: '12px', flexShrink: 0 }} />
              <input type="text" placeholder="Search by category, action or status" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, outline: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#1F2937', backgroundColor: 'transparent' }} />
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
                  <tr><td colSpan={4} style={{ padding: '56px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF' }}>{searchQuery ? 'No results match your search' : 'No requests submitted yet'}</td></tr>
                ) : rows.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: index < rows.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background-color 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.category}</td>
                    <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937', textTransform: 'capitalize' }}>{row.action}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ ...STATUS_STYLE[row.status], padding: '4px 12px', borderRadius: '20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize', display: 'inline-block' }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', whiteSpace: 'nowrap' }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
            {rows.length} {rows.length === 1 ? 'request' : 'requests'}{searchQuery && ' matching your search'}
          </p>

        </div>
      </div>
    </div>
  );
};

export default MyRequests;
