import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { purgeUserShelters } from '../../features/shelters/sheltersSlice';
import Navbar from '../../components/Navbar';
import {
  SearchOutlined,
  CloseOutlined,
  KeyboardArrowUpOutlined,
  KeyboardArrowDownOutlined,
  UnfoldMoreOutlined,
  DeleteOutlined,
} from '@mui/icons-material';

const ROLE_LABEL = {
  organization: 'Organization',
  citizen:      'Citizen',
};

const loadApprovedUsers = () => {
  try {
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    return accounts
      .filter((a) => a.role !== 'admin' && a.approved !== false)
      .map((a) => ({
        id:        a.userName,
        email:     a.email      || '—',
        phone:     a.contactNo  || '—',
        role:      ROLE_LABEL[a.role] || a.role,
        username:  a.userName,
        userSince: a.submittedAt || '—',
      }));
  } catch {
    return [];
  }
};

const COLUMNS = [
  { key: 'email',     label: 'Email' },
  { key: 'phone',     label: 'Phone Number' },
  { key: 'role',      label: 'User' },
  { key: 'username',  label: 'Username' },
  { key: 'userSince', label: 'User Since' },
];

const UserList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [users, setUsers]               = useState(loadApprovedUsers);
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortField, setSortField]       = useState('username');
  const [sortDir, setSortDir]           = useState('asc');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const pendingCount = useMemo(() => {
    try {
      const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
      return accounts.filter((a) => a.role !== 'admin' && a.approved === false).length;
    } catch { return 0; }
  }, [users]);

  const refresh = () => setUsers(loadApprovedUsers());

  const handleRemove = (username) => {
    // Remove account
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    localStorage.setItem('flare_accounts', JSON.stringify(accounts.filter((a) => a.userName !== username)));

    // Remove shelters via Redux (syncs both state and localStorage)
    dispatch(purgeUserShelters(username));

    // Remove donations (all queues)
    ['flare_donations', 'flare_pending_add_donations', 'flare_pending_delete_donations', 'flare_pending_edit_donations'].forEach((key) => {
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(items.filter((d) => d.submittedBy !== username)));
    });

    // Remove lost & found entries (all queues)
    ['flare_approved_lostfound', 'flare_pending_lostfound', 'flare_pending_delete_lostfound', 'flare_pending_edit_lostfound'].forEach((key) => {
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(items.filter((d) => d.reportedBy !== username)));
    });

    setUsers((prev) => prev.filter((u) => u.username !== username));
    setConfirmTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <UnfoldMoreOutlined style={{ fontSize: '16px', color: '#9CA3AF' }} />;
    return sortDir === 'asc'
      ? <KeyboardArrowUpOutlined style={{ fontSize: '16px', color: '#1F618A' }} />
      : <KeyboardArrowDownOutlined style={{ fontSize: '16px', color: '#1F618A' }} />;
  };

  const rows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.email.toLowerCase().includes(q)    ||
        u.phone.toLowerCase().includes(q)    ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, searchQuery, sortField, sortDir]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <div
        className="absolute top-0 h-full transition-all duration-300 overflow-y-auto"
        style={{ left: '146px', width: 'calc(100% - 146px)' }}
      >
        <div style={{ padding: '40px 40px 40px 30px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>
              Users
            </h1>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                onClick={() => { refresh(); navigate('/admin/signup-approvals'); }}
                style={{
                  height: '48px', padding: '0 24px', borderRadius: '12px',
                  backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000',
                  boxShadow: '0 0px 12px rgba(0, 0, 0, 0.18)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}
              >
                Approve Requests
              </button>
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', minWidth: '20px', height: '20px', backgroundColor: '#EF4444', color: '#FFFFFF', borderRadius: '50%', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box', pointerEvents: 'none' }}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ maxWidth: '560px', marginBottom: '20px' }}>
            <div style={{
              height: '45px', paddingLeft: '16px', paddingRight: '12px',
              backgroundColor: '#FFFFFF', border: '1px solid #5f6063ab',
              borderRadius: '30px', display: 'flex', alignItems: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            }}>
              <SearchOutlined style={{ color: '#9CA3AF', fontSize: '22px', marginRight: '12px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by email, phone, username or user type"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, outline: 'none', border: 'none',
                  fontFamily: 'Inter, sans-serif', fontSize: '15px',
                  color: '#1F2937', backgroundColor: 'transparent',
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
            backgroundColor: '#FFFFFF', borderRadius: '16px',
            boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E5E7EB', overflowX: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f8fb', borderBottom: '1px solid #E5E7EB' }}>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: '14px 20px', textAlign: 'left',
                        fontFamily: 'Inter, sans-serif', fontSize: '13px',
                        fontWeight: 600, color: '#6B7280',
                        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {col.label}
                        <SortIcon field={col.key} />
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    Remove Account
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: '56px', textAlign: 'center',
                      fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF',
                    }}>
                      {searchQuery ? 'No results match your search' : 'No approved users yet'}
                    </td>
                  </tr>
                ) : (
                  rows.map((user, index) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: index < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937', whiteSpace: 'nowrap' }}>
                        {user.phone}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>
                        {user.role}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937' }}>
                        {user.username}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {user.userSince}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => setConfirmTarget(user)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto', padding: '6px 14px', backgroundColor: '#FFFFFF', border: '2px solid #F87171', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#EF4444', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                        >
                          <DeleteOutlined style={{ fontSize: '15px' }} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
            {rows.length} {rows.length === 1 ? 'user' : 'users'}
            {searchQuery && ' matching your search'}
          </p>

        </div>
      </div>

      {confirmTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', fontWeight: 600, color: '#000000', marginBottom: '12px', marginTop: 0 }}>Remove Account</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#4B5563', marginBottom: '28px', lineHeight: 1.6 }}>
              Are you sure you want to remove <strong>{confirmTarget.username}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmTarget(null)}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(confirmTarget.username)}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
