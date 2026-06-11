import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from '../../services/api';

const SignUpForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get the role from navigation state
  const role = location.state?.role || 'citizen';

  const [formData, setFormData] = useState({
    email: '',
    contact_no: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading]                   = useState(false);
  const [signupError, setSignupError]               = useState('');

  // Validation errors
  const [errors, setErrors] = useState({
    email: '',
    contact_no: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return '';
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Helper: Allow only digits and + symbol
  const sanitizePhoneInput = (value) => {
    return value.replace(/[^0-9+]/g, '');
  };

  // Pakistani phone number validation (03XX-XXXXXXX format)
  const validateContactNo = (contactNo) => {
    const phoneRegex = /^03[0-9]{9}$/;
    if (!contactNo) return '';
    if (!phoneRegex.test(contactNo.replace(/\s|-/g, ''))) {
      return 'Phone number must be exactly 11 digits';
    }
    return '';
  };

  // Password validation (min 8 chars, uppercase, lowercase, number, special char)
  const validatePassword = (password) => {
    if (!password) return '';
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return '';
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  // Check if all fields are filled and valid
  const isFormComplete = formData.email && formData.contact_no && formData.username && formData.password && formData.confirmPassword &&
    !errors.email && !errors.contact_no && !errors.password && !errors.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate on change
    let error = '';
    switch (name) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'contact_no':
        const sanitized = sanitizePhoneInput(value);
        setFormData(prev => ({ ...prev, contact_no: sanitized }));
        error = validateContactNo(sanitized);
        break;
      case 'password':
        error = validatePassword(value);
        // Also revalidate confirm password if it exists
        if (formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
          }));
        }
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
      default:
        break;
    }

    setErrors({
      ...errors,
      [name]: error,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupError('');
    try {
      await api.post('/auth/signup', {
        email:      formData.email,
        contact_no: formData.contact_no,
        username:   formData.username,
        password:   formData.password,
        role,
      });
      if (role === 'organization') {
        navigate('/approval');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Signup failed. Please try again.';
      if (detail === 'Username or email already exists') {
        setSignupError('This username or email is already registered.');
      } else {
        setSignupError(detail);
      }
    } finally {
      setIsLoading(false);
    }
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
              padding: '0px 50px',
              width: '750px',
              right: '-10px',
              height: '700px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              position: 'relative',
            }}
          >
         

          <div className="w-full max-w-md">
            <h1
              style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '48px',
                fontWeight: 600,
                color: '#ffffffff',
                marginBottom: '0px',
              }}
            >
              Sign Up
            </h1>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#fbfcffff',
                marginBottom: '16px',
              }}
            >
              Create your account as {role === 'organization' ? 'an Organization' : role === 'admin' ? 'an Admin' : 'a Citizen'}.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '12px' }}>
              {/* Email Input */}
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
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-white text-gray-700 placeholder-gray-400 outline-none"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    height: '48px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '20px',
                    padding: '0 16px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                {errors.email && (
                  <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Contact No Input */}
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
                  Contact No.
                </label>
                <input
                  type="tel"
                  name="contact_no"
                  value={formData.contact_no}
                  onChange={handleChange}
                  placeholder="+92 333 3333333"
                  maxLength={11}
                  className="w-full bg-white text-gray-700 placeholder-gray-400 outline-none"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    height: '48px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '20px',
                    padding: '0 16px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                {errors.contact_no && (
                  <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {errors.contact_no}
                  </p>
                )}
              </div>

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
                  User Name
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className="w-full bg-white text-gray-700 placeholder-gray-400 outline-none"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    height: '48px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '20px',
                    padding: '0 16px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* Password Input */}
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
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="bg-white text-gray-700 placeholder-gray-400 outline-none"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      height: '48px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '20px',
                      padding: '0 48px 0 16px',
                      width: '100%',
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
                      padding: 0,
                      outline: 'none',
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
                {errors.password && (
                  <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
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
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="bg-white text-gray-700 placeholder-gray-400 outline-none"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      height: '48px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '20px',
                      padding: '0 48px 0 16px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {showConfirmPassword ? (
                      <AiOutlineEye style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
                    ) : (
                      <AiOutlineEyeInvisible style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* API Error */}
              {signupError && (
                <p style={{ color: '#EF4444', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                  {signupError}
                </p>
              )}

              {/* Sign Up Button */}
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
                }}
              >
                {isLoading ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center" style={{ marginTop: '16px' }}>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#ffffffff',
                }}
              >
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
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
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
