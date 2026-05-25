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

const loadPendingOrgs = () => {
  try {
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    return accounts
      .filter((a) => a.role === 'organization' && a.approved === false)
      .map((a) => ({
        id: a.userName,
        email: a.email,
        phone: a.contactNo,
        username: a.userName,
        submittedAt: a.submittedAt || '',
      }));
  } catch {
    return [];
  }
};

const COLUMNS = [
  { key: 'email',       label: 'Email' },
  { key: 'phone',       label: 'Phone Number' },
  { key: 'username',    label: 'Username' },
  { key: 'submittedAt', label: 'Approval Date' },
];

const SignUpApproval = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(loadPendingOrgs);
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    setUsers(loadPendingOrgs());
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleAccept = (id) => {
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    const updated = accounts.map((a) => a.userName === id ? { ...a, approved: true } : a);
    localStorage.setItem('flare_accounts', JSON.stringify(updated));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleReject = (id) => {
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    const updated = accounts.filter((a) => a.userName !== id);
    localStorage.setItem('flare_accounts', JSON.stringify(updated));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const rows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, searchQuery, sortField, sortDir]);

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
        className="absolute top-0 h-full transition-all duration-300 overflow-y-auto"
        style={{ left: '146px', width: 'calc(100% - 146px)' }}
      >
        <div style={{ padding: '40px 40px 40px 30px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', margin: 0 }}>
              Sign-up Approvals
            </h1>
            <button
              onClick={() => navigate('/admin/users')}
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

          {/* Search bar */}
          <div style={{ maxWidth: '560px', marginBottom: '32px' }}>
            <div
              style={{
                height: '45px',
                paddingLeft: '16px',
                paddingRight: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #5f6063ab',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}
            >
              <SearchOutlined
                style={{ color: '#9CA3AF', fontSize: '22px', marginRight: '12px', flexShrink: 0 }}
              />
              <input
                type="text"
                placeholder="Search by email, phone, or username"
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
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                >
                  <CloseOutlined style={{ color: '#9CA3AF', fontSize: '18px' }} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
            }}
          >
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
                  <th
                    style={{
                      padding: '14px 20px',
                      textAlign: 'center',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '56px',
                        textAlign: 'center',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px',
                        color: '#9CA3AF',
                      }}
                    >
                      {searchQuery ? 'No results match your search' : 'No pending approvals'}
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
                      <td
                        style={{
                          padding: '16px 20px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1F2937',
                        }}
                      >
                        {user.email}
                      </td>
                      <td
                        style={{
                          padding: '16px 20px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1F2937',
                        }}
                      >
                        {user.phone}
                      </td>
                      <td
                        style={{
                          padding: '16px 20px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1F2937',
                        }}
                      >
                        {user.username}
                      </td>
                      <td
                        style={{
                          padding: '16px 20px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#6B7280',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.submittedAt}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {/* Accept */}
                          <button
                            onClick={() => handleAccept(user.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 14px',
                              backgroundColor: '#b7c9dc',
                              border: '2px solid #b7c9dc',
                              borderRadius: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#000000',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#8f9dad';
                              e.currentTarget.style.borderColor = '#8f9dad';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#b7c9dc';
                              e.currentTarget.style.borderColor = '#b7c9dc';
                            }}
                          >
                            <CheckOutlined style={{ fontSize: '14px' }} />
                            Accept
                          </button>

                          {/* Reject */}
                          <button
                            onClick={() => handleReject(user.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 14px',
                              backgroundColor: '#FFFFFF',
                              border: '2px solid #F87171',
                              borderRadius: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#EF4444',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEF2F2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                            }}
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

          {/* Row count */}
          <p
            style={{
              marginTop: '14px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#9CA3AF',
            }}
          >
            {rows.length} pending {rows.length === 1 ? 'request' : 'requests'}
            {searchQuery && ' matching your search'}
          </p>

        </div>
      </div>
    </div>
  );
};

export default SignUpApproval;
