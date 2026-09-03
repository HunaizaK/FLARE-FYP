import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Image sources (from Google Flood Forecasting research page) ─── */
const IMG = {
  hero:       'https://storage.googleapis.com/gweb-research2023-media/images/FloodHub.width-1250.png',
  diagram:    'https://storage.googleapis.com/gweb-research2023-media/images/Floods_how-it-works-_layered-graphic.width-1250.jpg',
  impact1:    'https://storage.googleapis.com/gweb-research2023-media/images/GiveDirectly.width-800.jpg',
  impact2:    'https://storage.googleapis.com/gweb-research2023-media/images/Okka_Lal_Chakma_a_day_labourer_from_the_Telkho.width-800.jpg',
  impact3:    'https://storage.googleapis.com/gweb-research2023-media/images/When_Rivers_Rise.width-800.png',
  worldMap:   'https://storage.googleapis.com/gweb-research2023-media/images/Groundsource2_Map.width-800.png',
};

/* ─── Palette ─── */
const C = {
  navy:   '#0a1628',
  blue:   '#345f86',
  slate:  '#577a92',
  ice:    '#b7c9dc',
  light:  '#f0f5fa',
  white:  '#ffffff',
  alert:  '#b83232',
  ink:    '#1a2a3a',
  muted:  '#4a6070',
};

/* ─────────────────────────────────────────────
   NAV
───────────────────────────────────────────── */
const NAV_LINKS = ['Platform', 'How It Works', 'Impact', 'Organizations'];
const NAV_HEIGHT = 64;

function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false); // corrected by handler() on mount
  const [onLight, setOnLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Everything here is measured off getBoundingClientRect, which is
    // viewport-relative and therefore correct no matter which element is
    // doing the scrolling (window, body, or an inner wrapper).
    const probeY = NAV_HEIGHT / 2;
    const handler = () => {
      const sections = document.querySelectorAll('[data-nav]');
      // First section starts at the top of the page, so its offset == scroll distance.
      const first = sections[0];
      setScrolled(first ? first.getBoundingClientRect().top <= -50 : false);

      let tone = 'dark';
      for (const el of sections) {
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= probeY && bottom > probeY) { tone = el.dataset.nav; break; }
      }
      setOnLight(tone === 'light');
    };
    handler(); // sync on mount — page can already be scrolled (reload / anchor / back-nav)
    // Capture phase, so scrolls from body or any nested scroller reach us too.
    window.addEventListener('scroll', handler, { passive: true, capture: true });
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, { capture: true });
      window.removeEventListener('resize', handler);
    };
  }, []);

  const ink      = onLight ? C.navy : '#fff';
  const linkIdle = onLight ? C.muted : 'rgba(255,255,255,0.78)';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: NAV_HEIGHT,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(20px, 5vw, 64px)',
      backgroundColor: scrolled ? (onLight ? 'rgba(255,255,255,0.92)' : C.navy) : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      boxShadow: scrolled
        ? (onLight ? '0 2px 16px rgba(10,22,40,0.10)' : '0 2px 16px rgba(10,22,40,0.28)')
        : 'none',
      transition: 'background-color 0.35s ease, backdrop-filter 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
      borderBottom: scrolled
        ? `1px solid ${onLight ? 'rgba(10,22,40,0.10)' : 'rgba(183,201,220,0.18)'}`
        : '1px solid transparent',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => document.querySelector('[data-nav]')?.scrollIntoView({ behavior: 'smooth' })}>
        <img src="/logo.png" alt="FLARE logo"
          style={{ width: 38, height: 38, objectFit: 'contain' }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />
        <span style={{
          fontFamily: 'Lexend, sans-serif', fontWeight: 700,
          fontSize: 22, color: ink, letterSpacing: '1.5px',
          transition: 'color 0.35s ease',
        }}>FLARE</span>
      </div>

      {/* Mobile Sign In button — only shows when desktop nav is hidden */}
      <button className="landing-mobile-signin" onClick={() => navigate('/login')} style={{
        backgroundColor: C.blue, color: '#fff', border: 'none',
        borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(10,22,40,0.35)',
      }}>Sign In</button>

      {/* Desktop links */}
      <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        {NAV_LINKS.map(l => (
          <a key={l}
            href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
            style={{
              color: linkIdle, fontSize: 14, fontWeight: 500,
              textDecoration: 'none', letterSpacing: '0.01em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = ink; }}
            onMouseLeave={e => { e.currentTarget.style.color = linkIdle; }}>
            {l}
          </a>
        ))}
        {/* Ghost outline over the hero, easing into the Get Started fill on scroll */}
        <button onClick={() => navigate('/login')} style={{
          backgroundColor: scrolled ? C.blue : 'transparent',
          color: '#fff', fontSize: 14, fontWeight: 600,
          border: `1.5px solid ${scrolled ? C.blue : 'rgba(183,201,220,0.55)'}`,
          borderRadius: 8,
          padding: '9px 22px',
          cursor: 'pointer',
          boxShadow: scrolled ? '0 2px 12px rgba(52,95,134,0.35)' : 'none',
          transition: 'background-color 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = scrolled ? '#2a4e72' : 'rgba(183,201,220,0.12)';
            e.currentTarget.style.borderColor = scrolled ? '#2a4e72' : '#b7c9dc';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = scrolled ? C.blue : 'transparent';
            e.currentTarget.style.borderColor = scrolled ? C.blue : 'rgba(183,201,220,0.55)';
          }}>
          Sign In
        </button>
        <button onClick={() => navigate('/createacc')} style={{
          backgroundColor: C.blue, color: '#fff',
          // matches the Sign In outline width so both pills share the same box
          border: `1.5px solid ${C.blue}`, borderRadius: 8,
          padding: '9px 22px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(52,95,134,0.35)',
          transition: 'background-color 0.2s, border-color 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2a4e72'; e.currentTarget.style.borderColor = '#2a4e72'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.blue; e.currentTarget.style.borderColor = C.blue; }}>
          Get Started
        </button>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function Hero({ navigate }) {
  return (
    <section data-nav="dark" style={{
      position: 'relative', height: '100vh', minHeight: 620,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Background map */}
      <img src={IMG.hero} alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'saturate(0.5) brightness(0.35)',
          transform: 'scale(1.04)',
        }} />

      {/* Gradient overlay — navy at bottom to fade into stats strip */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          linear-gradient(180deg,
            rgba(10,22,40,0.30) 0%,
            rgba(10,22,40,0.55) 60%,
            rgba(10,22,40,0.92) 100%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(52,95,134,0.28) 0%, transparent 60%)',
      }} />

      {/* Live badge */}
      <div style={{
        position: 'absolute', top: 96, left: 'clamp(20px, 5vw, 64px)',
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(184,50,50,0.18)',
        border: '1px solid rgba(184,50,50,0.38)',
        borderRadius: 20, padding: '5px 14px',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: '#ef4444',
          boxShadow: '0 0 0 2px rgba(239,68,68,0.3)',
          animation: 'pulse 2s ease-in-out infinite',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Live Monitoring Active
        </span>
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 760, width: '100%',
        padding: '0 clamp(20px, 5vw, 64px)',
      }}>
        <h1 style={{
          fontFamily: 'Lexend, sans-serif',
          fontSize: 'clamp(36px, 5.5vw, 68px)',
          fontWeight: 700, color: '#fff',
          lineHeight: 1.08, letterSpacing: '-0.01em',
          marginBottom: 24,
          textWrap: 'balance',
        }}>
          Flood & Landslide<br />
          Alert &amp; Response<br />
          Engine
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 1.8vw, 18px)',
          color: 'rgba(255,255,255,0.72)',
          lineHeight: 1.75, maxWidth: 520,
          marginBottom: 40,
        }}>
          AI-powered early warning and coordination for Pakistan's flood-prone
          communities. Real-time gauge data, 7-day forecasts, shelter networks,
          and NGO response — unified.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/maps')} style={{
            backgroundColor: C.blue, color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '14px 32px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(52,95,134,0.45)',
            transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a4e72'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = 'translateY(0)'; }}>
            View Live Map →
          </button>
          <button onClick={() => navigate('/createacc')} style={{
            backgroundColor: 'transparent',
            border: '2px solid rgba(255,255,255,0.38)',
            color: '#fff', borderRadius: 10,
            padding: '13px 32px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.38)'; e.currentTarget.style.background = 'transparent'; }}>
            Sign Up Free
          </button>
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.35)',
        animation: 'scrollBounce 2.4s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STATS STRIP
───────────────────────────────────────────── */
const STATS = [
  { value: '7 Days',  label: 'Riverine Advance Warning' },
  { value: '24 hrs',  label: 'Flash Flood Alert Window' },
  { value: '13',      label: 'Live Gauge Stations' },
  { value: '150+',    label: 'Countries in Training Data' },
  { value: '2.6M',    label: 'Historical Flood Records' },
];

function StatsStrip() {
  return (
    <div style={{
      backgroundColor: C.navy,
      borderTop: '1px solid rgba(183,201,220,0.10)',
      borderBottom: '1px solid rgba(183,201,220,0.10)',
      padding: '36px clamp(20px, 5vw, 64px)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '24px 16px',
      textAlign: 'center',
    }}>
      {STATS.map(s => (
        <div key={s.label}>
          <div style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 700, color: C.ice,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            marginBottom: 8,
          }}>{s.value}</div>
          <div style={{
            fontSize: 12, color: 'rgba(183,201,220,0.55)',
            letterSpacing: '0.04em', lineHeight: 1.4,
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PLATFORM SECTION
───────────────────────────────────────────── */
const FEATURES = [
  { icon: '🗺️', title: 'Live Flood Maps',      desc: 'Real-time inundation overlays showing risk levels, affected zones, and shelter locations across Pakistan.' },
  { icon: '📡', title: 'Gauge Monitoring',     desc: '13 river stations streaming water levels, discharge rates, and historical trend data continuously.' },
  { icon: '🏠', title: 'Shelter Management',   desc: 'Live capacity, occupancy, and status tracking for emergency shelters across all active districts.' },
  { icon: '⚡', title: 'Flash Flood Alerts',   desc: 'AI-powered 24-hour warnings for urban regions. Instant push alerts to registered users.' },
  { icon: '🤝', title: 'NGO Coordination',     desc: 'Verified organizations log donations, manage volunteers, and coordinate response in real time.' },
  { icon: '📊', title: 'Forecast Analytics',   desc: '7-day discharge forecasts with confidence bands — so responders can plan, not just react.' },
];

function PlatformSection() {
  return (
    <section id="platform" data-nav="light" style={{ padding: 'clamp(64px, 10vw, 100px) clamp(20px, 5vw, 64px)', backgroundColor: C.light }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ maxWidth: 580, marginBottom: 56 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: C.blue,
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14,
          }}>The Platform</div>
          <h2 style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontWeight: 700, color: C.navy,
            lineHeight: 1.1, marginBottom: 18,
          }}>One platform.<br />Every crisis signal.</h2>
          <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.75 }}>
            FLARE brings river gauges, AI forecasts, shelter networks, and community reports
            into a single operational view — for citizens and responders alike.
          </p>
        </div>

        {/* Map screenshot */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(10,22,40,0.16)',
          marginBottom: 72,
          border: '1px solid rgba(10,22,40,0.06)',
        }}>
          <img src={IMG.hero} alt="FLARE live flood monitoring map"
            style={{ width: '100%', display: 'block' }} />
        </div>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px 48px',
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────────── */
function HowItWorks() {
  const colCard = (bg, border, accentColor, tag, heading, body, bullets) => (
    <div style={{ padding: 36, backgroundColor: bg, borderRadius: 16, border }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: accentColor, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
        {tag}
      </div>
      <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 14, lineHeight: 1.25 }}>
        {heading}
      </h3>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>{body}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {bullets.map(b => (
          <li key={b} style={{ fontSize: 13, color: C.muted, display: 'flex', gap: 10 }}>
            <span style={{ color: accentColor, fontWeight: 800, flexShrink: 0 }}>✓</span> {b}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section id="how-it-works" data-nav="light" style={{ padding: 'clamp(64px, 10vw, 100px) clamp(20px, 5vw, 64px)', backgroundColor: C.white }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ maxWidth: 540, marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            How It Works
          </div>
          <h2 style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700, color: C.navy, lineHeight: 1.1,
          }}>
            From raw sensor data<br />to life-saving decisions
          </h2>
        </div>

        {/* Diagram */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(10,22,40,0.10)',
          marginBottom: 52,
          border: '1px solid rgba(10,22,40,0.06)',
        }}>
          <img src={IMG.diagram} alt="How FLARE's AI flood models work"
            style={{ width: '100%', display: 'block' }} />
        </div>

        {/* Two-column breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {colCard(
            C.light, '1px solid rgba(52,95,134,0.12)', C.blue,
            'Riverine Flooding',
            'Up to 7 days advance notice',
            'FLARE\'s hydrology model fuses satellite imagery, gauge telemetry, and weather forecasts to predict river discharge and downstream flood plains — well before water peaks.',
            ['Gauge-calibrated discharge curves', 'Inundation extent prediction', 'Open satellite + weather data', 'Continuously updated twice daily'],
          )}
          {colCard(
            '#fff8f7', '1px solid rgba(184,50,50,0.14)', C.alert,
            'Flash Flooding',
            '24-hour urban warning',
            'Flash floods strike with little notice. FLARE analyses 7-day meteorological and terrain sequences to predict flash flood probability across 20 km × 20 km urban grids.',
            ['Sub-24-hour onset prediction', 'Urban district resolution', '2.6 M historical event records', 'Gemini-derived training corpus'],
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   WORLD MAP / COVERAGE
───────────────────────────────────────────── */
function Coverage() {
  return (
    <section style={{
      padding: 'clamp(64px, 10vw, 96px) clamp(20px, 5vw, 64px)',
      backgroundColor: C.navy,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.ice, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Training Data
            </div>
            <h2 style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 700, color: '#fff',
              lineHeight: 1.15, marginBottom: 20,
            }}>
              Built from 20 years<br />of flood history
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, marginBottom: 28 }}>
              FLARE's models are trained on 2.6 million verified flood records spanning two decades —
              drawn from news archives, gauge logs, and satellite passes over South Asia and beyond.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                '2.6 M records across 20 years',
                'Coverage across 150+ countries',
                'Open-access dataset available for researchers',
                'Validated against independent gauge data',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: C.ice, fontWeight: 800, fontSize: 14, flexShrink: 0, marginTop: 1 }}>—</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}>
            <img src={IMG.worldMap} alt="Global flood event coverage heat map"
              style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   IMPACT CARDS
───────────────────────────────────────────── */
const IMPACT_CARDS = [
  {
    img:   IMG.impact1,
    tag:   'Community Response',
    title: 'Cash assistance delivered before floodwaters arrived',
    body:  'Using FLARE\'s 72-hour riverine forecasts, partner NGOs pre-positioned aid and reached vulnerable households before roads became impassable.',
  },
  {
    img:   IMG.impact2,
    tag:   'Farmer Protection',
    title: 'Day laborers warned in time to move livestock and crops',
    body:  'Early mobile alerts through FLARE gave farming families in flood corridors enough lead time to protect their only productive assets.',
  },
  {
    img:   IMG.impact3,
    tag:   'Alert Infrastructure',
    title: 'Communities warned days before rivers peak',
    body:  'Riverine warnings now reach registered citizens 5–7 days in advance — replacing the previous 24-hour window that left almost no time to act.',
  },
];

function Impact() {
  return (
    <section id="impact" data-nav="light" style={{ padding: 'clamp(64px, 10vw, 100px) clamp(20px, 5vw, 64px)', backgroundColor: C.white }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ maxWidth: 520, marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Impact
          </div>
          <h2 style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700, color: C.navy, lineHeight: 1.1,
          }}>
            Aid before<br />the water rises
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 24,
        }}>
          {IMPACT_CARDS.map(card => (
            <article key={card.title} style={{
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(10,22,40,0.07)',
              boxShadow: '0 4px 20px rgba(10,22,40,0.06)',
              backgroundColor: C.white,
              transition: 'box-shadow 0.25s, transform 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(10,22,40,0.13)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,22,40,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                <img src={card.img} alt={card.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  backgroundColor: 'rgba(10,22,40,0.72)',
                  color: C.ice,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  borderRadius: 20, padding: '4px 12px',
                  backdropFilter: 'blur(4px)',
                }}>
                  {card.tag}
                </div>
              </div>
              <div style={{ padding: '24px 24px 28px' }}>
                <h3 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: 18, fontWeight: 700, color: C.navy,
                  lineHeight: 1.3, marginBottom: 10,
                }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.68 }}>
                  {card.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   ORGANIZATIONS SECTION
───────────────────────────────────────────── */
function Organizations({ navigate }) {
  return (
    <section id="organizations" data-nav="light" style={{ padding: 'clamp(64px, 10vw, 100px) clamp(20px, 5vw, 64px)', backgroundColor: C.light }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 72, alignItems: 'center' }}>

        {/* Image */}
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 48px rgba(10,22,40,0.14)' }}>
          <img src={IMG.impact1} alt="Organizations coordinating flood response"
            style={{ width: '100%', display: 'block' }} />
        </div>

        {/* Text */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            For Organizations
          </div>
          <h2 style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: 'clamp(26px, 3.5vw, 40px)',
            fontWeight: 700, color: C.navy, lineHeight: 1.15, marginBottom: 18,
          }}>
            Built for the people<br />who respond first
          </h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.75, marginBottom: 28 }}>
            NGOs, government agencies, and relief organizations can register on FLARE to unlock
            full coordination tools — verified accounts, resource tracking, and priority early-warning access.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
            {[
              'Verified organization accounts with admin approval',
              'Donation and resource inventory dashboard',
              'Volunteer coordination and assignment tools',
              'Priority access to real-time flood alerts',
              'Shelter management and capacity tracking',
            ].map(item => (
              <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: C.blue, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2,
                }}>✓</div>
                <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/createacc')} style={{
            backgroundColor: C.navy, color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '14px 28px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', transition: 'background 0.2s, transform 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0f2040'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.transform = 'translateY(0)'; }}>
            Register Your Organization →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA SECTION
───────────────────────────────────────────── */
function CTASection({ navigate }) {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: 'clamp(72px, 12vw, 120px) clamp(20px, 5vw, 64px)',
      textAlign: 'center',
    }}>
      {/* Background — impact2 image with strong dark overlay */}
      <img src={IMG.impact2} alt="" aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover',
        filter: 'saturate(0.4) brightness(0.25)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${C.navy}ee 0%, rgba(52,95,134,0.90) 100%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Lexend, sans-serif',
          fontSize: 'clamp(28px, 4.5vw, 52px)',
          fontWeight: 700, color: '#fff',
          lineHeight: 1.1, marginBottom: 20,
          textWrap: 'balance',
        }}>
          Be ready before<br />the next flood season
        </h2>
        <p style={{
          fontSize: 17, color: 'rgba(255,255,255,0.70)',
          lineHeight: 1.75, marginBottom: 40,
        }}>
          FLARE is free for citizens and organizations.
          Get real-time alerts, live maps, and connect with response networks in your region.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/createacc')} style={{
            backgroundColor: '#fff', color: C.navy,
            border: 'none', borderRadius: 10,
            padding: '15px 36px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            Create Free Account
          </button>
          <button onClick={() => navigate('/maps')} style={{
            backgroundColor: 'transparent',
            border: '2px solid rgba(255,255,255,0.40)',
            color: '#fff', borderRadius: 10,
            padding: '14px 36px', fontSize: 16, fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)'; e.currentTarget.style.background = 'transparent'; }}>
            View Live Map
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer({ navigate }) {
  return (
    <footer style={{
      backgroundColor: '#060d1a',
      borderTop: '1px solid rgba(183,201,220,0.08)',
      padding: 'clamp(48px, 8vw, 72px) clamp(20px, 5vw, 64px) 32px',
      color: 'rgba(255,255,255,0.45)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px 64px',
          marginBottom: 56,
          paddingBottom: 48,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }} className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src="/logo.png" alt="FLARE" style={{ width: 34, height: 34, objectFit: 'contain' }}
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <span style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: '1px' }}>FLARE</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 300, color: 'rgba(255,255,255,0.45)' }}>
              Flood &amp; Landslide Alert &amp; Response Engine.<br />
              Early warning. Coordinated response. Together.
            </p>
          </div>

          {/* Links */}
          {[
            { heading: 'Platform', links: ['Live Map', 'Gauge Stations', 'Shelter Finder', 'Flood Alerts', 'Forecast Analytics'] },
            { heading: 'Organizations', links: ['Sign Up', 'Sign In', 'Donate', 'Volunteer', 'Partner With Us'] },
          ].map(col => (
            <div key={col.heading}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18,
              }}>{col.heading}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.links.map(l => (
                  <a key={l} href="#"
                    style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(183,201,220,0.8)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; }}>
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
          <span>© 2025 FLARE. All rights reserved.</span>
          <span style={{ color: 'rgba(255,255,255,0.28)' }}>
            Built for Pakistan's flood-affected communities.
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        /* Global index.css pins html/body/#root to height:100% with
           overflow-x:hidden on body. That makes <body> a viewport-height
           scroll container, so the page scrolls inside body and
           window.scrollY never leaves 0. Undo it here so the viewport
           scrolls and the navbar can react to it. */
        html { scroll-behavior: smooth; height: auto; min-height: 100%; overflow-x: hidden; }
        body, #root { height: auto; min-height: 100%; overflow: visible; }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 2px rgba(239,68,68,0.3); }
          50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(239,68,68,0.10); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.35; }
          50%       { transform: translateX(-50%) translateY(7px); opacity: 0.55; }
        }

        @media (max-width: 700px) {
          .landing-nav-links { display: none !important; }
          .footer-brand { grid-column: span 1 !important; }
        }
        @media (min-width: 701px) {
          .landing-mobile-signin { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <Navbar navigate={navigate} />
      <Hero navigate={navigate} />
      <StatsStrip />
      <PlatformSection />
      <HowItWorks />
      <Coverage />
      <Impact />
      <Organizations navigate={navigate} />
      <CTASection navigate={navigate} />
      <Footer navigate={navigate} />
    </>
  );
}
