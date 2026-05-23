import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';

const Reports = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [showPopup, setShowPopup] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    const preference = localStorage.getItem('floodUpdatesPreference');
    if (!preference) {
      setShowPopup(true);
    }
  }, []);

  const handleYes = () => {
    if (dontAskAgain) {
      localStorage.setItem('floodUpdatesPreference', 'yes');
    }
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    const account = accounts.find((a) => a.userName === currentUser);
    const pending = JSON.parse(localStorage.getItem('flare_pending_newsletters') || '[]');
    const alreadyPending = pending.some((p) => p.userName === currentUser);
    if (!alreadyPending) {
      pending.push({
        id: Date.now().toString(),
        userName: currentUser,
        email: account?.email || currentUser,
        phone: account?.contactNo || '',
        submittedAt: new Date().toISOString().split('T')[0],
      });
      localStorage.setItem('flare_pending_newsletters', JSON.stringify(pending));
    }
    setShowPopup(false);
    setShowApprovalPopup(true);
  };

  const handleNo = () => {
    if (dontAskAgain) {
      localStorage.setItem('floodUpdatesPreference', 'no');
    }
    setShowPopup(false);
  };

  const reports = [
    { id: 1, name: 'Report 1' },
    { id: 2, name: 'Report 2' },
    { id: 3, name: 'Report 3' },
    { id: 4, name: 'Report 4' },
    { id: 5, name: 'Report 5' },
    { id: 6, name: 'Report 6' },
  ];

  const handleView = (reportId) => {
    console.log('Viewing report:', reportId);
    // Implement view logic
  };

  const handleDownload = (reportId) => {
    console.log('Downloading report:', reportId);
    // Implement download logic
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <div
        className="absolute top-0 h-full transition-all duration-300 overflow-y-auto"
        style={{
          left: '146px',
          width: 'calc(100% - 146px)',
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#FFFFFF',
            zIndex: 100,
            padding: '20px 30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h1
            style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: '50px',
              fontWeight: 600,
              color: '#000000',
              margin: 0,
            }}
          >
            Reports
          </h1>
        </div>

        {/* Content Container */}
        <div style={{ padding: '20px 30px' }}>
          {/* Reports List */}
          <div className="flex flex-col items-center" style={{ gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between"
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '15px 70px',
                  borderRadius: '16px',
                  width: '95%',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #E5E7EB',
                }}
              >
                {/* Report Name */}
                <h2
                  style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '36px',
                    fontWeight: 500,
                    color: '#000000',
                  }}
                >
                  {report.name}
                </h2>

                {/* Action Buttons */}
                <div className="flex items-center" style={{ gap: '16px' }}>
                  {/* View Button */}
                  <button
                    onClick={() => handleView(report.id)}
                    className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      width: '200px',
                      height: '52px',
                      borderRadius: '16px',
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      boxShadow: 'none',
                    }}
                  >
                    View
                  </button>

                  {/* Download PDF Button */}
                  <button
                    onClick={() => handleDownload(report.id)}
                    className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      width: '200px',
                      height: '52px',
                      borderRadius: '16px',
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      boxShadow: 'none',
                    }}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Approval Popup */}
      {showApprovalPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            paddingTop: '220px',
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              paddingTop: '80px',
            }}
          >
            <img
              src="/approval.png"
              alt="Approval"
              style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }}
            />
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000',
              marginBottom: '24px', textAlign: 'center', lineHeight: 1.5, paddingTop: '20px',
            }}>
              Your newsletter subscription request has been submitted for verification.
              <br />
              You will be notified once your request is approved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowApprovalPopup(false)}
                style={{
                  padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#8f9dad'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#b7c9dc'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            paddingTop: '220px',
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              paddingTop: '80px',
            }}
          >
            {/* Newsletter Image - Megaphone sticking out */}
            <img
              src="/newsletter.png"
              alt="Newsletter"
              style={{
                position: 'absolute',
                top: '-450px',
                left: '0',
                width: '100%',
                height: 'auto',
              }}
            />

            <h2
              style={{
                fontFamily: 'Lexend Deca, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: '#000000',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              Register for Newsletter
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#000000',
                marginBottom: '24px',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              Would you like to subscribe to our daily email newsletter?
            </p>

            {/* Yes/No Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <button
                onClick={handleYes}
                style={{
                  padding: '12px 32px',
                  width: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#b7c9dc',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#8f9dad';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#b7c9dc';
                }}
              >
                Yes
              </button>
              <button
                onClick={handleNo}
                style={{
                  padding: '12px 32px',
                  width: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#b7c9dc',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#8f9dad';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#b7c9dc';
                }}
              >
                No
              </button>
            </div>

            {/* Don't ask again checkbox */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <input
                type="checkbox"
                id="dontAskAgain"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="dontAskAgain"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
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