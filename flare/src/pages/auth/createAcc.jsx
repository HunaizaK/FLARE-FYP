import { useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(true);

  useLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleRoleSelect = (role) => {
    navigate('/signup', { state: { role } });
  };

  const roleButton = (role, label) => (
    <button
      type="button"
      onClick={() => handleRoleSelect(role)}
      style={{
        width: '100%', height: 48, borderRadius: 16, border: 'none',
        fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
        backgroundColor: '#b7c9dc', color: '#000', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  const backBtn = (
    <button onClick={() => navigate('/')}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
        color: '#fff', marginBottom: 16, padding: 0,
      }}>
      ← Back
    </button>
  );

  const content = (
    <>
      {backBtn}
      <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: isMobile ? 28 : 40, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
        Create an account
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fbfcff', marginBottom: 32 }}>
        I am a/an
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {roleButton('organization', 'Organization')}
        {roleButton('citizen', 'Citizen')}
      </div>
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff' }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/login')}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff', textDecoration: 'underline', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Sign In
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

        {/* Illustration — top 46% */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46vh', backgroundColor: '#577a92', zIndex: 1 }}>
          <img src="/illustration.png" alt="illustration"
            style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        </div>

        {/* Card — bottom 54% */}
        <div style={{ position: 'absolute', top: '46vh', left: 0, right: 0, bottom: 0, backgroundColor: '#577a92', overflowY: 'auto', zIndex: 2, padding: '28px 24px 48px' }}>
          {content}
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
        <div style={{
          backgroundColor: '#577a92', borderRadius: 20, padding: '60px 50px', width: 560,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          {content}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
