import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import {
  ImageOutlined, ContentCopyOutlined, CloseOutlined,
  SearchOutlined, LocationOn, Phone, MoreVertOutlined,
} from '@mui/icons-material';

const SEED_ITEMS = [
  { id: 'lf-seed1', category: 'Person', name: 'Name',   location: 'Location',   contactInfo: '0333 333333', additionalInfo: 'Additional info',   image: null, isUrgent: true,  reportedBy: 'system', memberSince: '2025', phone: '0333 333333' },
  { id: 'lf-seed2', category: 'Pet',    name: 'Name',   location: 'Location',   contactInfo: '0333 333333', additionalInfo: 'Additional info',   image: null, isUrgent: false, reportedBy: 'system', memberSince: '2025', phone: '0333 333333' },
  { id: 'lf-seed3', category: 'Item',   name: 'Name',   location: 'Location',   contactInfo: '0333 333333', additionalInfo: 'Additional info',   image: null, isUrgent: false, reportedBy: 'system', memberSince: '2025', phone: '0333 333333' },
  { id: 'lf-seed4', category: 'Person', name: 'Name 4', location: 'Location 4', contactInfo: '0333 333334', additionalInfo: 'Additional info 4', image: null, isUrgent: false, reportedBy: 'system', memberSince: '2025', phone: '0333 333334' },
  { id: 'lf-seed5', category: 'Pet',    name: 'Name 5', location: 'Location 5', contactInfo: '0333 333335', additionalInfo: 'Additional info 5', image: null, isUrgent: true,  reportedBy: 'system', memberSince: '2025', phone: '0333 333335' },
  { id: 'lf-seed6', category: 'Item',   name: 'Name 6', location: 'Location 6', contactInfo: '0333 333336', additionalInfo: 'Additional info 6', image: null, isUrgent: false, reportedBy: 'system', memberSince: '2025', phone: '0333 333336' },
];

const loadApprovedItems = () => {
  try {
    const stored = localStorage.getItem('flare_approved_lostfound');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('flare_approved_lostfound', JSON.stringify(SEED_ITEMS));
    return SEED_ITEMS;
  } catch { return SEED_ITEMS; }
};

const CategoryBadge = ({ category }) => (
  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: category === 'Person' ? '#EF4444' : category === 'Pet' ? '#F59E0B' : '#3B82F6', padding: '4px 12px', borderRadius: '12px' }}>
    {category}
  </span>
);
const UrgentBadge = () => (
  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: '#DC2626', padding: '4px 12px', borderRadius: '12px' }}>Urgent</span>
);

const LostFound = () => {
  const navigate    = useNavigate();
  const accountType = useSelector((state) => state.auth.accountType);
  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin     = accountType === 'admin';

  const [lostItems, setLostItems]                 = useState(loadApprovedItems);
  const [selectedItem, setSelectedItem]           = useState(null);
  const [showReportForm, setShowReportForm]       = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [pendingAction, setPendingAction]         = useState(null);
  const [searchQuery, setSearchQuery]             = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // three-dots state
  const [openMenuId, setOpenMenuId]       = useState(null);
  const [showDetailMenu, setShowDetailMenu] = useState(false);

  // delete-request confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);

  const [formData, setFormData] = useState({
    category: '', name: '', location: '', contactInfo: '', additionalInfo: '', image: null, isUrgent: false,
  });

  const handleItemClick = (item) => { setOpenMenuId(null); setSelectedItem(item); setShowReportForm(false); };
  const handleReportLost  = () => { setShowReportForm(true); setSelectedItem(null); };
  const handleBackToList  = () => { setSelectedItem(null); setShowReportForm(false); };
  const handleFormChange  = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleCopyContact = (contact) => navigator.clipboard.writeText(contact);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // ── three-dots handlers ──
  const handleEditRequest = (item) => {
    setOpenMenuId(null); setShowDetailMenu(false);
    navigate('/lost-found/edit', { state: { item } });
  };
  const handleDeleteRequest = (item) => {
    setOpenMenuId(null); setShowDetailMenu(false);
    setDeleteTarget(item); setShowDeleteConfirm(true);
  };
  const handleConfirmDelete = () => {
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    const account  = accounts.find((a) => a.userName === currentUser);
    const pending  = JSON.parse(localStorage.getItem('flare_pending_delete_lostfound') || '[]');
    pending.push({
      id:          Date.now().toString(),
      originalId:  deleteTarget.id,
      category:    deleteTarget.category,
      name:        deleteTarget.name,
      reportedBy:  currentUser,
      memberSince: account?.submittedAt || '—',
      phone:       account?.contactNo   || deleteTarget.phone || deleteTarget.contactInfo,
      isUrgent:    deleteTarget.isUrgent,
      submittedAt: new Date().toISOString().split('T')[0],
    });
    localStorage.setItem('flare_pending_delete_lostfound', JSON.stringify(pending));
    setShowDeleteConfirm(false); setDeleteTarget(null);
    setPendingAction('delete'); setShowApprovalPopup(true);
  };

  // ── add-report submit ──
  const isFormValid = formData.category && formData.name && formData.location && formData.contactInfo;
  const handleSubmit = () => {
    if (!isFormValid) return;
    const accounts = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
    const account  = accounts.find((a) => a.userName === currentUser);
    const pending  = JSON.parse(localStorage.getItem('flare_pending_lostfound') || '[]');
    pending.push({
      id:          Date.now().toString(),
      ...formData,
      reportedBy:  currentUser,
      memberSince: account?.submittedAt || '—',
      phone:       account?.contactNo   || formData.contactInfo,
      submittedAt: new Date().toISOString().split('T')[0],
    });
    localStorage.setItem('flare_pending_lostfound', JSON.stringify(pending));
    setFormData({ category: '', name: '', location: '', contactInfo: '', additionalInfo: '', image: null, isUrgent: false });
    setShowReportForm(false);
    setPendingAction(null); setShowApprovalPopup(true);
  };

  const filteredItems = lostItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) || item.contactInfo.toLowerCase().includes(q) ||
      (item.additionalInfo && item.additionalInfo.toLowerCase().includes(q));
  });

  // ── shared sub-components ──
  const ApproveRequestsBtn = () => {
    const cnt = (() => { try { return ['flare_pending_lostfound','flare_pending_delete_lostfound','flare_pending_edit_lostfound'].reduce((s,k) => s + (JSON.parse(localStorage.getItem(k)||'[]').length), 0); } catch { return 0; } })();
    return (
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button onClick={() => navigate('/admin/lostfound-approvals')} style={{ height: '48px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000', boxShadow: '0 0px 12px rgba(0,0,0,0.18)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}>
          Approve Requests
        </button>
        {cnt > 0 && (
          <span style={{ position: 'absolute', top: '-8px', right: '-8px', minWidth: '20px', height: '20px', backgroundColor: '#EF4444', color: '#FFFFFF', borderRadius: '50%', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box', pointerEvents: 'none' }}>
            {cnt > 99 ? '99+' : cnt}
          </span>
        )}
      </div>
    );
  };

  const ApprovalPopup = () => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, paddingTop: '220px' }}>
      <div style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', paddingTop: '80px' }}>
        <img src="/approval.png" alt="Approval" style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }} />
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5, paddingTop: '20px' }}>
          {pendingAction === 'delete'
            ? <>Your deletion request has been successfully submitted for review.<br />You will be notified once your request is approved.</>
            : <>Your report has been successfully submitted for review.<br />You will be notified once your request is approved.</>}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => { setShowApprovalPopup(false); setPendingAction(null); }} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );

  const DeleteConfirmPopup = () => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5 }}>
          Are you sure you want to request deletion of this entry?
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {[{ label: 'Yes', action: handleConfirmDelete }, { label: 'No', action: () => { setShowDeleteConfirm(false); setDeleteTarget(null); } }].map(({ label, action }) => (
            <button key={label} onClick={action} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Three-dots dropdown (used on both card and detail view)
  const ThreeDotsMenu = ({ item, isOpen, onToggle, onClose }) => (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{ background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}
      >
        <MoreVertOutlined style={{ fontSize: '20px', color: '#374151' }} />
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={(e) => { e.stopPropagation(); onClose(); }} />
          <div style={{ position: 'absolute', top: '36px', right: 0, backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 11, minWidth: '120px', overflow: 'hidden' }}>
            {[
              { label: 'Edit',   color: '#1F2937', hover: '#F9FAFB', fn: () => { e => e.stopPropagation?.(); handleEditRequest(item); } },
              { label: 'Delete', color: '#EF4444', hover: '#FEF2F2', fn: () => handleDeleteRequest(item) },
            ].map(({ label, color, hover, fn }) => (
              <div key={label} onClick={(e) => { e.stopPropagation(); fn(); }} style={{ padding: '10px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                {label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  /* ── LIST VIEW ──────────────────────────────────────────── */
  if (!selectedItem && !showReportForm) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white">
        <Navbar />
        <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>

          <div style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 100, padding: '20px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '50px', fontWeight: 600, color: '#000000', margin: 0 }}>Lost & Found</h1>
              {isAdmin ? <ApproveRequestsBtn /> : (
                <button onClick={handleReportLost} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '200px', height: '52px', borderRadius: '16px', border: 'none', outline: 'none', cursor: 'pointer' }}>
                  Report Lost
                </button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '30px' }}>
                  <SearchOutlined style={{ color: '#9CA3AF', fontSize: '22px', marginRight: '12px' }} />
                  <input type="text" placeholder="Search by name, category, location, or contact" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 outline-none border-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#1F2937' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', maxWidth: '1400px', width: '100%' }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{ position: 'relative', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* Three dots — only for the entry owner (non-admin) */}
                  {!isAdmin && item.reportedBy === currentUser && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                      <ThreeDotsMenu
                        item={item}
                        isOpen={openMenuId === item.id}
                        onToggle={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                        onClose={() => setOpenMenuId(null)}
                      />
                    </div>
                  )}

                  <div style={{ width: '100%', paddingTop: '100%', position: 'relative', backgroundColor: '#E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOutlined style={{ fontSize: '64px', color: '#9CA3AF' }} />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <CategoryBadge category={item.category} />
                      {item.isUrgent && <UrgentBadge />}
                    </div>
                    <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', fontWeight: 600, color: '#000000', margin: 0 }}>{item.name}</h3>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><LocationOn style={{ fontSize: '16px' }} /> {item.location}</p>
                    {item.additionalInfo && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.additionalInfo}</p>}
                    <button onClick={(e) => { e.stopPropagation(); handleCopyContact(item.contactInfo); }} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', width: '100%', height: '40px', borderRadius: '8px', border: 'none', outline: 'none', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Phone style={{ fontSize: '16px' }} /> {item.contactInfo}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {showDeleteConfirm && <DeleteConfirmPopup />}
        {showApprovalPopup && <ApprovalPopup />}
      </div>
    );
  }

  /* ── DETAIL VIEW ────────────────────────────────────────── */
  if (selectedItem) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white">
        <Navbar />
        <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>
          <div style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 100, padding: '20px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '50px', fontWeight: 600, color: '#000000', margin: 0 }}>Lost & Found</h1>
              {isAdmin ? <ApproveRequestsBtn /> : (
                <button onClick={handleReportLost} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '200px', height: '52px', borderRadius: '16px', border: 'none', outline: 'none', cursor: 'pointer' }}>
                  Report Lost
                </button>
              )}
            </div>
          </div>

          {/* Three dots below header for entry owner */}
          {!isAdmin && selectedItem.reportedBy === currentUser && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 30px 0' }}>
              <ThreeDotsMenu
                item={selectedItem}
                isOpen={showDetailMenu}
                onToggle={() => setShowDetailMenu(!showDetailMenu)}
                onClose={() => setShowDetailMenu(false)}
              />
            </div>
          )}

          <div style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 130px)' }}>
            <div style={{ maxWidth: '1400px', width: '100%' }}>
              <div className="flex" style={{ gap: '40px' }}>
                <div>
                  <div style={{ width: '500px', height: '500px', backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOutlined style={{ fontSize: '120px', color: '#9CA3AF' }} />}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', width: '100%', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Reported by</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: '16px' }}>{selectedItem.reportedBy}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Member since</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#000000' }}>{selectedItem.memberSince}</p>
                  </div>
                  <button onClick={() => handleCopyContact(selectedItem.contactInfo)} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '100%', height: '52px', borderRadius: '12px', border: 'none', outline: 'none', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Phone style={{ fontSize: '18px' }} /> {selectedItem.contactInfo} <ContentCopyOutlined style={{ fontSize: '18px' }} />
                  </button>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <CategoryBadge category={selectedItem.category} />
                      {selectedItem.isUrgent && <UrgentBadge />}
                    </div>
                    <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', marginBottom: '8px' }}>{selectedItem.name}</h2>
                    <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 400, color: '#000000', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><LocationOn style={{ fontSize: '20px', color: '#6B7280' }} /> {selectedItem.location}</p>
                    <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 400, color: '#6B7280' }}>{selectedItem.additionalInfo}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showDeleteConfirm && <DeleteConfirmPopup />}
        {showApprovalPopup && <ApprovalPopup />}
      </div>
    );
  }

  /* ── REPORT FORM VIEW ───────────────────────────────────── */
  if (showReportForm) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white">
        <Navbar />
        <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>
          <div style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 100, padding: '20px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '50px', fontWeight: 600, color: '#000000', margin: 0 }}>Lost & Found</h1>
              <button onClick={handleBackToList} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '200px', height: '52px', borderRadius: '16px', border: 'none', outline: 'none', cursor: 'pointer' }}>
                Back to List
              </button>
            </div>
          </div>

          <div style={{ padding: '40px 80px', maxWidth: '800px' }}>
            <div className="flex flex-col" style={{ gap: '24px' }}>
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
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }} />
              </div>

              <div className="flex items-center" style={{ gap: '8px' }}>
                <input type="checkbox" id="urgent" checked={formData.isUrgent} onChange={(e) => handleFormChange('isUrgent', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="urgent" style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#000000', cursor: 'pointer' }}>Mark as urgent</label>
              </div>

              <button onClick={handleSubmit} disabled={!isFormValid} className={`font-medium transition-colors duration-200 ${isFormValid ? 'bg-[#b7c9dc] hover:bg-[#8f9dad] text-black' : 'bg-[#9CA3AF] text-black cursor-not-allowed'}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '100%', height: '52px', borderRadius: '16px', border: 'none', outline: 'none', cursor: isFormValid ? 'pointer' : 'not-allowed', marginTop: '16px' }}>
                Submit
              </button>
            </div>
          </div>
        </div>
        {showApprovalPopup && <ApprovalPopup />}
      </div>
    );
  }

  return null;
};

export default LostFound;
