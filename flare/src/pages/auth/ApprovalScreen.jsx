import { useNavigate } from 'react-router-dom';

const ApprovalScreen = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="h-screen w-screen overflow-hidden fixed inset-0" style={{ backgroundColor: '#ffffffff', position: 'relative' }}>
      {/* Illustration Background */}
      <img
        src="/illustration.png"
        alt="illustration"
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          height: '100vh',
          width: 'auto',
          objectFit: 'contain',
          zIndex: 1,
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />

      {/* Logo and Company Name */}
      <div
        style={{
          position: 'absolute',
          top: '30px',
          left: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 20,
        }}
      >
        <img
          src="/logo.png"
          alt="FLARE logo"
          style={{
            width: '53px',
            height: '53px',
            objectFit: 'contain',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span
          style={{
            fontFamily: 'Lexend, sans-serif',
            fontWeight: 700,
            fontSize: '32px',
            color: '#345f86',
            letterSpacing: '1px',
          }}
        >
          FLARE
        </span>
      </div>

      {/* White Box Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          position: 'absolute',
          right: '100px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: '#577a92',
            borderRadius: '20px',
            padding: '60px 50px',
            width: '750px',
            right: '-10px',
            height: '700px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div className="w-full max-w-md">
            <h1
              style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '48px',
                fontWeight: 600,
                color: '#ffffffff',
                marginBottom: '8px',
              }}
            >
              Account Submitted
            </h1>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#fbfcffff',
                marginBottom: '24px',
                lineHeight: 1.6,
              }}
            >
              Your account has been successfully submitted for verification.
            </p>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#fbfcffff',
                marginBottom: '24px',
                lineHeight: 1.6,
              }}
            >
              Our team is reviewing your information.
            </p>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#fbfcffff',
                marginBottom: '40px',
                lineHeight: 1.6,
              }}
            >
              You will be notified once your account is approved.
            </p>

            <button
              onClick={handleBackToLogin}
              className="w-full bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                height: '52px',
                borderRadius: '16px',
                border: 'none',
                outline: 'none',
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalScreen;
