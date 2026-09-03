import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  SearchOutlined, CheckOutlined, CloseOutlined,
  KeyboardArrowUpOutlined, KeyboardArrowDownOutlined,
  UnfoldMoreOutlined, ArrowBackOutlined,
} from '@mui/icons-material';
import api from '../../services/api';

const ShelterTable = ({ title, rows, onAccept, onReject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField]     = useState('shelter_name');
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
      (r) => (r.submittedBy  ?? '').toLowerCase().includes(q) ||
             (r.shelter_name ?? '').toLowerCase().includes(q)
    );
    return [...f].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
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
          <input type="text" placeholder="Search by username or shelter name" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, outline: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#1F2937', backgroundColor: 'transparent' }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%', flexShrink: 0 }}>
              <CloseOutlined style={{ color: '#9CA3AF', fontSize: '18px' }} />
            </button>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 0px 20px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f8fb', borderBottom: '1px solid #E5E7EB' }}>
              {[
                { key: 'submittedBy',  label: 'Submitted By' },
                { key: 'shelter_name', label: 'Shelter Name' },
                { key: 'capacity',     label: 'Capacity' },
                { key: 'phone_number', label: 'Phone Number' },
                { key: 'location',     label: 'Location' },
              ].map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{col.label}<SortIcon field={col.key} /></div>
                </th>
              ))}
              <th style={{ padding: '14px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '56px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF' }}>{searchQuery ? 'No results match your search' : 'No pending requests'}</td></tr>
            ) : filtered.map((row, index) => (
              <tr key={row.id} style={{ borderBottom: index < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background-color 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.submittedBy}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.shelter_name}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937', whiteSpace: 'nowrap' }}>{row.capacity}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937', whiteSpace: 'nowrap' }}>{row.phone_number}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>{row.location}</td>
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

const mapRow = (r) => ({
  id:           String(r.id),
  submittedBy:  r.username                   || '—',
  shelter_name: r.payload?.shelter_name      || '—',
  capacity:     r.payload?.capacity          ?? '—',
  phone_number: r.contact_no                 || '—',
  location:     r.payload?.location          || '—',
});

const ShelterApproval = () => {
  const navigate = useNavigate();
  const [addRequests,    setAddRequests]    = useState([]);
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [editRequests,   setEditRequests]   = useState([]);

  const loadRequests = useCallback(async () => {
    try {
      const res      = await api.get('/change-requests?status=pending');
      const shelters = res.data.data.filter((r) => r.table_name === 'shelters');
      setAddRequests(shelters.filter((r) => r.request_type === 'add').map(mapRow));
      setDeleteRequests(shelters.filter((r) => r.request_type === 'delete').map(mapRow));
      setEditRequests(shelters.filter((r) => r.request_type === 'edit').map(mapRow));
    } catch (err) {
      console.error('Failed to load shelter change requests:', err);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleAccept = async (id, setter) => {
    try {
      await api.put(`/change-requests/${id}/approve`);
      setter((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve request.');
    }
  };

  const handleReject = async (id, setter) => {
    try {
      await api.put(`/change-requests/${id}/reject`);
      setter((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject request.');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />
      <div className="flare-page-main absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: 'var(--nav-left)', width: 'var(--nav-width)', paddingBottom: 'var(--nav-bottom-pad)' }}>
        <div style={{ padding: '40px 40px 40px 30px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>Shelter Approvals</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigate('/admin/shelter-list')} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '48px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000', boxShadow: '0 0px 12px rgba(0,0,0,0.18)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}>
                <ArrowBackOutlined style={{ fontSize: '18px', color: '#000000' }} /> Back
              </button>
            </div>
          </div>

          <ShelterTable title="Add Shelter Approval"    rows={addRequests}    onAccept={(id) => handleAccept(id, setAddRequests)}    onReject={(id) => handleReject(id, setAddRequests)} />
          <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '40px' }} />
          <ShelterTable title="Delete Shelter Approval" rows={deleteRequests} onAccept={(id) => handleAccept(id, setDeleteRequests)} onReject={(id) => handleReject(id, setDeleteRequests)} />
          <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '40px' }} />
          <ShelterTable title="Edit Shelter Approval"   rows={editRequests}   onAccept={(id) => handleAccept(id, setEditRequests)}   onReject={(id) => handleReject(id, setEditRequests)} />

        </div>
      </div>
    </div>
  );
};

export default ShelterApproval;
