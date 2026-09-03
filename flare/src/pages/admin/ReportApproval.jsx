import { useState, useMemo, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  KeyboardArrowUpOutlined,
  KeyboardArrowDownOutlined,
  UnfoldMoreOutlined,
} from '@mui/icons-material';

const loadNewsletters = () => {
  try {
    return JSON.parse(localStorage.getItem('flare_pending_newsletters') || '[]');
  } catch {
    return [];
  }
};

const COLUMNS = [
  { key: 'username',    label: 'Username' },
  { key: 'submittedAt', label: 'Approval Date' },
];

const ReportApproval = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports]         = useState(loadNewsletters);
  const [sortField, setSortField]     = useState('submittedAt');
  const [sortDir, setSortDir]         = useState('desc');

  useEffect(() => {
    setReports(loadNewsletters());
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const removeFromStorage = (id) => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_newsletters') || '[]');
    localStorage.setItem('flare_pending_newsletters', JSON.stringify(pending.filter((r) => r.id !== id)));
  };

  const handleAccept = (id) => { removeFromStorage(id); setReports((prev) => prev.filter((r) => r.id !== id)); };
  const handleReject = (id) => { removeFromStorage(id); setReports((prev) => prev.filter((r) => r.id !== id)); };

  const rows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = reports.filter(
      (r) => (r.username || '').toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [reports, searchQuery, sortField, sortDir]);

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <UnfoldMoreOutlined style={{ fontSize: '16px', color: '#9CA3AF' }} />;
    return sortDir === 'asc'
      ? <KeyboardArrowUpOutlined style={{ fontSize: '16px', color: '#1F618A' }} />
      : <KeyboardArrowDownOutlined style={{ fontSize: '16px', color: '#1F618A' }} />;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <div
        className="flare-page-main absolute top-0 h-full transition-all duration-300 overflow-y-auto"
        style={{ left: 'var(--nav-left)', width: 'var(--nav-width)', paddingBottom: 'var(--nav-bottom-pad)' }}
      >
        <div style={{ padding: '40px 40px 40px 30px' }}>

          <h1 style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: '28px',
            fontWeight: 600,
            color: '#000000',
            marginBottom: '28px',
          }}>
            Report Approval
          </h1>

          {/* Search bar */}
          <div style={{ maxWidth: '560px', marginBottom: '32px' }}>
            <div style={{
              height: '45px',
              paddingLeft: '16px',
              paddingRight: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #5f6063ab',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            }}>
              <SearchOutlined style={{ color: '#9CA3AF', fontSize: '22px', marginRight: '12px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  outline: 'none',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  color: '#1F2937',
                  backgroundColor: 'transparent',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%', flexShrink: 0 }}
                >
                  <CloseOutlined style={{ color: '#9CA3AF', fontSize: '18px' }} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f8fb', borderBottom: '1px solid #E5E7EB' }}>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#6B7280',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {col.label}
                        <SortIcon field={col.key} />
                      </div>
                    </th>
                  ))}
                  <th style={{
                    padding: '14px 20px',
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280',
                    whiteSpace: 'nowrap',
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{
                      padding: '56px',
                      textAlign: 'center',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      color: '#9CA3AF',
                    }}>
                      {searchQuery ? 'No results match your search' : 'No pending report approvals'}
                    </td>
                  </tr>
                ) : (
                  rows.map((report, index) => (
                    <tr
                      key={report.id}
                      style={{
                        borderBottom: index < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>
                        {report.username || report.email || '—'}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {report.submittedAt ? new Date(report.submittedAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAccept(report.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '6px 14px',
                              backgroundColor: '#b7c9dc',
                              border: '2px solid #b7c9dc',
                              borderRadius: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px', fontWeight: 500,
                              color: '#000000', cursor: 'pointer',
                              transition: 'all 0.2s', whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8f9dad'; e.currentTarget.style.borderColor = '#8f9dad'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b7c9dc'; e.currentTarget.style.borderColor = '#b7c9dc'; }}
                          >
                            <CheckOutlined style={{ fontSize: '14px' }} />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '6px 14px',
                              backgroundColor: '#FFFFFF',
                              border: '2px solid #F87171',
                              borderRadius: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px', fontWeight: 500,
                              color: '#EF4444', cursor: 'pointer',
                              transition: 'all 0.2s', whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                          >
                            <CloseOutlined style={{ fontSize: '14px' }} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
            {rows.length} pending {rows.length === 1 ? 'request' : 'requests'}
            {searchQuery && ' matching your search'}
          </p>

        </div>
      </div>
    </div>
  );
};

export default ReportApproval;
