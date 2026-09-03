import { useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from '../../services/api';
import PhoneInput from '../../components/PhoneInput';

const SignUpForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'citizen';

  const [isMobile, setIsMobile] = useState(true);
  useLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [formData, setFormData] = useState({
    email: '', contact_no: '', username: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading]                     = useState(false);
  const [signupError, setSignupError]                 = useState('');
  const [errors, setErrors] = useState({
    email: '', contact_no: '', username: '', password: '', confirmPassword: '',
  });

  const validateEmail = (v) => {
    if (!v) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address';
  };
  const validateContactNo = (v) => {
    if (!v) return '';
    if (v.length !== 10) return 'Phone number must be 10 digits';
    if (!/^\d{10}$/.test(v)) return 'Phone number must contain only digits';
    return '';
  };
  const validatePassword = (v) => {
    if (!v) return '';
    if (v.length < 8)              return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(v))          return 'Must contain an uppercase letter';
    if (!/[a-z]/.test(v))          return 'Must contain a lowercase letter';
    if (!/[0-9]/.test(v))          return 'Must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) return 'Must contain a special character';
    return '';
  };
  const validateConfirmPassword = (v, pw) => {
    if (!v) return '';
    return v !== pw ? 'Passwords do not match' : '';
  };

  const isFormComplete =
    formData.email && formData.contact_no && formData.username &&
    formData.password && formData.confirmPassword &&
    !errors.email && !errors.contact_no && !errors.password && !errors.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    let error = '';
    switch (name) {
      case 'email':           error = validateEmail(value); break;
      case 'contact_no':      error = validateContactNo(value); break;
      case 'password':
        error = validatePassword(value);
        if (formData.confirmPassword)
          setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(formData.confirmPassword, value) }));
        break;
      case 'confirmPassword': error = validateConfirmPassword(value, formData.password); break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupError('');
    try {
      await api.post('/auth/signup', {
        email: formData.email, contact_no: formData.contact_no,
        username: formData.username, password: formData.password, role,
      });
      navigate(role === 'organization' ? '/approval' : '/login');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Signup failed. Please try again.';
      setSignupError(detail === 'Username or email already exists'
        ? 'This username or email is already registered.' : detail);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── shared styles ── */
  const inputStyle = {
    width: '100%', height: 48, borderRadius: 20,
    border: '1px solid #E5E7EB', padding: '0 16px',
    fontFamily: 'Inter, sans-serif', fontSize: 14,
    backgroundColor: '#fff', color: '#374151',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', fontFamily: 'Inter, sans-serif',
    fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 6,
  };
  const errStyle = {
    color: '#EF4444', fontSize: 12, marginTop: 4, fontFamily: 'Inter, sans-serif',
  };

  const roleLabel = role === 'organization' ? 'an Organization' : 'a Citizen';

  /* ── form fields ── */
  const formFields = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Email */}
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          placeholder="Enter your email" required style={inputStyle} />
        {errors.email && <p style={errStyle}>{errors.email}</p>}
      </div>

      {/* Contact */}
      <div>
        <label style={labelStyle}>Contact No.</label>
        <PhoneInput
          value={formData.contact_no}
          onChange={(v) => { setFormData(p => ({ ...p, contact_no: v })); setErrors(p => ({ ...p, contact_no: validateContactNo(v) })); }}
          placeholder="333 3333333" maxLength={10}
          style={{ backgroundColor: '#fff', border: `1px solid ${errors.contact_no ? '#EF4444' : '#E5E7EB'}` }}
        />
        {errors.contact_no && <p style={errStyle}>{errors.contact_no}</p>}
      </div>

      {/* Username */}
      <div>
        <label style={labelStyle}>Username</label>
        <input type="text" name="username" value={formData.username} onChange={handleChange}
          placeholder="Enter your username" required style={inputStyle} />
      </div>

      {/* Password */}
      <div>
        <label style={labelStyle}>Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} name="password"
            value={formData.password} onChange={handleChange}
            placeholder="Create a password" required
            style={{ ...inputStyle, paddingRight: 48 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {showPassword ? <AiOutlineEye style={{ width: 20, height: 20, color: '#9CA3AF' }} /> : <AiOutlineEyeInvisible style={{ width: 20, height: 20, color: '#9CA3AF' }} />}
          </button>
        </div>
        {errors.password && <p style={errStyle}>{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label style={labelStyle}>Confirm Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
            value={formData.confirmPassword} onChange={handleChange}
            placeholder="Confirm your password" required
            style={{ ...inputStyle, paddingRight: 48 }} />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {showConfirmPassword ? <AiOutlineEye style={{ width: 20, height: 20, color: '#9CA3AF' }} /> : <AiOutlineEyeInvisible style={{ width: 20, height: 20, color: '#9CA3AF' }} />}
          </button>
        </div>
        {errors.confirmPassword && <p style={errStyle}>{errors.confirmPassword}</p>}
      </div>

      {signupError && <p style={{ ...errStyle, fontSize: 13 }}>{signupError}</p>}

      <button type="submit" disabled={!isFormComplete || isLoading} style={{
        width: '100%', height: 48, borderRadius: 16, border: 'none', outline: 'none',
        fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
        marginTop: 4, boxSizing: 'border-box',
        backgroundColor: isFormComplete && !isLoading ? '#b7c9dc' : '#9CA3AF',
        color: '#000', cursor: isFormComplete && !isLoading ? 'pointer' : 'not-allowed',
      }}>
        {isLoading ? 'Creating account…' : 'Sign Up'}
      </button>
    </form>
  );

  /* ── logo ── */
  const Logo = ({ size = 36, fontSize = 22, top = 16, left = 16 }) => (
    <div style={{ position: 'absolute', top, left, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
      <img src="/logo.png" alt="FLARE" style={{ width: size, height: size, objectFit: 'contain' }}
        onError={e => { e.currentTarget.style.display = 'none'; }} />
      <span style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, fontSize, color: '#345f86', letterSpacing: 1 }}>FLARE</span>
    </div>
  );

  /* ── back button ── */
  const BackBtn = ({ color = '#fff' }) => (
    <button onClick={() => navigate('/createacc')}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
        color, marginBottom: 16, padding: 0,
      }}>
      ← Back
    </button>
  );

  /* ════════════════════════════════════════
     MOBILE / TABLET  (< 1024px)
  ════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#577a92' }}>
        <Logo />

        {/* Illustration — top 35% */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35vh', backgroundColor: '#577a92', zIndex: 1 }}>
          <img src="/illustration.png" alt="illustration"
            style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        </div>

        {/* Form — bottom 65% */}
        <div style={{ position: 'absolute', top: '35vh', left: 0, right: 0, bottom: 0, backgroundColor: '#577a92', overflowY: 'auto', zIndex: 2, padding: '20px 24px 48px' }}>
          <BackBtn />
          <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: 26, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
            Sign Up
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#fbfcff', marginBottom: 16 }}>
            Create your account as {roleLabel}.
          </p>
          {formFields}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff' }}>
              Already have an account?{' '}
              <button onClick={() => navigate('/login')}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff', textDecoration: 'underline', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     DESKTOP  (≥ 1024px)
  ════════════════════════════════════════ */
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', overflow: 'hidden' }}>
      <img src="/illustration.png" alt="illustration"
        style={{ position: 'absolute', bottom: 0, left: 0, height: '100vh', width: 'auto', objectFit: 'contain', zIndex: 1 }}
        onError={e => { e.currentTarget.style.display = 'none'; }} />

      <Logo size={53} fontSize={32} top={30} left={50} />

      <div style={{ position: 'absolute', right: 100, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
        <div style={{
          backgroundColor: '#577a92', borderRadius: 20,
          padding: '32px 50px', width: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <BackBtn />
          <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: 40, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
            Sign Up
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fbfcff', marginBottom: 16 }}>
            Create your account as {roleLabel}.
          </p>
          {formFields}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff' }}>
              Already have an account?{' '}
              <button onClick={() => navigate('/login')}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff', textDecoration: 'underline', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
