import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import {
  ImageOutlined, ContentCopyOutlined, CloseOutlined,
  SearchOutlined, LocationOn, Phone, MoreVertOutlined,
} from '@mui/icons-material';
import api from '../../services/api';

const getImageSrc = (b64) => {
  if (!b64) return null;
  if (b64.startsWith('data:')) return b64;
  if (b64.startsWith('/9j/'))   return `data:image/jpeg;base64,${b64}`;
  if (b64.startsWith('iVBOR'))  return `data:image/png;base64,${b64}`;
  if (b64.startsWith('UklGR'))  return `data:image/webp;base64,${b64}`;
  return `data:image/jpeg;base64,${b64}`;
};

const CategoryBadge = ({ category }) => (
  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: category === 'Person' ? '#EF4444' : category === 'Pet' ? '#F59E0B' : '#3B82F6', padding: '4px 12px', borderRadius: '12px' }}>
    {category}
  </span>
);

const PostTypeBadge = ({ post_type }) => (
  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: post_type === 'lost' ? '#7C3AED' : '#059669', padding: '4px 12px', borderRadius: '12px', textTransform: 'capitalize' }}>
    {post_type}
  </span>
);

const LostFound = () => {
  const navigate      = useNavigate();
  const accountType   = useSelector((s) => s.auth.accountType);
  const currentUserId = useSelector((s) => s.auth.userId);
  const isAdmin       = accountType === 'admin';

  const [lostItems, setLostItems]                 = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [selectedItem, setSelectedItem]           = useState(null);
  const [showReportForm, setShowReportForm]       = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [pendingAction, setPendingAction]         = useState(null);
  const [searchQuery, setSearchQuery]             = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [submitting, setSubmitting]               = useState(false);

  const [openMenuId, setOpenMenuId]         = useState(null);
  const [showDetailMenu, setShowDetailMenu] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);

  const [formData, setFormData] = useState({
    category: '', name: '', location: '', contact: '', additional_info: '', post_type: 'lost',
  });
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await api.get('/lost-found');
      const mapped = res.data.data.map((p) => ({
        ...p,
        id:          String(p.id),
        user_id:     String(p.user_id),
        reportedBy:  p.username || '—',
        memberSince: p.user_created_at ? new Date(p.user_created_at).getFullYear().toString() : '—',
      }));
      const unique = Array.from(new Map(mapped.map((p) => [p.id, p])).values());
      setLostItems(unique);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleItemClick   = (item) => { setOpenMenuId(null); setSelectedItem(item); setShowReportForm(false); };
  const handleReportLost  = () => { setShowReportForm(true); setSelectedItem(null); };
  const handleBackToList  = () => { setSelectedItem(null); setShowReportForm(false); };
  const handleFormChange  = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleCopyContact = (contact) => navigator.clipboard.writeText(contact);

  const handleEditRequest = (item) => {
    setOpenMenuId(null); setShowDetailMenu(false);
    navigate('/lost-found/edit', { state: { item } });
  };
  const handleDeleteRequest = (item) => {
    setOpenMenuId(null); setShowDetailMenu(false);
    setDeleteTarget(item); setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/lost-found/request/${deleteTarget.id}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setPendingAction('delete');
      setShowApprovalPopup(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit delete request.');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const isFormValid = formData.post_type && formData.category && formData.name && formData.location && formData.contact && formData.contact.length === 11;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('category',        formData.category);
      data.append('name',            formData.name);
      data.append('location',        formData.location);
      data.append('contact',         formData.contact);
      data.append('additional_info', formData.additional_info);
      data.append('post_type',       formData.post_type);
      if (imageFile) data.append('image', imageFile);

      await api.post('/lost-found/request', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData({ category: '', name: '', location: '', contact: '', additional_info: '', post_type: '' });
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview('');
      setShowReportForm(false);
      setPendingAction(null);
      setShowApprovalPopup(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = lostItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) || item.contact.toLowerCase().includes(q) ||
      (item.additional_info && item.additional_info.toLowerCase().includes(q));
  });

  const ApproveRequestsBtn = () => (
    <button onClick={() => navigate('/admin/lostfound-approvals')} style={{ height: '48px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000', boxShadow: '0 0px 12px rgba(0,0,0,0.18)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}>
      Approve Requests
    </button>
  );

  const ApprovalPopup = () => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, paddingTop: '220px' }}>
      <div style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', paddingTop: '80px' }}>
        <img src="/approval.png" alt="Approval" style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }} />
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5, paddingTop: '20px' }}>
          {pendingAction === 'delete'
            ? <>Your deletion request has been successfully submitted for review.<br />You will be notified once your request is approved.</>
            : <>Your request has been successfully submitted for review.<br />You will be notified once your request is approved.</>}
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

  const ThreeDotsMenu = ({ item, isOpen, onToggle, onClose }) => (
    <div style={{ position: 'relative' }}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
        <MoreVertOutlined style={{ fontSize: '20px', color: '#374151' }} />
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={(e) => { e.stopPropagation(); onClose(); }} />
          <div style={{ position: 'absolute', top: '36px', right: 0, backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 11, minWidth: '120px', overflow: 'hidden' }}>
            {[
              { label: 'Edit',   color: '#1F2937', hover: '#F9FAFB', fn: () => handleEditRequest(item) },
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
            {loading ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF', marginTop: '60px' }}>Loading…</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px', maxWidth: '1400px', width: '100%' }}>
                {filteredItems.length === 0 ? (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF' }}>No posts found.</p>
                ) : filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{ position: 'relative', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {!isAdmin && item.user_id === currentUserId && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                        <ThreeDotsMenu item={item} isOpen={openMenuId === item.id} onToggle={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} onClose={() => setOpenMenuId(null)} />
                      </div>
                    )}
                    <div style={{ width: '100%', height: '260px', backgroundColor: '#E5E7EB', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.image
                        ? <img src={getImageSrc(item.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        : <ImageOutlined style={{ fontSize: '64px', color: '#9CA3AF' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <CategoryBadge category={item.category} />
                      </div>
                      <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', fontWeight: 600, color: '#000000', margin: 0 }}>{item.name}</h3>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><LocationOn style={{ fontSize: '16px' }} /> {item.location}</p>
                      {item.additional_info && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.additional_info}</p>}
                      <button onClick={(e) => { e.stopPropagation(); handleCopyContact(item.contact); }} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', width: '100%', height: '40px', borderRadius: '8px', border: 'none', outline: 'none', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Phone style={{ fontSize: '16px' }} /> {item.contact}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {!isAdmin && selectedItem.user_id === currentUserId && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 30px 0' }}>
              <ThreeDotsMenu item={selectedItem} isOpen={showDetailMenu} onToggle={() => setShowDetailMenu(!showDetailMenu)} onClose={() => setShowDetailMenu(false)} />
            </div>
          )}

          <div style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 130px)' }}>
            <div style={{ maxWidth: '1400px', width: '100%' }}>
              <div className="flex" style={{ gap: '40px' }}>
                <div>
                  <div style={{ width: '400px', height: '300px', backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {selectedItem.image
                      ? <img src={getImageSrc(selectedItem.image)} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ImageOutlined style={{ fontSize: '80px', color: '#9CA3AF' }} />}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', width: '100%', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Reported by</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: '16px' }}>{selectedItem.reportedBy}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Member since</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#000000' }}>{selectedItem.memberSince}</p>
                  </div>
                  <button onClick={() => handleCopyContact(selectedItem.contact)} className="bg-[#b7c9dc] hover:bg-[#8f9dad] text-black font-medium transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '100%', height: '52px', borderRadius: '12px', border: 'none', outline: 'none', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Phone style={{ fontSize: '18px' }} /> {selectedItem.contact} <ContentCopyOutlined style={{ fontSize: '18px' }} />
                  </button>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <CategoryBadge category={selectedItem.category} />
                      <PostTypeBadge post_type={selectedItem.post_type} />
                    </div>
                    <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 600, color: '#000000', marginBottom: '8px' }}>{selectedItem.name}</h2>
                    <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 400, color: '#000000', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><LocationOn style={{ fontSize: '20px', color: '#6B7280' }} /> {selectedItem.location}</p>
                    <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 400, color: '#6B7280' }}>{selectedItem.additional_info}</p>
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
                { label: 'Name *',                   field: 'name',            placeholder: 'Enter name' },
                { label: 'Location *',               field: 'location',        placeholder: 'Qasim Bagh, Multan' },
                { label: 'Contact *',                field: 'contact',         placeholder: '+92 333 3333333' },
                { label: 'Additional Info (if any)', field: 'additional_info', placeholder: 'Wearing blue shirt' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000', marginBottom: '8px', display: 'block' }}>{label}</label>
                  <input type={field === 'contact' ? 'tel' : 'text'} value={formData[field]} onChange={(e) => {
                    let value = e.target.value;
                    if (field === 'contact') {
                      value = value.replace(/[^0-9+]/g, '');
                    }
                    handleFormChange(field, value);
                  }} placeholder={placeholder} maxLength={field === 'contact' ? 14 : undefined} style={{ width: '100%', height: '48px', border: '1px solid #D1D5DB', borderRadius: '30px', padding: '0 20px', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none' }} />
                  {field === 'contact' && formData.contact && formData.contact.length !== 11 && (
                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', marginLeft: '8px', fontFamily: 'Inter, sans-serif' }}>Phone number must be exactly 11 digits</p>
                  )}
                </div>
              ))}

              {/* Image Upload */}
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000', marginBottom: '8px', display: 'block' }}>Image (optional)</label>
                {imagePreview && (
                  <div style={{ marginBottom: '12px', borderRadius: '12px', overflow: 'hidden', width: '100%', height: '200px', backgroundColor: '#E5E7EB' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '48px', border: '1px dashed #D1D5DB', borderRadius: '30px', padding: '0 20px', cursor: 'pointer', backgroundColor: '#FAFAFA' }}>
                  <ImageOutlined style={{ fontSize: '20px', color: '#9CA3AF' }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#9CA3AF' }}>
                    {imageFile ? 'Change image' : 'Upload image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
                {imageFile && (
                  <button type="button" onClick={() => { URL.revokeObjectURL(imagePreview); setImageFile(null); setImagePreview(''); }} style={{ marginTop: '6px', marginLeft: '8px', background: 'none', border: 'none', color: '#EF4444', fontFamily: 'Inter, sans-serif', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                    Remove image
                  </button>
                )}
              </div>

              <button onClick={handleSubmit} disabled={!isFormValid || submitting} className={`font-medium transition-colors duration-200 ${isFormValid && !submitting ? 'bg-[#b7c9dc] hover:bg-[#8f9dad] text-black' : 'bg-[#9CA3AF] text-black cursor-not-allowed'}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', width: '100%', height: '52px', borderRadius: '16px', border: 'none', outline: 'none', cursor: isFormValid && !submitting ? 'pointer' : 'not-allowed', marginTop: '16px' }}>
                {submitting ? 'Submitting…' : 'Submit'}
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
