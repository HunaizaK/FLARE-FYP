import { useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setAccountType, setToken, setUserId } from '../../features/auth/authSlice';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Default true so mobile devices see correct layout on first paint
  const [isMobile, setIsMobile] = useState(true);

  // useLayoutEffect fires before the browser paints — no layout flash
  useLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [formData, setFormData]         = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError]     = useState('');
  const [isLoading, setIsLoading]       = useState(false);

  const isFormComplete = formData.username && formData.password;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (loginError) setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });
      const { access_token, username, role, user_id } = res.data;
      sessionStorage.setItem('flare_token',   access_token);
      sessionStorage.setItem('flare_user',    username);
      sessionStorage.setItem('flare_role',    role);
      sessionStorage.setItem('flare_user_id', user_id);
      dispatch(setUser(username));
      dispatch(setAccountType(role));
      dispatch(setToken(access_token));
      dispatch(setUserId(user_id));
      navigate('/maps');
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      setLoginError(
        detail === 'Organization not approved yet'
          ? 'Your account is pending admin approval. Please wait for approval before logging in.'
          : 'Invalid username or password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Reusable pieces ─── */
  const inputStyle = {
    width: '100%', height: 48, borderRadius: 30,
    border: '1px solid #E5E7EB', padding: '0 20px',
    fontFamily: 'Inter, sans-serif', fontSize: 14,
    backgroundColor: '#fff', color: '#374151',
    outline: 'none', boxSizing: 'border-box',
  };

  const form = (
    <>
      <button onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
          color: '#fff', marginBottom: 16, padding: 0,
        }}>
        ← Back
      </button>
      <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: isMobile ? 32 : 40, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
        Login
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fbfcff', marginBottom: 20 }}>
        Please log in to your account to continue.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 8 }}>
            Username
          </label>
          <input
            type="text" name="username"
            value={formData.username} onChange={handleChange}
            placeholder="Enter your username" required
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#fff' }}>
              Password
            </label>
            <button type="button" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#fff', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Forgot Password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password} onChange={handleChange}
              placeholder="Enter your password" required
              style={{ ...inputStyle, paddingRight: 48 }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {showPassword
                ? <AiOutlineEye style={{ width: 20, height: 20, color: '#9CA3AF' }} />
                : <AiOutlineEyeInvisible style={{ width: 20, height: 20, color: '#9CA3AF' }} />}
            </button>
          </div>
        </div>

        {loginError && (
          <p style={{ color: '#EF4444', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{loginError}</p>
        )}

        <button type="submit" disabled={!isFormComplete || isLoading}
          style={{
            width: '100%', height: 48, borderRadius: 16, border: 'none', outline: 'none', marginTop: 8,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, boxSizing: 'border-box',
            backgroundColor: isFormComplete && !isLoading ? '#b7c9dc' : '#9CA3AF',
            color: '#000', cursor: isFormComplete && !isLoading ? 'pointer' : 'not-allowed',
          }}>
          {isLoading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff' }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/createacc')}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff', textDecoration: 'underline', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Sign Up
          </button>
        </p>
      </div>
    </>
  );

  /* ════════════════════════════════════════
     MOBILE / TABLET  (< 1024px)
  ════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#577a92' }}>

        {/* Logo */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="FLARE logo" style={{ width: 36, height: 36, objectFit: 'contain' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          <span style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, fontSize: 22, color: '#345f86', letterSpacing: 1 }}>FLARE</span>
        </div>

        {/* Illustration — top 46%, object-fit:contain so man is FULLY visible */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46vh', backgroundColor: '#577a92', zIndex: 1 }}>
          <img
            src="/illustration.png"
            alt="illustration"
            style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* Login card — bottom 54%, seamless blue */}
        <div style={{ position: 'absolute', top: '46vh', left: 0, right: 0, bottom: 0, backgroundColor: '#577a92', overflowY: 'auto', zIndex: 2, padding: '24px 24px 48px' }}>
          {form}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     DESKTOP  (≥ 1024px)  — unchanged
  ════════════════════════════════════════ */
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', overflow: 'hidden' }}>
      <img src="/illustration.png" alt="illustration"
        style={{ position: 'absolute', bottom: 0, left: 0, height: '100vh', width: 'auto', objectFit: 'contain', zIndex: 1 }}
        onError={e => { e.currentTarget.style.display = 'none'; }} />

      <div style={{ position: 'absolute', top: 30, left: 50, display: 'flex', alignItems: 'center', gap: 10, zIndex: 20 }}>
        <img src="/logo.png" alt="FLARE logo" style={{ width: 53, height: 53, objectFit: 'contain' }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />
        <span style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, fontSize: 32, color: '#345f86', letterSpacing: 1 }}>FLARE</span>
      </div>

      <div style={{ position: 'absolute', right: 100, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
        <div style={{ backgroundColor: '#577a92', borderRadius: 20, padding: '36px 56px', width: 560, boxShadow: '0 8px 32px rgba(52,95,134,0.18), 0 2px 8px rgba(0,0,0,0.10)' }}>
          {form}
        </div>
      </div>
    </div>
  );
};

export default Login;
