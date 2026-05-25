import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  SearchOutlined, CheckOutlined, CloseOutlined,
  KeyboardArrowUpOutlined, KeyboardArrowDownOutlined,
  UnfoldMoreOutlined, ArrowBackOutlined,
} from '@mui/icons-material';

const load = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const COLUMNS = [
  { key: 'category',    label: 'Type' },
  { key: 'reportedBy',  label: 'Reported By' },
  { key: 'memberSince', label: 'Member Since' },
  { key: 'phone',       label: 'Phone Number' },
  { key: 'isUrgent',    label: 'Urgent' },
];

const COLUMNS_NO_URGENT = COLUMNS.filter((c) => c.key !== 'isUrgent');

const LFTable = ({ title, rows, onAccept, onReject, columns = COLUMNS }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField]     = useState('reportedBy');
  const [sortDir, setSortDir]         = useState('asc');

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

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const f = rows.filter(
      (r) => (r.reportedBy ?? '').toLowerCase().includes(q) ||
             (r.phone      ?? '').toLowerCase().includes(q) ||
             (r.category   ?? '').toLowerCase().includes(q)
    );
    return [...f].sort((a, b) => {
      const av = sortField === 'isUrgent' ? (a.isUrgent ? 1 : 0) : (a[sortField] ?? '');
      const bv = sortField === 'isUrgent' ? (b.isUrgent ? 1 : 0) : (b[sortField] ?? '');
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, searchQuery, sortField, sortDir]);

  return (
    <div style={{ marginBottom: '48px' }}>
      <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', fontWeight: 600, color: '#000000', marginBottom: '20px' }}>{title}</h2>

      <div style={{ maxWidth: '560px', marginBottom: '20px' }}>
        <div style={{ height: '45px', paddingLeft: '16px', paddingRight: '12px', backgroundColor: '#FFFFFF', border: '1px solid #5f6063ab', borderRadius: '30px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <SearchOutlined style={{ color: '#9CA3AF', fontSize: '22px', marginRight: '12px', flexShrink: 0 }} />
          <input type="text" placeholder="Search by reported by, phone or type" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, outline: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#1F2937', backgroundColor: 'transparent' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%', flexShrink: 0 }}><CloseOutlined style={{ color: '#9CA3AF', fontSize: '18px' }} /></button>}
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 0px 20px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f8fb', borderBottom: '1px solid #E5E7EB' }}>
              {columns.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{col.label}<SortIcon field={col.key} /></div>
                </th>
              ))}
              <th style={{ padding: '14px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length + 1} style={{ padding: '56px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF' }}>{searchQuery ? 'No results match your search' : 'No pending requests'}</td></tr>
            ) : filtered.map((row, index) => (
              <tr key={row.id} style={{ borderBottom: index < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: row.isUrgent ? '#FEF2F2' : 'transparent', transition: 'background-color 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = row.isUrgent ? '#FEE2E2' : '#fafbfc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = row.isUrgent ? '#FEF2F2' : 'transparent')}>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.category}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.reportedBy}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', whiteSpace: 'nowrap' }}>{row.memberSince}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937', whiteSpace: 'nowrap' }}>{row.phone}</td>
                {columns.some((c) => c.key === 'isUrgent') && (
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: row.isUrgent ? '#DC2626' : '#6B7280' }}>{row.isUrgent ? 'Yes' : 'No'}</td>
                )}
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={() => onAccept(row.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', backgroundColor: '#b7c9dc', border: '2px solid #b7c9dc', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#000000', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8f9dad'; e.currentTarget.style.borderColor = '#8f9dad'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b7c9dc'; e.currentTarget.style.borderColor = '#b7c9dc'; }}>
                      <CheckOutlined style={{ fontSize: '14px' }} /> Accept
                    </button>
                    <button onClick={() => onReject(row.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', backgroundColor: '#FFFFFF', border: '2px solid #F87171', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#EF4444', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>
                      <CloseOutlined style={{ fontSize: '14px' }} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: '14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
        {filtered.length} pending {filtered.length === 1 ? 'request' : 'requests'}{searchQuery && ' matching your search'}
      </p>
    </div>
  );
};

const LostFoundApproval = () => {
  const navigate = useNavigate();
  const [addRequests,    setAddRequests]    = useState(() => load('flare_pending_lostfound'));
  const [deleteRequests, setDeleteRequests] = useState(() => load('flare_pending_delete_lostfound'));
  const [editRequests,   setEditRequests]   = useState(() => load('flare_pending_edit_lostfound'));

  useEffect(() => {
    setAddRequests(load('flare_pending_lostfound'));
    setDeleteRequests(load('flare_pending_delete_lostfound'));
    setEditRequests(load('flare_pending_edit_lostfound'));
  }, []);

  // ── Add ──
  const handleAddAccept = (id) => {
    const pending  = load('flare_pending_lostfound');
    const item     = pending.find((r) => r.id === id);
    if (item) {
      const approved = load('flare_approved_lostfound');
      save('flare_approved_lostfound', [...approved, item]);
    }
    save('flare_pending_lostfound', pending.filter((r) => r.id !== id));
    setAddRequests((prev) => prev.filter((r) => r.id !== id));
  };
  const handleAddReject = (id) => {
    const pending = load('flare_pending_lostfound');
    save('flare_pending_lostfound', pending.filter((r) => r.id !== id));
    setAddRequests((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Delete ──
  const handleDeleteAccept = (id) => {
    const pending = load('flare_pending_delete_lostfound');
    const req     = pending.find((r) => r.id === id);
    if (req) {
      const approved = load('flare_approved_lostfound');
      save('flare_approved_lostfound', approved.filter((a) => a.id !== req.originalId));
    }
    save('flare_pending_delete_lostfound', pending.filter((r) => r.id !== id));
    setDeleteRequests((prev) => prev.filter((r) => r.id !== id));
  };
  const handleDeleteReject = (id) => {
    const pending = load('flare_pending_delete_lostfound');
    save('flare_pending_delete_lostfound', pending.filter((r) => r.id !== id));
    setDeleteRequests((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Edit ──
  const handleEditAccept = (id) => {
    const pending = load('flare_pending_edit_lostfound');
    const edit    = pending.find((r) => r.id === id);
    if (edit) {
      const approved = load('flare_approved_lostfound');
      save('flare_approved_lostfound', approved.map((a) =>
        a.id === edit.originalId
          ? { ...a, category: edit.category, name: edit.name, location: edit.location, contactInfo: edit.contactInfo, additionalInfo: edit.additionalInfo, image: edit.image, isUrgent: edit.isUrgent }
          : a
      ));
    }
    save('flare_pending_edit_lostfound', pending.filter((r) => r.id !== id));
    setEditRequests((prev) => prev.filter((r) => r.id !== id));
  };
  const handleEditReject = (id) => {
    const pending = load('flare_pending_edit_lostfound');
    save('flare_pending_edit_lostfound', pending.filter((r) => r.id !== id));
    setEditRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />
      <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>
        <div style={{ padding: '40px 40px 40px 30px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>Lost & Found Approvals</h1>
            <button onClick={() => navigate('/lost-found')} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '48px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000', boxShadow: '0 0px 12px rgba(0,0,0,0.18)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}>
              <ArrowBackOutlined style={{ fontSize: '18px' }} /> Back
            </button>
          </div>

          <LFTable title="Add Lost & Found Approval"    rows={addRequests}    onAccept={handleAddAccept}    onReject={handleAddReject} />
          <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '40px' }} />
          <LFTable title="Delete Lost & Found Approval" rows={deleteRequests} onAccept={handleDeleteAccept} onReject={handleDeleteReject} columns={COLUMNS_NO_URGENT} />
          <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '40px' }} />
          <LFTable title="Edit Lost & Found Approval"   rows={editRequests}   onAccept={handleEditAccept}   onReject={handleEditReject} />

        </div>
      </div>
    </div>
  );
};

export default LostFoundApproval;
