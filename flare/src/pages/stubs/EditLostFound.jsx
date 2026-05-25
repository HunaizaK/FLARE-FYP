import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';

const EditLostFound = () => {
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const item        = state?.item;
  const currentUser = useSelector((s) => s.auth.user);

  const [showApprovalPopup, setShowApprovalPopup]       = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [formData, setFormData] = useState({
    category:       item?.category       || '',
    name:           item?.name           || '',
    location:       item?.location       || '',
    contactInfo:    item?.contactInfo    || '',
    additionalInfo: item?.additionalInfo || '',
    image:          item?.image          || null,
    isUrgent:       item?.isUrgent       || false,
  });

  if (!item || item.reportedBy !== currentUser) {
    navigate('/lost-found');
    return null;
  }

  const handleFormChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = formData.category && formData.name && formData.location && formData.contactInfo;

  const handleSubmit = () => {
    if (!isFormValid) return;
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    const account  = accounts.find((a) => a.userName === currentUser);
    const pending  = JSON.parse(localStorage.getItem('flare_pending_edit_lostfound') || '[]');
    pending.push({
      id:          Date.now().toString(),
      originalId:  item.id,
      ...formData,
      reportedBy:  currentUser,
      memberSince: account?.submittedAt || '—',
      phone:       account?.contactNo   || formData.contactInfo,
      submittedAt: new Date().toISOString().split('T')[0],
    });
    localStorage.setItem('flare_pending_edit_lostfound', JSON.stringify(pending));
    setShowApprovalPopup(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />
      <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>

        <div style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 100, padding: '20px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '50px', fontWeight: 600, color: '#000000', margin: 0 }}>Lost & Found</h1>
            <button onClick={() => navigate('/lost-found')} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '200px', height: '52px', borderRadius: '16px', border: 'none', outline: 'none', cursor: 'pointer' }}>
              Back to List
            </button>
          </div>
        </div>

        <div style={{ padding: '40px 80px', maxWidth: '800px' }}>
          <div className="flex flex-col" style={{ gap: '24px' }}>

            {/* Category Dropdown */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000', marginBottom: '8px', display: 'block' }}>Category *</label>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', height: '48px', paddingLeft: '20px', paddingRight: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: showCategoryDropdown ? '20px 20px 0 0' : '20px', cursor: 'pointer' }} onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                  <input type="text" placeholder="Select category" value={formData.category} readOnly className="flex-1 outline-none border-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: formData.category ? '#1F2937' : '#9CA3AF', backgroundColor: 'transparent', cursor: 'pointer' }} />
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '8px' }}>▼</div>
                </div>
                {showCategoryDropdown && (
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 20px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    {['Person', 'Pet', 'Item'].map((cat, i) => (
                      <div key={cat} onClick={() => { handleFormChange('category', cat); setShowCategoryDropdown(false); }} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: i < 2 ? '1px solid #e6e7e9ff' : 'none', fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#1F2937' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>{cat}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {[
              { label: 'Name *',                   field: 'name',           placeholder: 'Enter name' },
              { label: 'Location *',               field: 'location',       placeholder: 'Qasim Bagh, Multan' },
              { label: 'Contact Info *',           field: 'contactInfo',    placeholder: '+92 333 3333333' },
              { label: 'Additional Info (if any)', field: 'additionalInfo', placeholder: 'Wearing blue shirt' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000', marginBottom: '8px', display: 'block' }}>{label}</label>
                <input type="text" value={formData[field]} onChange={(e) => handleFormChange(field, e.target.value)} placeholder={placeholder} style={{ width: '100%', height: '48px', border: '1px solid #D1D5DB', borderRadius: '30px', padding: '0 20px', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none' }} />
              </div>
            ))}

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000', marginBottom: '8px', display: 'block' }}>Upload Picture (if any)</label>
              {formData.image && <img src={formData.image} alt="current" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }} />
            </div>

            <div className="flex items-center" style={{ gap: '8px' }}>
              <input type="checkbox" id="urgent" checked={formData.isUrgent} onChange={(e) => handleFormChange('isUrgent', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="urgent" style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#000000', cursor: 'pointer' }}>Mark as urgent</label>
            </div>

            <button onClick={handleSubmit} disabled={!isFormValid} className={`font-medium transition-colors duration-200 ${isFormValid ? 'bg-[#b7c9dc] hover:bg-[#8f9dad] text-black' : 'bg-[#9CA3AF] text-black cursor-not-allowed'}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '100%', height: '52px', borderRadius: '16px', border: 'none', outline: 'none', cursor: isFormValid ? 'pointer' : 'not-allowed', marginTop: '16px' }}>
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Approval Popup */}
      {showApprovalPopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, paddingTop: '220px' }}>
          <div style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', paddingTop: '80px' }}>
            <img src="/approval.png" alt="Approval" style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5, paddingTop: '20px' }}>
              Your edit request has been successfully submitted for review.<br />You will be notified once your request is approved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => { setShowApprovalPopup(false); navigate('/lost-found'); }} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditLostFound;
