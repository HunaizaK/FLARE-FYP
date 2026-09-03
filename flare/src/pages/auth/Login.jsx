import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setAccountType, setToken, setUserId } from '../../features/auth/authSlice';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from '../../services/api';

/* ── detect breakpoint ── */
function getBreakpoint() {
  const w = window.innerWidth;
  if (w <= 767)  return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

const Login = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  const [bp, setBp] = useState(getBreakpoint);

  useEffect(() => {
    const handler = () => setBp(getBreakpoint());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [formData, setFormData]     = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading]   = useState(false);

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
      if (detail === 'Organization not approved yet') {
        setLoginError('Your account is pending admin approval. Please wait for approval before logging in.');
      } else {
        setLoginError('Invalid username or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── shared form JSX ── */
  const formContent = (
    <>
      <h1 style={{
        fontFamily: 'Lexend, sans-serif',
        fontSize: bp === 'desktop' ? '40px' : '32px',
        fontWeight: 600, color: '#fff',
        marginBottom: '4px',
      }}>Login</h1>

      <p style={{
        fontFamily: 'Inter, sans-serif', fontSize: '14px',
        color: '#fbfcff', marginBottom: '20px',
      }}>Please log in to your account to continue.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Username */}
        <div>
          <label style={{
            fontFamily: 'Inter, sans-serif', fontSize: '14px',
            fontWeight: 500, color: '#fff',
            marginBottom: '8px', display: 'block',
          }}>Username</label>
          <input
            type="text" name="username"
            value={formData.username} onChange={handleChange}
            placeholder="Enter your username"
            required
            style={{
              width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
              height: '48px', border: '1px solid #E5E7EB', borderRadius: '30px',
              padding: '0 20px', boxSizing: 'border-box', outline: 'none',
              backgroundColor: '#fff', color: '#374151',
            }}
          />
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{
              fontFamily: 'Inter, sans-serif', fontSize: '14px',
              fontWeight: 500, color: '#fff',
            }}>Password</label>
            <button type="button" onClick={() => {}}
              style={{
                fontFamily: 'Inter, sans-serif', fontSize: '13px',
                color: '#fff', textDecoration: 'underline',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
              Forgot Password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password} onChange={handleChange}
              placeholder="Enter your password"
              required
              style={{
                width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                height: '48px', border: '1px solid #E5E7EB', borderRadius: '30px',
                paddingLeft: '20px', paddingRight: '48px',
                boxSizing: 'border-box', outline: 'none',
                backgroundColor: '#fff', color: '#374151',
              }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '16px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}>
              {showPassword
                ? <AiOutlineEye style={{ width: 20, height: 20, color: '#9CA3AF' }} />
                : <AiOutlineEyeInvisible style={{ width: 20, height: 20, color: '#9CA3AF' }} />}
            </button>
          </div>
        </div>

        {loginError && (
          <p style={{ color: '#EF4444', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
            {loginError}
          </p>
        )}

        <button
          type="submit"
          disabled={!isFormComplete || isLoading}
          style={{
            width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '15px',
            fontWeight: 500, height: '48px', borderRadius: '16px',
            border: 'none', outline: 'none', marginTop: '8px',
            boxSizing: 'border-box', cursor: isFormComplete && !isLoading ? 'pointer' : 'not-allowed',
            backgroundColor: isFormComplete && !isLoading ? '#b7c9dc' : '#9CA3AF',
            color: '#000',
          }}>
          {isLoading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '14px',
          color: '#fff', marginBottom: '16px',
        }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/createacc')} style={{
            fontFamily: 'Inter, sans-serif', fontSize: '14px',
            color: '#fff', textDecoration: 'underline', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>Sign Up</button>
        </p>
      </div>
    </>
  );

  /* ════════════════════════════════════════════
     MOBILE  ≤ 767px
  ════════════════════════════════════════════ */
  if (bp === 'mobile') {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#577a92' }}>

        {/* Logo — top-left, above illustration */}
        <div style={{
          position: 'absolute', top: 16, left: 16, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <img src="/logo.png" alt="FLARE logo"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          <span style={{
            fontFamily: 'Lexend, sans-serif', fontWeight: 700,
            fontSize: '24px', color: '#345f86', letterSpacing: '1px',
          }}>FLARE</span>
        </div>

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

        {/* Card — bottom 54% */}
        <div style={{
          position: 'absolute',
          top: '46vh', left: 0, right: 0, bottom: 0,
          backgroundColor: '#577a92',
          overflowY: 'auto',
          padding: '28px 24px 48px',
          zIndex: 2,
        }}>
          {formContent}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     TABLET  768px – 1024px
  ════════════════════════════════════════════ */
  if (bp === 'tablet') {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#577a92' }}>

        {/* Logo */}
        <div style={{
          position: 'absolute', top: 16, left: 20, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <img src="/logo.png" alt="FLARE logo"
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          <span style={{
            fontFamily: 'Lexend, sans-serif', fontWeight: 700,
            fontSize: '28px', color: '#345f86', letterSpacing: '1px',
          }}>FLARE</span>
        </div>

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

        {/* Card — bottom 50% */}
        <div style={{
          position: 'absolute',
          top: '50vh', left: 0, right: 0, bottom: 0,
          backgroundColor: '#577a92',
          overflowY: 'auto',
          padding: '36px 40px 48px',
          zIndex: 2,
        }}>
          {formContent}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     DESKTOP  > 1024px
  ════════════════════════════════════════════ */
  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: '#fff', overflow: 'hidden',
    }}>
      {/* Illustration — left side */}
      <img src="/illustration.png" alt="illustration"
        style={{
          position: 'absolute', bottom: 0, left: 0,
          height: '100vh', width: 'auto',
          objectFit: 'contain', zIndex: 1,
        }}
        onError={e => { e.currentTarget.style.display = 'none'; }} />

      {/* Logo */}
      <div style={{
        position: 'absolute', top: 30, left: 50,
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 20,
      }}>
        <img src="/logo.png" alt="FLARE logo"
          style={{ width: 53, height: 53, objectFit: 'contain' }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />
        <span style={{
          fontFamily: 'Lexend, sans-serif', fontWeight: 700,
          fontSize: '32px', color: '#345f86', letterSpacing: '1px',
        }}>FLARE</span>
      </div>

      {/* Card — right side */}
      <div style={{
        position: 'absolute', right: 100,
        top: '50%', transform: 'translateY(-50%)',
        zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          backgroundColor: '#577a92',
          borderRadius: '20px',
          padding: '36px 56px',
          width: '560px',
          boxShadow: '0 8px 32px rgba(52,95,134,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        }}>
          {formContent}
        </div>
      </div>
    </div>
  );
};

export default Login;
