import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setAccountType, setToken, setUserId } from '../../features/auth/authSlice';
import { AiOutlineUser, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError]     = useState('');
  const [isLoading, setIsLoading]       = useState(false);

  // Check if all fields are filled
  const isFormComplete = formData.username && formData.password;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
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

  const handleForgotPassword = () => {
    // Navigate to forgot password page (to be implemented)
    console.log('Forgot password clicked');
  };

  const handleSignUpRedirect = () => {
    navigate('/createacc');
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
            padding: '70px 50px',
            width: '750px',
            right: '-10px',
            height: '700px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative',
          }}
        >
          {/* Form Container */}
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
              Login
            </h1>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#fbfcffff',
                marginBottom: '40px',
              }}
            >
              Please log in to your account to continue.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '24px' }}>
              {/* User Name Input */}
              <div>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#ffffffff',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full bg-white text-gray-700 placeholder-gray-400 outline-none"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      height: '48px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '30px',
                      padding: '0 20px',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <label
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#ffffffff',
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#ffffffff',
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full bg-white text-gray-700 placeholder-gray-400 outline-none pr-12"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      height: '48px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '30px',
                      paddingLeft: '20px',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? (
                      <AiOutlineEye style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
                    ) : (
                      <AiOutlineEyeInvisible style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Error */}
              {loginError && (
                <p style={{ color: '#EF4444', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                  {loginError}
                </p>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={!isFormComplete || isLoading}
                className={`w-full font-medium transition-colors duration-200 ${isFormComplete && !isLoading
                  ? 'bg-[#b7c9dc] hover:bg-[#8f9dad] text-black'
                  : 'bg-[#9CA3AF] cursor-not-allowed text-black'
                  }`}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  height: '48px',
                  borderRadius: '16px',
                  border: 'none',
                  outline: 'none',
                  marginTop: '8px',
                  boxSizing: 'border-box',
                }} >
                {isLoading ? 'Logging in…' : 'Login'}
              </button>
            </form>

            {/* Sign Up Section */}
            <div className="text-center" style={{ marginTop: '32px' }}>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#ffffffff',
                  marginBottom: '16px',
                }}
              >
                Don't have an account?{' '}
                <button
                  onClick={handleSignUpRedirect}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#ffffffff',
                    textDecoration: 'underline',
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;