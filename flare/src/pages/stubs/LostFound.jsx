import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { ImageOutlined, ContentCopyOutlined, CloseOutlined, SearchOutlined, LocationOn, Phone } from '@mui/icons-material';

const LostFound = () => {
  const [lostItems, setLostItems] = useState([
    {
      id: 1,
      category: 'Person',
      name: 'Name',
      location: 'Location',
      contactInfo: '0333 333333',
      additionalInfo: 'Additional info',
      image: null,
      isUrgent: true,
      reportedBy: 'User',
      memberSince: '2025',
    },
    {
      id: 2,
      category: 'Pet',
      name: 'Name',
      location: 'Location',
      contactInfo: '0333 333333',
      additionalInfo: 'Additional info',
      image: null,
      isUrgent: false,
      reportedBy: 'User',
      memberSince: '2025',
    },
    {
      id: 3,
      category: 'Item',
      name: 'Name',
      location: 'Location',
      contactInfo: '0333 333333',
      additionalInfo: 'Additional info',
      image: null,
      isUrgent: false,
      reportedBy: 'User',
      memberSince: '2025',
    },
    {
      id: 4,
      category: 'Person',
      name: 'Name 4',
      location: 'Location 4',
      contactInfo: '0333 333334',
      additionalInfo: 'Additional info 4',
      image: null,
      isUrgent: false,
      reportedBy: 'User',
      memberSince: '2025',
    },
    {
      id: 5,
      category: 'Pet',
      name: 'Name 5',
      location: 'Location 5',
      contactInfo: '0333 333335',
      additionalInfo: 'Additional info 5',
      image: null,
      isUrgent: true,
      reportedBy: 'User',
      memberSince: '2025',
    },
    {
      id: 6,
      category: 'Item',
      name: 'Name 6',
      location: 'Location 6',
      contactInfo: '0333 333336',
      additionalInfo: 'Additional info 6',
      image: null,
      isUrgent: false,
      reportedBy: 'User',
      memberSince: '2025',
    },
  ]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    location: '',
    contactInfo: '',
    additionalInfo: '',
    image: null,
    isUrgent: false,
  });  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowReportForm(false);
  };

  const handleReportLost = () => {
    setShowReportForm(true);
    setSelectedItem(null);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setShowReportForm(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = formData.category && formData.name && formData.location && formData.contactInfo;

  const handleSubmit = () => {
    if (isFormValid) {
      const newItem = {
        id: lostItems.length + 1,
        ...formData,
        reportedBy: 'User',
        memberSince: '2025',
      };
      setLostItems([...lostItems, newItem]);
      setFormData({
        category: '',
        name: '',
        location: '',
        contactInfo: '',
        additionalInfo: '',
        image: null,
        isUrgent: false,
      });
      setShowReportForm(false);
    }
  };

  const handleCopyContact = (contact) => {
    navigator.clipboard.writeText(contact);
  };

  // Filter lost items based on search query
  const filteredItems = lostItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      item.contactInfo.toLowerCase().includes(query) ||
      (item.additionalInfo && item.additionalInfo.toLowerCase().includes(query))
    );
  });

  // Main List View
  if (!selectedItem && !showReportForm) {
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1
                style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '50px',
                  fontWeight: 600,
                  color: '#000000',
                  margin: 0,
                }}
              >
                Lost & Found
              </h1>

              <button
                onClick={handleReportLost}
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
                Report Lost
              </button>
            </div>

            {/* Search Bar - Centered */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '30px',
                  }}
                >
                  <SearchOutlined
                    style={{
                      color: '#9CA3AF',
                      fontSize: '22px',
                      marginRight: '12px',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Search by name, category, location, or contact"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none border-none"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      color: '#1F2937',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content Container */}
          <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'center' }}>
            {/* Lost Items List - Responsive Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px',
                maxWidth: '1400px',
                width: '100%',
              }}
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* Image at top */}
                  <div
                    style={{
                      width: '100%',
                      paddingTop: '100%',
                      position: 'relative',
                      backgroundColor: '#E5E7EB',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageOutlined style={{ fontSize: '64px', color: '#9CA3AF' }} />
                      )}
                    </div>
                  </div>

                  {/* Content Below */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Category and Urgent Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          backgroundColor: item.category === 'Person' ? '#EF4444' : item.category === 'Pet' ? '#F59E0B' : '#3B82F6',
                          padding: '4px 12px',
                          borderRadius: '12px',
                        }}
                      >
                        {item.category}
                      </span>
                      {item.isUrgent && (
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            backgroundColor: '#DC2626',
                            padding: '4px 12px',
                            borderRadius: '12px',
                          }}
                        >
                          Urgent
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h3
                      style={{
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#000000',
                        margin: 0,
                      }}
                    >
                      {item.name}
                    </h3>

                    {/* Location */}
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#6B7280',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <LocationOn style={{ fontSize: '16px' }} /> {item.location}
                    </p>

                    {/* Additional Info */}
                    {item.additionalInfo && (
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#9CA3AF',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.additionalInfo}
                      </p>
                    )}

                    {/* Call Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyContact(item.contactInfo);
                      }}
                      className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        width: '100%',
                        height: '40px',
                        borderRadius: '8px',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Phone style={{ fontSize: '16px' }} /> {item.contactInfo}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail View
  if (selectedItem) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white">
        <Navbar />

        <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1
                style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '50px',
                  fontWeight: 600,
                  color: '#000000',
                  margin: 0,
                }}
              >
                Lost & Found
              </h1>

              <button
                onClick={handleReportLost}
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
                Report Lost
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 130px)' }}>
            <div style={{ maxWidth: '1400px', width: '100%' }}>

              {/* Content Layout */}
              <div className="flex" style={{ gap: '40px' }}>
                {/* Left Side - Large Image */}
                <div>
                  <div
                    style={{
                      width: '500px',
                      height: '500px',
                      backgroundColor: '#E5E7EB',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedItem.image ? (
                      <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageOutlined style={{ fontSize: '120px', color: '#9CA3AF' }} />
                    )}
                  </div>
                </div>

                {/* Right Side - User Info */}
                <div style={{ flex: 1 }}>
                  {/* User Info Box */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      width: '100%',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '24px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#6B7280',
                        marginBottom: '4px',
                      }}
                    >
                      Reported by
                    </p>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#000000',
                        marginBottom: '16px',
                      }}
                    >
                      {selectedItem.reportedBy}
                    </p>

                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#6B7280',
                        marginBottom: '4px',
                      }}
                    >
                      Member since
                    </p>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#000000',
                      }}
                    >
                      {selectedItem.memberSince}
                    </p>
                  </div>

                  {/* Contact Button */}
                  <button
                    onClick={() => handleCopyContact(selectedItem.contactInfo)}
                    className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      width: '100%',
                      height: '52px',
                      borderRadius: '12px',
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Phone style={{ fontSize: '18px' }} />
                    {selectedItem.contactInfo}
                    <ContentCopyOutlined style={{ fontSize: '18px' }} />
                  </button>

                  {/* Details Below Button */}
                  <div>
                    {/* Category and Urgent Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          backgroundColor: selectedItem.category === 'Person' ? '#EF4444' : selectedItem.category === 'Pet' ? '#F59E0B' : '#3B82F6',
                          padding: '4px 12px',
                          borderRadius: '12px',
                        }}
                      >
                        {selectedItem.category}
                      </span>
                      {selectedItem.isUrgent && (
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            backgroundColor: '#DC2626',
                            padding: '4px 12px',
                            borderRadius: '12px',
                          }}
                        >
                          URGENT
                        </span>
                      )}
                    </div>

                    <h2
                      style={{
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '28px',
                        fontWeight: 600,
                        color: '#000000',
                        marginBottom: '8px',
                      }}
                    >
                      {selectedItem.name}
                    </h2>

                    <p
                      style={{
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '18px',
                        fontWeight: 400,
                        color: '#000000',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <LocationOn style={{ fontSize: '20px', color: '#6B7280' }} /> {selectedItem.location}
                    </p>

                    <p
                      style={{
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '18px',
                        fontWeight: 400,
                        color: '#6B7280',
                      }}
                    >
                      {selectedItem.additionalInfo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Report Form View
  if (showReportForm) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white">
        <Navbar />

        <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1
                style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '50px',
                  fontWeight: 600,
                  color: '#000000',
                  margin: 0,
                }}
              >
                Lost & Found
              </h1>

              <button
                onClick={handleBackToList}
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
                Back to List
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div style={{ padding: '40px 80px', maxWidth: '800px' }}>

            {/* Form */}
            <div className="flex flex-col" style={{ gap: '24px' }}>
              {/* Category Dropdown */}
              <div style={{ position: 'relative' }}>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Category *
                </label>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '48px',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: showCategoryDropdown ? '20px 20px 0 0' : '20px',
                      transition: 'border-radius 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <input
                      type="text"
                      placeholder="Select category"
                      value={formData.category}
                      readOnly
                      className="flex-1 outline-none border-none"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        color: formData.category ? '#1F2937' : '#9CA3AF',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                      }}
                    />
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#9CA3AF',
                        marginLeft: '8px',
                      }}
                    >
                      ▼
                    </div>
                  </div>

                  {/* Category Options Dropdown */}
                  {showCategoryDropdown && (
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderTop: 'none',
                        borderRadius: '0 0 20px 20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {['Person', 'Pet', 'Item'].map((category, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            handleFormChange('category', category);
                            setShowCategoryDropdown(false);
                          }}
                          style={{
                            padding: '12px 20px',
                            cursor: 'pointer',
                            borderBottom: index < 2 ? '1px solid #e6e7e9ff' : 'none',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '16px',
                            color: '#1F2937',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter name"
                  style={{
                    width: '100%',
                    height: '48px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '30px',
                    padding: '0 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Location */}
              <div>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  placeholder="Qasim Bagh, Multan"
                  style={{
                    width: '100%',
                    height: '48px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '30px',
                    padding: '0 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Contact Info */}
              <div>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Contact Info *
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => handleFormChange('contactInfo', e.target.value)}
                  placeholder="+92 333 3333333"
                  style={{
                    width: '100%',
                    height: '48px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '30px',
                    padding: '0 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Additional Info */}
              <div>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Additional Info (if any)
                </label>
                <input
                  type="text"
                  value={formData.additionalInfo}
                  onChange={(e) => handleFormChange('additionalInfo', e.target.value)}
                  placeholder="Wearing blue shirt"
                  style={{
                    width: '100%',
                    height: '48px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '30px',
                    padding: '0 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Upload Picture */}
              <div>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Upload Picture (if any)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                  }}
                />
              </div>

              {/* Mark as Urgent */}
              <div className="flex items-center" style={{ gap: '8px' }}>
                <input
                  type="checkbox"
                  id="urgent"
                  checked={formData.isUrgent}
                  onChange={(e) => handleFormChange('isUrgent', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                <label
                  htmlFor="urgent"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    color: '#000000',
                    cursor: 'pointer',
                  }}
                >
                  Mark as urgent
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`font-medium transition-colors duration-200 ${isFormValid ? 'bg-[#b7c9dc] hover:bg-[#8f9dad] text-black' : 'bg-[#9CA3AF] text-black cursor-not-allowed'
                  }`}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  width: '100%',
                  height: '52px',
                  borderRadius: '16px',
                  border: 'none',
                  outline: 'none',
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  boxShadow: 'none',
                  marginTop: '16px',
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
export default LostFound;