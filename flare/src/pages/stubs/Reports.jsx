import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import { FileDownloadOutlined } from '@mui/icons-material';
import api from '../../services/api';

const renderMarkdown = (md) => {
  if (!md) return '';
  const lines = md.split('\n');
  const html = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    if (/^### /.test(rawLine)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3 style="font-family:Lexend,sans-serif;font-size:16px;font-weight:600;color:#1F2937;margin:20px 0 6px 0">${line.replace(/^### /, '')}</h3>`);
    } else if (/^## /.test(rawLine)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2 style="font-family:Lexend,sans-serif;font-size:20px;font-weight:700;color:#1F618A;margin:24px 0 8px 0">${line.replace(/^## /, '')}</h2>`);
    } else if (/^# /.test(rawLine)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h1 style="font-family:Lexend,sans-serif;font-size:26px;font-weight:700;color:#1F618A;margin:0 0 16px 0">${line.replace(/^# /, '')}</h1>`);
    } else if (/^- /.test(rawLine)) {
      if (!inList) { html.push('<ul style="margin:8px 0 8px 24px;padding:0">'); inList = true; }
      html.push(`<li style="font-family:Inter,sans-serif;font-size:15px;margin:6px 0;color:#374151;line-height:1.7">${line.replace(/^- /, '')}</li>`);
    } else if (/^---$/.test(rawLine.trim())) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>');
    } else if (rawLine.trim() === '') {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<div style="height:10px"></div>');
    } else {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p style="font-family:Inter,sans-serif;font-size:15px;margin:6px 0;color:#374151;line-height:1.75">${line}</p>`);
    }
  }
  if (inList) html.push('</ul>');
  return html.join('\n');
};

const Reports = () => {
  const navigate    = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const accountType = useSelector((s) => s.auth.accountType);
  const isAdmin     = accountType === 'admin';

  const [content,      setContent]      = useState('');
  const [loadingReport, setLoadingReport] = useState(true);
  const [reportError,  setReportError]  = useState('');

  const [showPopup,        setShowPopup]        = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [dontAskAgain,     setDontAskAgain]     = useState(false);

  useEffect(() => {
    api.get('/flood-report')
      .then((res) => setContent(res.data.content || ''))
      .catch(() => setReportError('Failed to load the flood report. Please try again later.'))
      .finally(() => setLoadingReport(false));

    if (!isAdmin) {
      const pref = localStorage.getItem('floodUpdatesPreference');
      if (!pref) setShowPopup(true);
    }
  }, [isAdmin]);

  const handleYes = () => {
    const pending = JSON.parse(localStorage.getItem('flare_pending_newsletters') || '[]');
    if (!pending.some((r) => r.username === currentUser)) {
      pending.push({ id: Date.now(), username: currentUser, submittedAt: new Date().toISOString() });
      localStorage.setItem('flare_pending_newsletters', JSON.stringify(pending));
    }
    if (dontAskAgain) localStorage.setItem('floodUpdatesPreference', 'yes');
    setShowPopup(false);
    setShowApprovalPopup(true);
  };

  const handleNo = () => {
    if (dontAskAgain) localStorage.setItem('floodUpdatesPreference', 'no');
    setShowPopup(false);
  };

  const handleDownload = () => window.print();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-doc, #report-doc * { visibility: visible; }
          #report-doc { position: fixed; top: 0; left: 0; width: 100%; padding: 40px 60px; }
        }
      `}</style>

      <div
        className="flare-page-main absolute top-0 h-full transition-all duration-300 overflow-y-auto"
        style={{ left: 'var(--nav-left)', width: 'var(--nav-width)', paddingBottom: 'var(--nav-bottom-pad)' }}
      >
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 100, padding: '20px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '50px', fontWeight: 600, color: '#000000', margin: 0 }}>
            Reports
          </h1>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/report-approval')}
              style={{ height: '48px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000', boxShadow: '0 0px 12px rgba(0,0,0,0.18)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}
            >
              Approve Reports
            </button>
          )}
        </div>

        <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
          {loadingReport ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF', marginTop: '60px' }}>Loading report…</p>
          ) : reportError ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#EF4444', marginTop: '60px' }}>{reportError}</p>
          ) : (
            <div style={{ width: '100%', maxWidth: '860px', position: 'relative' }}>
              {/* Download icon */}
              <button
                onClick={handleDownload}
                title="Download / Print PDF"
                style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#1F2937'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}
              >
                <FileDownloadOutlined style={{ fontSize: '24px' }} />
              </button>

              {/* A4-style document */}
              <div
                id="report-doc"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '60px 72px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                  border: '1px solid #E5E7EB',
                  minHeight: '1000px',
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Newsletter Approval Popup */}
      {!isAdmin && showApprovalPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, paddingTop: '220px' }}>
          <div style={{ position: 'relative', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', paddingTop: '80px' }}>
            <img src="/approval.png" alt="Approval" style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5, paddingTop: '20px' }}>
              Your newsletter subscription request has been submitted for verification.<br />
              You will be notified once your request is approved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setShowApprovalPopup(false)} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter Subscription Popup */}
      {!isAdmin && showPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, paddingTop: '220px' }}>
          <div style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', paddingTop: '80px' }}>
            <img src="/newsletter.png" alt="Newsletter" style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }} />
            <h2 style={{ fontFamily: 'Lexend Deca, sans-serif', fontSize: '24px', fontWeight: 600, color: '#000000', marginBottom: '16px', textAlign: 'center' }}>
              Register for Newsletter
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5 }}>
              Would you like to subscribe to our daily email newsletter?
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '20px' }}>
              <button onClick={handleYes} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
                Yes
              </button>
              <button onClick={handleNo} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
                No
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <input type="checkbox" id="dontAskAgain" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="dontAskAgain" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', cursor: 'pointer', userSelect: 'none' }}>
                Don't ask again
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
