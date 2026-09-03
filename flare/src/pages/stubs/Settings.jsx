import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import {
  SearchOutlined, CloseOutlined,
  KeyboardArrowUpOutlined, KeyboardArrowDownOutlined,
  UnfoldMoreOutlined,
} from '@mui/icons-material';
import Navbar from '../../components/Navbar';
import PhoneInput from '../../components/PhoneInput';
import { setUser, logout } from '../../features/auth/authSlice';
import api from '../../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────

const getAccounts = () => JSON.parse(localStorage.getItem('flare_accounts') || '[]');
const saveAccounts = (arr) => localStorage.setItem('flare_accounts', JSON.stringify(arr));

const getNotifPrefs = (userName) => {
  const prefs = JSON.parse(localStorage.getItem('flare_notif_prefs') || '{}');
  return prefs[userName] ?? { disasterAlerts: true };
};
const saveNotifPrefs = (userName, prefs) => {
  const all = JSON.parse(localStorage.getItem('flare_notif_prefs') || '{}');
  all[userName] = prefs;
  localStorage.setItem('flare_notif_prefs', JSON.stringify(all));
};

const validatePassword = (pw) => {
  if (pw.length < 8)                          return 'At least 8 characters required.';
  if (!/[A-Z]/.test(pw))                      return 'Must contain an uppercase letter.';
  if (!/[a-z]/.test(pw))                      return 'Must contain a lowercase letter.';
  if (!/[0-9]/.test(pw))                      return 'Must contain a number.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw))    return 'Must contain a special character.';
  return '';
};

// ── My Requests constants ─────────────────────────────────────────────────────

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

const REQ_COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'action',   label: 'Action' },
  { key: 'status',   label: 'Status' },
  { key: 'date',     label: 'Date' },
];

// ── sub-components ────────────────────────────────────────────────────────────

const SectionCard = ({ title, children }) => (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0px 0px 20px rgba(0,0,0,0.07)',
    border: '1px solid #E5E7EB',
    padding: '32px',
    marginBottom: '24px',
  }}>
    <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 600, color: '#1F618A', marginBottom: '24px', marginTop: 0 }}>
      {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: '6px' }}>
      {label}
    </label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', maxLength }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    maxLength={maxLength}
    style={{
      width: '100%', height: '44px', borderRadius: '10px',
      border: '1px solid #D1D5DB', padding: '0 14px',
      fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937',
      outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
    }}
  />
);

const PasswordInput = ({ value, onChange, placeholder, show, onToggle }) => (
  <div style={{ position: 'relative' }}>
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%', height: '44px', borderRadius: '10px',
        border: '1px solid #D1D5DB', padding: '0 44px 0 14px',
        fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F2937',
        outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
      }}
    />
    <button type="button" onClick={onToggle} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
      {show
        ? <AiOutlineEye style={{ width: '18px', height: '18px', color: '#9CA3AF' }} />
        : <AiOutlineEyeInvisible style={{ width: '18px', height: '18px', color: '#9CA3AF' }} />}
    </button>
  </div>
);

const SaveButton = ({ onClick, label = 'Save Changes' }) => (
  <button
    onClick={onClick}
    style={{
      marginTop: '8px', height: '42px', padding: '0 24px',
      backgroundColor: '#b7c9dc', color: '#000', border: 'none',
      borderRadius: '10px', fontFamily: 'Inter, sans-serif',
      fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}
  >
    {label}
  </button>
);

const StatusMsg = ({ msg, isError }) =>
  msg ? (
    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', marginTop: '10px', color: isError ? '#EF4444' : '#16A34A' }}>
      {msg}
    </p>
  ) : null;

const Toggle = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: '46px', height: '26px', borderRadius: '13px', cursor: 'pointer',
      backgroundColor: checked ? '#b7c9dc' : '#D1D5DB',
      position: 'relative', transition: 'background-color 0.2s',
      flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: '3px',
      left: checked ? '23px' : '3px',
      width: '20px', height: '20px', borderRadius: '50%',
      backgroundColor: '#fff', transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </div>
);

const RoleBadge = ({ role }) => {
  const colors = {
    admin:        { bg: '#EFF6FF', text: '#1D4ED8' },
    organization: { bg: '#F0FDF4', text: '#15803D' },
    citizen:      { bg: '#FFF7ED', text: '#C2410C' },
  };
  const c = colors[role] || colors.citizen;
  const label = role === 'admin' ? 'Admin' : role === 'organization' ? 'Organization' : 'Citizen';
  return (
    <span style={{
      backgroundColor: c.bg, color: c.text,
      padding: '3px 12px', borderRadius: '20px',
      fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
    }}>
      {label}
    </span>
  );
};

const MyRequestsSection = () => {
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
    <SectionCard title="My Requests">
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

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f8fb', borderBottom: '1px solid #E5E7EB' }}>
              {REQ_COLUMNS.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#6B7280', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{col.label}<SortIcon field={col.key} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF' }}>{searchQuery ? 'No results match your search' : 'No requests submitted yet'}</td></tr>
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
      <p style={{ marginTop: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
        {rows.length} {rows.length === 1 ? 'request' : 'requests'}{searchQuery && ' matching your search'}
      </p>
    </SectionCard>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const Settings = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const currentUser   = useSelector((s) => s.auth.user);
  const accountType   = useSelector((s) => s.auth.accountType);
  const authToken     = useSelector((s) => s.auth.token);

  // If a user has a valid session token they are by definition approved & active.
  // (The backend rejects login for unapproved accounts, so a token = active.)
  const account = getAccounts().find((a) => a.userName === currentUser) || {};
  const isActive = !!authToken || !!account.approved;

  // ── profile ──
  const [profile, setProfile] = useState({
    userName:  account.userName  || '',
    email:     account.email     || '',
    contactNo: account.contactNo || '',
  });
  const [profileMsg,   setProfileMsg]   = useState('');
  const [profileError, setProfileError] = useState('');

  const handleProfileSave = () => {
    setProfileMsg(''); setProfileError('');
    const accounts = getAccounts();
    if (profile.userName !== currentUser && accounts.some((a) => a.userName === profile.userName)) {
      setProfileError('Username is already taken.'); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) { setProfileError('Enter a valid email address.'); return; }
    const phoneRegex = /^03[0-9]{9}$/;
    if (!phoneRegex.test(profile.contactNo.replace(/\s|-/g, ''))) { setProfileError('Phone number must be exactly 11 digits'); return; }

    saveAccounts(accounts.map((a) =>
      a.userName === currentUser
        ? { ...a, userName: profile.userName, email: profile.email, contactNo: profile.contactNo }
        : a
    ));
    if (profile.userName !== currentUser) dispatch(setUser(profile.userName));
    setProfileMsg('Profile updated successfully.');
  };

  // ── password ──
  const [pw, setPw] = useState({ current: '', newPass: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });
  const [pwMsg,   setPwMsg]   = useState('');
  const [pwError, setPwError] = useState('');

  const handlePasswordSave = () => {
    setPwMsg(''); setPwError('');
    const acc = getAccounts().find((a) => a.userName === currentUser);
    if (!acc || acc.password !== pw.current) { setPwError('Current password is incorrect.'); return; }
    const err = validatePassword(pw.newPass);
    if (err) { setPwError(err); return; }
    if (pw.newPass !== pw.confirm) { setPwError('New passwords do not match.'); return; }
    saveAccounts(getAccounts().map((a) =>
      a.userName === currentUser ? { ...a, password: pw.newPass } : a
    ));
    setPw({ current: '', newPass: '', confirm: '' });
    setPwMsg('Password changed successfully.');
  };

  // ── notifications ──
  const [notifs, setNotifs] = useState(() => getNotifPrefs(currentUser));

  const handleNotifToggle = () => {
    const updated = { ...notifs, disasterAlerts: !notifs.disasterAlerts };
    setNotifs(updated);
    saveNotifPrefs(currentUser, updated);
  };

  // ── newsletter ──
  const [newsletterOn, setNewsletterOn] = useState(
    localStorage.getItem('floodUpdatesPreference') === 'yes'
  );
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);

  const handleNewsletterToggle = () => {
    if (!newsletterOn) {
      const pending = JSON.parse(localStorage.getItem('flare_pending_newsletters') || '[]');
      if (!pending.some((r) => r.username === currentUser)) {
        pending.push({ id: Date.now(), username: currentUser, submittedAt: new Date().toISOString() });
        localStorage.setItem('flare_pending_newsletters', JSON.stringify(pending));
      }
      localStorage.setItem('floodUpdatesPreference', 'yes');
      setNewsletterOn(true);
      setShowNewsletterPopup(true);
    } else {
      const pending = JSON.parse(localStorage.getItem('flare_pending_newsletters') || '[]');
      localStorage.setItem('flare_pending_newsletters', JSON.stringify(
        pending.filter((r) => r.username !== currentUser)
      ));
      localStorage.removeItem('floodUpdatesPreference');
      setNewsletterOn(false);
    }
  };

  // ── delete account ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = () => {
    saveAccounts(getAccounts().filter((a) => a.userName !== currentUser));
    dispatch(logout());
    navigate('/login');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      <Navbar />

      <div
        className="flare-page-main absolute top-0 h-full overflow-y-auto"
        style={{ left: 'var(--nav-left)', width: 'var(--nav-width)', paddingBottom: 'var(--nav-bottom-pad)' }}
      >
        <div style={{ padding: '40px' }}>

          <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000', marginBottom: '28px', marginTop: 0 }}>
            Settings
          </h1>

          {/* ── My Requests (citizen & org only) ── */}
          {(accountType === 'citizen' || accountType === 'organization') && <MyRequestsSection />}

          {/* ── Profile ── */}
          <SectionCard title="Profile">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <Field label="Username">
                <TextInput value={profile.userName} placeholder="Username" onChange={(e) => setProfile({ ...profile, userName: e.target.value })} />
              </Field>
              <Field label="Email">
                <TextInput value={profile.email} placeholder="Email" onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </Field>
              <Field label="Phone Number">
                <PhoneInput
                  value={profile.contactNo}
                  onChange={(value) => setProfile({ ...profile, contactNo: value })}
                  placeholder="333 3333333"
                  maxLength={10}
                />
              </Field>
            </div>
            <SaveButton onClick={handleProfileSave} />
            <StatusMsg msg={profileMsg}   isError={false} />
            <StatusMsg msg={profileError} isError={true}  />

            {/* divider */}
            <div style={{ borderTop: '1px solid #F3F4F6', margin: '28px 0' }} />

            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '16px', marginTop: 0 }}>
              Change Password
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
              <Field label="Current Password">
                <PasswordInput value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="Current" show={showPw.current} onToggle={() => setShowPw({ ...showPw, current: !showPw.current })} />
              </Field>
              <Field label="New Password">
                <PasswordInput value={pw.newPass} onChange={(e) => setPw({ ...pw, newPass: e.target.value })} placeholder="New" show={showPw.newPass} onToggle={() => setShowPw({ ...showPw, newPass: !showPw.newPass })} />
              </Field>
              <Field label="Confirm Password">
                <PasswordInput value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Confirm" show={showPw.confirm} onToggle={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} />
              </Field>
            </div>
            <SaveButton onClick={handlePasswordSave} label="Update Password" />
            <StatusMsg msg={pwMsg}   isError={false} />
            <StatusMsg msg={pwError} isError={true}  />
          </SectionCard>

          {/* ── Notifications ── */}
          <SectionCard title="Notifications">
            {(accountType === 'citizen' || accountType === 'organization') && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#1F2937', margin: 0 }}>
                      Newsletter
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                      Receive daily email updates about flood alerts and relief efforts
                    </p>
                  </div>
                  <Toggle checked={newsletterOn} onChange={handleNewsletterToggle} />
                </div>
              </>
            )}
          </SectionCard>

          {/* ── Account ── */}
          <SectionCard title="Account">
            {/* role & status */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '28px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', marginBottom: '6px', marginTop: 0 }}>Role</p>
                <RoleBadge role={accountType} />
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', marginBottom: '6px', marginTop: 0 }}>Status</p>
                <span style={{
                  backgroundColor: isActive ? '#F0FDF4' : '#FFF7ED',
                  color: isActive ? '#15803D' : '#C2410C',
                  padding: '3px 12px', borderRadius: '20px',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                }}>
                  {isActive ? 'Active' : 'Pending Approval'}
                </span>
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', marginBottom: '6px', marginTop: 0 }}>Username</p>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{currentUser}</span>
              </div>
            </div>

            {/* logout */}
            <button
              onClick={handleLogout}
              style={{
                height: '42px', padding: '0 24px', marginRight: '12px',
                backgroundColor: '#fff', color: '#374151',
                border: '1.5px solid #D1D5DB', borderRadius: '10px',
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              Logout
            </button>

            {/* delete */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  height: '42px', padding: '0 24px',
                  backgroundColor: '#fff', color: '#EF4444',
                  border: '1.5px solid #FCA5A5', borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                Delete Account
              </button>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                  Are you sure? This cannot be undone.
                </span>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    height: '36px', padding: '0 18px',
                    backgroundColor: '#EF4444', color: '#fff',
                    border: 'none', borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    height: '36px', padding: '0 18px',
                    backgroundColor: '#fff', color: '#374151',
                    border: '1.5px solid #D1D5DB', borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </SectionCard>

        </div>
      </div>

      {showNewsletterPopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, paddingTop: '220px' }}>
          <div style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', paddingTop: '80px' }}>
            <img src="/approval.png" alt="Approval" style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5, paddingTop: '20px' }}>
              Your newsletter subscription request has been submitted for verification.<br />
              You will be notified once your request is approved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowNewsletterPopup(false)}
                style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
