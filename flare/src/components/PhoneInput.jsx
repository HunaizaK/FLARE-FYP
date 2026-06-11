import { useState } from 'react';

const PhoneInput = ({ value, onChange, placeholder = '333 3333333', maxLength = 10, disabled = false, className = '', style = {} }) => {
  const [isFocused, setIsFocused] = useState(false);

  // Extract only digits from the input (remove +92 prefix if user accidentally types it)
  const handleChange = (e) => {
    let inputValue = e.target.value;
    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^0-9]/g, '');
    // Ensure it doesn't exceed maxLength
    inputValue = inputValue.slice(0, maxLength);
    onChange(inputValue);
  };

  // Format display: show +92 and the digits
  const displayValue = value ? `${value}` : '';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '48px',
        border: `1px solid ${isFocused ? '#3B82F6' : '#D1D5DB'}`,
        borderRadius: '30px',
        padding: '0 16px',
        backgroundColor: disabled ? '#F3F4F6' : '#FFFFFF',
        transition: 'border-color 0.2s',
        ...style,
      }}
    >
      {/* Pakistan Flag & Country Code */}
      <span style={{ fontSize: '20px', marginRight: '8px' }}>🇵🇰</span>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          fontWeight: 500,
          color: '#374151',
          marginRight: '8px',
          whiteSpace: 'nowrap',
        }}
      >
        +92
      </span>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: '#D1D5DB',
          marginRight: '12px',
        }}
      />

      {/* Input Field */}
      <input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          backgroundColor: 'transparent',
          color: '#1F2937',
          width: '100%',
        }}
      />
    </div>
  );
};

export default PhoneInput;
