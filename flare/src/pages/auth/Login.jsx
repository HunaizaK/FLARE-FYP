import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setAccountType, setToken, setUserId } from '../../features/auth/authSlice';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  /* ─── shared input styles ─── */
  const inputStyle = {
    width: '100%', height: '48px',
    border: '1px solid #E5E7EB', borderRadius: '30px',
    padding: '0 20px', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif', fontSize: '14px',
    backgroundColor: '#fff', color: '#374151', outline: 'none',
  };
  const labelStyle = {
    fontFamily: 'Inter, sans-serif', fontSize: '14px',
    fontWeight: 500, color: '#fff',
    display: 'block', marginBottom: '8px',
  };

  /* ─── the form — identical for both layouts ─── */
  const Form = ({ padding }) => (
    <div style={{ padding }}>
      <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
        Login
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#fbfcff', marginBottom: '20px' }}>
        Please log in to your account to continue.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Username */}
        <div>
          <label style={labelStyle}>Username</label>
          <input
            type="text" name="username"
            value={formData.username} onChange={handleChange}
            placeholder="Enter your username"
            style={inputStyle} required
          />
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <button type="button" style={{
              fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#fff',
              textDecoration: 'underline', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
            }}>Forgot Password?</button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password} onChange={handleChange}
              placeholder="Enter your password"
              style={{ ...inputStyle, paddingRight: '48px' }} required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}>
              {showPassword
                ? <AiOutlineEye    style={{ width: 20, height: 20, color: '#9CA3AF' }} />
                : <AiOutlineEyeInvisible style={{ width: 20, height: 20, color: '#9CA3AF' }} />}
            </button>
          </div>
        </div>

        {loginError && (
          <p style={{ color: '#EF4444', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
            {loginError}
          </p>
        )}

        <button type="submit" disabled={!isFormComplete || isLoading} style={{
          width: '100%', height: '48px', borderRadius: '16px',
          border: 'none', outline: 'none', marginTop: '8px',
          fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500,
          cursor: isFormComplete && !isLoading ? 'pointer' : 'not-allowed',
          backgroundColor: isFormComplete && !isLoading ? '#b7c9dc' : '#9CA3AF',
          color: '#000',
        }}>
          {isLoading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#fff' }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/createacc')} style={{
            fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#fff',
            textDecoration: 'underline', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>Sign Up</button>
        </p>
      </div>
    </div>
  );

  /* ─── Logo ─── */
  const Logo = ({ top, left, size }) => (
    <div style={{ position: 'absolute', top, left, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 50 }}>
      <img src="/logo.png" alt="FLARE logo"
        style={{ width: size, height: size, objectFit: 'contain' }}
        onError={e => { e.currentTarget.style.display = 'none'; }} />
      <span style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, fontSize: size * 0.6, color: '#345f86', letterSpacing: '1px' }}>
        FLARE
      </span>
    </div>
  );

  return (
    <>
      {/* ── CSS: show/hide entire layout trees by screen width ── */}
      <style>{`
        .fl-login-small  { display: none;  }
        .fl-login-medium { display: none;  }
        .fl-login-large  { display: block; }

        @media (max-width: 767px) {
          .fl-login-small  { display: block; }
          .fl-login-medium { display: none;  }
          .fl-login-large  { display: none;  }
        }
        @media (min-width: 768px) and (max-width: 1024px) {
          .fl-login-small  { display: none;  }
          .fl-login-medium { display: block; }
          .fl-login-large  { display: none;  }
        }
      `}</style>

      {/* ════════════════════════════════════════
          MOBILE  ≤ 767px
      ════════════════════════════════════════ */}
      <div className="fl-login-small" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#577a92' }}>
        <Logo top={16} left={16} size={36} />

        {/* Illustration — top 46% */}
        <img src="/illustration.png" alt="illustration"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '46vh',
            objectFit: 'contain', objectPosition: 'center center',
            backgroundColor: '#577a92',
            zIndex: 1,
          }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />

        {/* Form — bottom 54% */}
        <div style={{
          position: 'absolute', top: '46vh', left: 0, right: 0, bottom: 0,
          backgroundColor: '#577a92', overflowY: 'auto', zIndex: 2,
        }}>
          <Form padding="28px 24px 48px" />
        </div>
      </div>

      {/* ════════════════════════════════════════
          TABLET  768px – 1024px
      ════════════════════════════════════════ */}
      <div className="fl-login-medium" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#577a92' }}>
        <Logo top={16} left={20} size={42} />

        {/* Illustration — top 50% */}
        <img src="/illustration.png" alt="illustration"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '50vh',
            objectFit: 'contain', objectPosition: 'center center',
            backgroundColor: '#577a92',
            zIndex: 1,
          }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />

        {/* Form — bottom 50% */}
        <div style={{
          position: 'absolute', top: '50vh', left: 0, right: 0, bottom: 0,
          backgroundColor: '#577a92', overflowY: 'auto', zIndex: 2,
        }}>
          <Form padding="36px 40px 48px" />
        </div>
      </div>

      {/* ════════════════════════════════════════
          DESKTOP  > 1024px
      ════════════════════════════════════════ */}
      <div className="fl-login-large" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', overflow: 'hidden' }}>
        {/* Illustration — left side */}
        <img src="/illustration.png" alt="illustration"
          style={{
            position: 'absolute', bottom: 0, left: 0,
            height: '100vh', width: 'auto',
            objectFit: 'contain', zIndex: 1,
          }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />

        <Logo top={30} left={50} size={53} />

        {/* Card — right side */}
        <div style={{
          position: 'absolute', right: '100px',
          top: '50%', transform: 'translateY(-50%)',
          zIndex: 10,
        }}>
          <div style={{
            backgroundColor: '#577a92', borderRadius: '20px',
            width: '560px',
            boxShadow: '0 8px 32px rgba(52,95,134,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          }}>
            <Form padding="36px 56px" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
