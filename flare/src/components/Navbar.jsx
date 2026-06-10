import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapOutlined,
  CottageOutlined,
  AssessmentOutlined,
  LuggageOutlined,
  VolunteerActivismOutlined,
  SettingsOutlined,
  HowToRegOutlined,
  AssignmentOutlined,
} from '@mui/icons-material';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const accountType = useSelector((state) => state.auth.accountType);

  // Organization menu items
  const organizationMenuItems = [
    { icon: <MapOutlined />, label: 'Maps', path: '/maps' },
    { icon: <CottageOutlined />, label: 'Shelter Management', path: '/shelter-management' },
    { icon: <AssessmentOutlined />, label: 'Reports', path: '/reports' },
    { icon: <LuggageOutlined />, label: 'Lost & Found', path: '/lost-found' },
    { icon: <VolunteerActivismOutlined />, label: 'Donation', path: '/donation' },
    { icon: <AssignmentOutlined />, label: 'My Requests', path: '/my-requests' },
    { icon: <SettingsOutlined />, label: 'Settings', path: '/settings' },
  ];

  // Citizen menu items
  const citizenMenuItems = [
    { icon: <MapOutlined />, label: 'Maps', path: '/maps' },
    { icon: <AssessmentOutlined />, label: 'Reports', path: '/reports' },
    { icon: <LuggageOutlined />, label: 'Lost & Found', path: '/lost-found' },
    { icon: <VolunteerActivismOutlined />, label: 'Donation', path: '/donation' },
    { icon: <AssignmentOutlined />, label: 'My Requests', path: '/my-requests' },
    { icon: <SettingsOutlined />, label: 'Settings', path: '/settings' },
  ];

  // Admin menu items
  const adminMenuItems = [
    { icon: <MapOutlined />,                  label: 'Maps',                path: '/maps' },
    { icon: <HowToRegOutlined />,             label: 'Sign-up Approvals',   path: '/admin/users' },
    { icon: <AssessmentOutlined />,            label: 'Report Approval',     path: '/admin/report-approval' },
    { icon: <CottageOutlined />,              label: 'Shelter Approvals',   path: '/admin/shelter-list' },
    { icon: <LuggageOutlined />,               label: 'Lost & Found',        path: '/lost-found' },
    { icon: <VolunteerActivismOutlined />,     label: 'Donation',            path: '/donation' },
    { icon: <SettingsOutlined />,             label: 'Settings',            path: '/settings' },
  ];

  const menuItems =
    accountType === 'admin'
      ? adminMenuItems
      : accountType === 'organization'
      ? organizationMenuItems
      : citizenMenuItems;

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div
      className="fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out"
      style={{
        left: 0,
        top: 0,
        bottom: 0,
        width: isOpen ? '300px' : '100px',
        backgroundColor: '#e9eff4',
        boxShadow: '2px 0 10px rgba(0,0,0,0.08)',
        borderRadius: '0 20px 20px 0',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* top left - larger circle */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          backgroundColor: '#d3deea',
          top: '-60px',
          left: '-25px',
          zIndex: 2,
        }}
      />
      {/* Circular decorative shapes */}
      {/* Top left circle */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: '#b7c9dc',
          top: '-40px',
          left: '-5px',
          zIndex: 2,
        }}
      />

      {/* Bottom right - larger circle */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          backgroundColor: '#d3deea',
          bottom: '-80px',
          right: '-80px',
          zIndex: 2,
        }}
      />

      {/* Bottom right - smaller circle (overlapping in middle) */}
      <div
        className="absolute pointer-events-none "
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: '#b7c9dc',
          bottom: '-30px',
          right: '-30px',
          zIndex: 3,
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col" style={{ zIndex: 3 }}>
        {/* Logo Section */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center cursor-pointer hover:bg-gray-50 transition-all duration-200"
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="FLARE"
              style={{ width: '60px', height: '60px' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {isOpen && (
              <span
                style={{
                  fontFamily: 'Lexend Deca, sans-serif',
                  fontWeight: 700,
                  fontSize: '28px',
                  color: '#1F618A',
                  paddingLeft: '16px',
                }}
              >
                FLARE
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto" style={{ paddingTop: '20px' }}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigate(item.path)}
              className="w-full flex items-center hover:bg-gray-50"
              style={{
                padding: '10px 37px',
                justifyContent: 'flex-start',
                gap: isOpen ? '20px' : '0',
                marginBottom: index < menuItems.length - 1 ? '40px' : '0',
                backgroundColor: 'transparent',
                borderLeft: '4px solid transparent',
                color: location.pathname === item.path ? '#1F618A' : '#4B5563',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease-in-out',
              }}
            >
              <span 
                style={{ 
                  fontSize: '28px', 
                  display: 'flex', 
                  alignItems: 'center',
                  minWidth: '28px',
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  opacity: isOpen ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>


        {/* Close Button */}
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="absolute transition-all duration-200 hover:bg-gray-100"
            style={{
              top: '35px',
              right: '20px',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: '30px', color: '#6B7280' }}>×</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;