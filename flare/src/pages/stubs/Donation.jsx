import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  ContentCopyOutlined, CloseOutlined, AddOutlined,
  AccountBalanceOutlined, MoreVertOutlined,
} from '@mui/icons-material';
import api from '../../services/api';

const Donation = () => {
  const accountType    = useSelector((s) => s.auth.accountType);
  const currentUserId  = useSelector((s) => s.auth.userId);
  const isOrganization = accountType === 'organization';
  const isAdmin        = accountType === 'admin';
  const navigate       = useNavigate();

  const [donationCards, setDonationCards] = useState([]);
  const emptyForm = { account_title: '', account_no: '', bank_name: '', iban: '' };

  const [showAddForm, setShowAddForm]             = useState(false);
  const [formData, setFormData]                   = useState(emptyForm);
  const [showEditPopup, setShowEditPopup]         = useState(false);
  const [editTarget, setEditTarget]               = useState(null);
  const [editForm, setEditForm]                   = useState(emptyForm);
  const [showDeletePopup, setShowDeletePopup]     = useState(false);
  const [selectedCardId, setSelectedCardId]       = useState(null);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [pendingAction, setPendingAction]         = useState(null);
  const [openMenuId, setOpenMenuId]               = useState(null);
  const [submitting, setSubmitting]               = useState(false);

  useEffect(() => {
    api.get('/donation-accounts')
      .then((res) => setDonationCards(
        res.data.data.map((d) => ({ ...d, id: String(d.id), added_by: String(d.added_by) }))
      ))
      .catch((err) => console.error('Failed to load donation accounts:', err));
  }, []);

  const handleCopyIban = (iban) => navigator.clipboard.writeText(iban);

  // ── Add ──
  const isAddValid = formData.account_title && formData.account_no && formData.bank_name && formData.iban;
  const handleAddSubmit = async () => {
    if (!isAddValid || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/donation-accounts/request', formData);
      setShowAddForm(false); setPendingAction('add'); setShowApprovalPopup(true);
      setFormData(emptyForm);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit donation account request.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const handleConfirmDelete = async () => {
    setShowDeletePopup(false);
    setSubmitting(true);
    try {
      await api.delete(`/donation-accounts/request/${selectedCardId}`);
      setPendingAction('delete'); setShowApprovalPopup(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit delete request.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──
  const isEditValid = editForm.account_title && editForm.account_no && editForm.bank_name && editForm.iban;
  const handleEditSubmit = async () => {
    if (!isEditValid || !editTarget || submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/donation-accounts/request/${editTarget.id}`, editForm);
      setShowEditPopup(false); setEditTarget(null); setEditForm(emptyForm);
      setPendingAction('edit'); setShowApprovalPopup(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit edit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseApproval = () => { setShowApprovalPopup(false); setSelectedCardId(null); setPendingAction(null); };

  const approvalMessage = {
    delete: <>Your deletion request has been successfully submitted for review.<br />You will be notified once your request is approved.</>,
    edit:   <>Your edit request has been successfully submitted for review.<br />You will be notified once your request is approved.</>,
    add:    <>Your donation information has been successfully submitted for verification.<br />You will be notified once your request is approved.</>,
  }[pendingAction] ?? null;

  const ADD_FIELDS = [
    { label: 'Account Title', field: 'account_title', placeholder: 'Al Khidmat Foundation' },
    { label: 'Account No.',   field: 'account_no',    placeholder: '1234567890' },
    { label: 'Bank Name',     field: 'bank_name',     placeholder: 'Bank ABC' },
    { label: 'IBAN Number',   field: 'iban',          placeholder: 'PK92NKKB25992281264B2496' },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      <div className="absolute top-0 h-full transition-all duration-300 overflow-y-auto" style={{ left: '146px', width: 'calc(100% - 146px)' }}>
        <div style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 100, padding: '20px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '50px', fontWeight: 600, color: '#000000', margin: 0 }}>Donations</h1>
            {isOrganization && (
              <button onClick={() => setShowAddForm(true)} className="transition-all duration-200 flex items-center justify-center" style={{ width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', boxShadow: '0 0px 12px rgba(0,0,0,0.28)' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#8f9dad'} onMouseLeave={(e) => e.target.style.backgroundColor = '#b7c9dc'}>
                <AddOutlined style={{ fontSize: '32px', color: '#000000' }} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => navigate('/admin/donation-approvals')} style={{ height: '48px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#b7c9dc', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#000000', boxShadow: '0 0px 12px rgba(0,0,0,0.18)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f9dad'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b7c9dc'}>
                Approve Requests
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', maxWidth: '1400px', width: '100%' }}>
            {donationCards.map((card) => (
              <div key={card.id} className="relative" style={{ width: '100%', height: '263px', backgroundColor: '#DBEAFE', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                {isOrganization && card.added_by === currentUserId && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
                    <button onClick={() => setOpenMenuId(openMenuId === card.id ? null : card.id)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', border: 'none', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MoreVertOutlined style={{ fontSize: '18px', color: '#374151' }} />
                    </button>
                    {openMenuId === card.id && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpenMenuId(null)} />
                        <div style={{ position: 'absolute', top: '36px', right: 0, backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 11, minWidth: '120px', overflow: 'hidden' }}>
                          {[
                            { label: 'Edit',   color: '#1F2937', hover: '#F9FAFB', fn: () => { setEditTarget(card); setEditForm({ account_title: card.account_title, account_no: card.account_no, bank_name: card.bank_name, iban: card.iban }); setShowEditPopup(true); setOpenMenuId(null); } },
                            { label: 'Delete', color: '#EF4444', hover: '#FEF2F2', fn: () => { setSelectedCardId(card.id); setShowDeletePopup(true); setOpenMenuId(null); } },
                          ].map(({ label, color, hover, fn }) => (
                            <div key={label} onClick={fn} style={{ padding: '10px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              {label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ opacity: 0.3, marginBottom: '16px' }}>
                  <AccountBalanceOutlined style={{ fontSize: '80px', color: '#3B82F6' }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, color: '#000000', marginBottom: '2px' }}>{card.account_title}</h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 400, color: '#6B7280', marginBottom: '2px' }}>{card.bank_name}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 400, color: '#6B7280', marginBottom: '12px' }}>A/C: {card.account_no}</p>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000' }}>{card.iban}</span>
                    <button onClick={() => handleCopyIban(card.iban)} style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                      <ContentCopyOutlined style={{ fontSize: '18px', color: '#000000' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeletePopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5 }}>Are you sure you want to request deletion of this donation entry?</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {[{ label: 'Yes', fn: handleConfirmDelete }, { label: 'No', fn: () => setShowDeletePopup(false) }].map(({ label, fn }) => (
                <button key={label} onClick={fn} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval Popup */}
      {showApprovalPopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, paddingTop: '220px' }}>
          <div style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', paddingTop: '80px' }}>
            <img src="/approval.png" alt="Approval" style={{ position: 'absolute', top: '-450px', left: '0', width: '100%', height: 'auto' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#000000', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5, paddingTop: '20px' }}>{approvalMessage}</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleCloseApproval} style={{ padding: '12px 32px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b7c9dc', color: '#000000', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f9dad'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#b7c9dc'; }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && isOrganization && (
        <div style={{ position: 'fixed', top: '43%', transform: 'translateY(-50%)', right: '24px', width: '510px', backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 0px 20px rgba(0,0,0,0.15)', padding: '32px', zIndex: 9999 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '24px', fontWeight: 600, color: '#000000', margin: 0 }}>Add Donation Information</h2>
            <button onClick={() => { setShowAddForm(false); setFormData(emptyForm); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><CloseOutlined style={{ fontSize: '24px', color: '#6B7280' }} /></button>
          </div>
          <div style={{ height: '1px', backgroundColor: '#6d707054', margin: '15px 0' }} />
          {ADD_FIELDS.map(({ label, field, placeholder }) => (
            <div key={field} style={{ marginBottom: '24px' }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000', marginBottom: '8px', display: 'block' }}>{label}</label>
              <input type="text" value={formData[field]} onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: '20px', padding: '0 16px', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none' }} />
            </div>
          ))}
          <button onClick={handleAddSubmit} disabled={!isAddValid || submitting} style={{ width: '100%', height: '52px', backgroundColor: isAddValid && !submitting ? '#b7c9dc' : '#D1D5DB', border: `2px solid ${isAddValid && !submitting ? '#b7c9dc' : '#D1D5DB'}`, color: isAddValid && !submitting ? '#000000' : '#9CA3AF', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, cursor: isAddValid && !submitting ? 'pointer' : 'not-allowed' }} onMouseEnter={(e) => { if (isAddValid && !submitting) { e.target.style.backgroundColor = '#8f9dad'; e.target.style.borderColor = '#8f9dad'; } }} onMouseLeave={(e) => { if (isAddValid && !submitting) { e.target.style.backgroundColor = '#b7c9dc'; e.target.style.borderColor = '#b7c9dc'; } }}>
            {submitting ? 'Submitting…' : 'Add'}
          </button>
        </div>
      )}

      {/* Edit Popup */}
      {showEditPopup && editTarget && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9998 }} onClick={() => { setShowEditPopup(false); setEditTarget(null); setEditForm(emptyForm); }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '510px', backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 0px 20px rgba(0,0,0,0.2)', padding: '32px', zIndex: 9999 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '24px', fontWeight: 600, color: '#000000', margin: 0 }}>Edit Donation Information</h2>
              <button onClick={() => { setShowEditPopup(false); setEditTarget(null); setEditForm(emptyForm); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><CloseOutlined style={{ fontSize: '24px', color: '#6B7280' }} /></button>
            </div>
            <div style={{ height: '1px', backgroundColor: '#6d707054', margin: '15px 0' }} />
            {ADD_FIELDS.map(({ label, field, placeholder }) => (
              <div key={field} style={{ marginBottom: '24px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000', marginBottom: '8px', display: 'block' }}>{label}</label>
                <input type="text" value={editForm[field]} onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: '20px', padding: '0 16px', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none' }} />
              </div>
            ))}
            <button onClick={handleEditSubmit} disabled={!isEditValid || submitting} style={{ width: '100%', height: '52px', backgroundColor: isEditValid && !submitting ? '#b7c9dc' : '#D1D5DB', border: `2px solid ${isEditValid && !submitting ? '#b7c9dc' : '#D1D5DB'}`, color: isEditValid && !submitting ? '#000000' : '#9CA3AF', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, cursor: isEditValid && !submitting ? 'pointer' : 'not-allowed' }} onMouseEnter={(e) => { if (isEditValid && !submitting) { e.target.style.backgroundColor = '#8f9dad'; e.target.style.borderColor = '#8f9dad'; } }} onMouseLeave={(e) => { if (isEditValid && !submitting) { e.target.style.backgroundColor = '#b7c9dc'; e.target.style.borderColor = '#b7c9dc'; } }}>
              {submitting ? 'Submitting…' : 'Edit'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Donation;
