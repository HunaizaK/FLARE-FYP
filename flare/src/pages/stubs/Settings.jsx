import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import Navbar from '../../components/Navbar';
import { setUser, logout } from '../../features/auth/authSlice';

// ── helpers ──────────────────────────────────────────────────────────────────

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
      backgroundColor: '#577a92', color: '#fff', border: 'none',
      borderRadius: '10px', fontFamily: 'Inter, sans-serif',
      fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45647a'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#577a92'}
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
      backgroundColor: checked ? '#577a92' : '#D1D5DB',
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

// ── main component ────────────────────────────────────────────────────────────

const Settings = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const currentUser   = useSelector((s) => s.auth.user);
  const accountType   = useSelector((s) => s.auth.accountType);

  const account = getAccounts().find((a) => a.userName === currentUser) || {};

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
        className="absolute top-0 h-full overflow-y-auto"
        style={{ left: '146px', width: 'calc(100% - 146px)' }}
      >
        <div style={{ padding: '40px', maxWidth: '680px' }}>

          <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000', marginBottom: '28px', marginTop: 0 }}>
            Settings
          </h1>

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
                <TextInput value={profile.contactNo} placeholder="03XX-XXXXXXX" maxLength={11} onChange={(e) => setProfile({ ...profile, contactNo: e.target.value })} />
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#1F2937', margin: 0 }}>
                  Disaster Alerts
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                  Receive notifications about active disasters in your area
                </p>
              </div>
              <Toggle checked={notifs.disasterAlerts} onChange={handleNotifToggle} />
            </div>
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
                  backgroundColor: account.approved ? '#F0FDF4' : '#FFF7ED',
                  color: account.approved ? '#15803D' : '#C2410C',
                  padding: '3px 12px', borderRadius: '20px',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                }}>
                  {account.approved ? 'Active' : 'Pending Approval'}
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
    </div>
  );
};

export default Settings;
