import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  KeyboardArrowUpOutlined,
  KeyboardArrowDownOutlined,
  UnfoldMoreOutlined,
  ArrowBackOutlined,
} from '@mui/icons-material';

const loadAddRequests = () => {
  try {
    return JSON.parse(localStorage.getItem('flare_pending_add_donations') || '[]')
      .map((r) => ({ ...r, accountHolder: r.name }));
  } catch { return []; }
};

const loadDeleteRequests = () => {
  try {
    return JSON.parse(localStorage.getItem('flare_pending_delete_donations') || '[]')
      .map((r) => ({ ...r, accountHolder: r.name }));
  } catch { return []; }
};

const loadEditRequests = () => {
  try {
    return JSON.parse(localStorage.getItem('flare_pending_edit_donations') || '[]')
      .map((r) => ({ ...r, accountHolder: r.name }));
  } catch { return []; }
};

const COLUMNS = [
  { key: 'email',         label: 'Email' },
  { key: 'phone',         label: 'Phone Number' },
  { key: 'accountHolder', label: 'Account Holder Name' },
  { key: 'bankName',      label: 'Bank Name' },
  { key: 'iban',          label: 'IBAN Number' },
];

const DonationTable = ({ title, initialData, onAccept, onReject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData]               = useState(initialData);
  const [sortField, setSortField]     = useState('email');
  const [sortDir, setSortDir]         = useState('asc');

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleAccept = (id) => { onAccept(id); setData((prev) => prev.filter((r) => r.id !== id)); };
  const handleReject = (id) => { onReject(id); setData((prev) => prev.filter((r) => r.id !== id)); };

  const rows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = data.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, searchQuery, sortField, sortDir]);

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <UnfoldMoreOutlined style={{ fontSize: '16px', color: '#9CA3AF' }} />;
    return sortDir === 'asc'
      ? <KeyboardArrowUpOutlined style={{ fontSize: '16px', color: '#1F618A' }} />
      : <KeyboardArrowDownOutlined style={{ fontSize: '16px', color: '#1F618A' }} />;
  };

  return (
    <div style={{ marginBottom: '48px' }}>

      {/* Section title */}
      <h2 style={{
        fontFamily: 'Lexend, sans-serif',
        fontSize: '20px',
        fontWeight: 600,
        color: '#000000',
        marginBottom: '20px',
      }}>
        {title}
      </h2>

      {/* Search bar */}
      <div style={{ maxWidth: '560px', marginBottom: '20px' }}>
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
            placeholder="Search by email or phone number"
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
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
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
                <td colSpan={6} style={{
                  padding: '56px',
                  textAlign: 'center',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  color: '#9CA3AF',
                }}>
                  {searchQuery ? 'No results match your search' : 'No pending requests'}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: index < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>
                    {row.email}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937', whiteSpace: 'nowrap' }}>
                    {row.phone}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>
                    {row.accountHolder}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937', whiteSpace: 'nowrap' }}>
                    {row.bankName}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {row.iban}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleAccept(row.id)}
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
                        onClick={() => handleReject(row.id)}
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
  );
};

const DonationApproval = () => {
  const navigate = useNavigate();
  const [addRequests, setAddRequests]       = useState(loadAddRequests);
  const [deleteRequests, setDeleteRequests] = useState(loadDeleteRequests);
  const [editRequests, setEditRequests]     = useState(loadEditRequests);

  useEffect(() => {
    setAddRequests(loadAddRequests());
    setDeleteRequests(loadDeleteRequests());
    setEditRequests(loadEditRequests());
  }, []);

  const handleAddAccept = (id) => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_add_donations') || '[]');
    const item = pending.find((r) => r.id === id);
    if (item) {
      const donations = JSON.parse(localStorage.getItem('flare_donations') || '[]');
      donations.push({ id: item.id, name: item.name, bankName: item.bankName, iban: item.iban, submittedBy: item.submittedBy });
      localStorage.setItem('flare_donations', JSON.stringify(donations));
    }
    localStorage.setItem('flare_pending_add_donations', JSON.stringify(pending.filter((r) => r.id !== id)));
    setAddRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddReject = (id) => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_add_donations') || '[]');
    localStorage.setItem('flare_pending_add_donations', JSON.stringify(pending.filter((r) => r.id !== id)));
    setAddRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteAccept = (id) => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_delete_donations') || '[]');
    localStorage.setItem('flare_pending_delete_donations', JSON.stringify(pending.filter((r) => r.id !== id)));
    const donations = JSON.parse(localStorage.getItem('flare_donations') || '[]');
    localStorage.setItem('flare_donations', JSON.stringify(donations.filter((d) => d.id !== id)));
    setDeleteRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteReject = (id) => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_delete_donations') || '[]');
    localStorage.setItem('flare_pending_delete_donations', JSON.stringify(pending.filter((r) => r.id !== id)));
    setDeleteRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEditAccept = (id) => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_edit_donations') || '[]');
    const edit = pending.find((r) => r.id === id);
    if (edit) {
      const donations = JSON.parse(localStorage.getItem('flare_donations') || '[]');
      localStorage.setItem('flare_donations', JSON.stringify(
        donations.map((d) => d.id === edit.originalId
          ? { ...d, name: edit.name, bankName: edit.bankName, iban: edit.iban }
          : d
        )
      ));
    }
    localStorage.setItem('flare_pending_edit_donations', JSON.stringify(pending.filter((r) => r.id !== id)));
    setEditRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEditReject = (id) => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_edit_donations') || '[]');
    localStorage.setItem('flare_pending_edit_donations', JSON.stringify(pending.filter((r) => r.id !== id)));
    setEditRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <div
        className="absolute top-0 h-full transition-all duration-300 overflow-y-auto"
        style={{ left: '146px', width: 'calc(100% - 146px)' }}
      >
        <div style={{ padding: '40px 40px 40px 30px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>
              Donation Approvals
            </h1>
            <button
              onClick={() => navigate('/donation')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                height: '48px', padding: '0 24px', borderRadius: '12px',
                backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000',
                boxShadow: '0 0px 12px rgba(0, 0, 0, 0.18)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}
            >
              <ArrowBackOutlined style={{ fontSize: '18px', color: '#000000' }} />
              Back
            </button>
          </div>

          <DonationTable
            title="Add Donation Approval"
            initialData={addRequests}
            onAccept={handleAddAccept}
            onReject={handleAddReject}
          />

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '40px' }} />

          <DonationTable
            title="Delete Donation Approval"
            initialData={deleteRequests}
            onAccept={handleDeleteAccept}
            onReject={handleDeleteReject}
          />

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '40px' }} />

          <DonationTable
            title="Edit Donation Approval"
            initialData={editRequests}
            onAccept={handleEditAccept}
            onReject={handleEditReject}
          />

        </div>
      </div>
    </div>
  );
};

export default DonationApproval;
