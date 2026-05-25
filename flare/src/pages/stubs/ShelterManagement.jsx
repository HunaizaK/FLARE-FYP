import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

const FlyToHandler = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], 13);
  }, [target, map]);
  return null;
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
};
import { useDispatch, useSelector } from 'react-redux';
import { submitShelter, editShelter, requestDeleteShelter, syncFromStorage } from '../../features/shelters/sheltersSlice';
import L from 'leaflet';
import { CloseOutlined } from '@mui/icons-material';
import { FaEarthAmericas } from 'react-icons/fa6';
import Navbar from '../../components/Navbar';

const center = [34.063056, 74.834444];

const ShelterManagement = () => {
  const dispatch = useDispatch();
  const shelters = useSelector((state) => state.shelters.shelters);

  useEffect(() => { dispatch(syncFromStorage()); }, [dispatch]);
  const userEmail = useSelector((state) => state.auth.user);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pickedLatLng, setPickedLatLng] = useState(null);
  const [flyTarget, setFlyTarget]       = useState(null);
  const [mapType, setMapType]           = useState('map');
  const [formData, setFormData] = useState({
    location: '',
    shelterName: '',
    phone: '',
  });

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Fetch location suggestions when location field changes
    if (field === 'location') {
      fetchLocationSuggestions(value);
    }
  };

  const debounceRef = useRef(null);

  const fetchLocationSuggestions = (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'Accept': 'application/json' } }
        );
        const data = await res.json();
        if (data.length > 0) {
          setLocationSuggestions(data);
          setShowSuggestions(true);
        } else {
          setLocationSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);
  };

  const selectLocation = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setFormData((prev) => ({ ...prev, location: suggestion.display_name }));
    setPickedLatLng({ lat, lon });
    setFlyTarget({ lat, lon });
    setShowSuggestions(false);
  };

  const handleAdd = async () => {
    if (!formData.location || !formData.shelterName) return;
    try {
      let lat, lng;
      if (pickedLatLng) {
        lat = pickedLatLng.lat;
        lng = pickedLatLng.lon;
      } else {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.location)}&format=json&limit=1`,
          { headers: { 'Accept': 'application/json', 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (!data.length) { alert('Location not found. Please select from the dropdown suggestions.'); return; }
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      }
      setFlyTarget({ lat, lon: lng });
      dispatch(submitShelter({
        id:       Date.now().toString(),
        name:     formData.shelterName,
        location: formData.location,
        phone:    formData.phone,
        email:    userEmail || 'org@flare.com',
        lat,
        lng,
      }));
      setMarkerPosition([lat, lng]);
      setShowApprovalPopup(true);
    } catch {
      alert('Error finding location. Please try again.');
    }
  };

  const handleMapClick = async ({ lat, lng }) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en', 'Accept': 'application/json' } }
      );
      const data = await res.json();
      const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setFormData((prev) => ({ ...prev, location: address }));
      setPickedLatLng({ lat, lon: lng });
      setMarkerPosition([lat, lng]);
      setFlyTarget({ lat, lon: lng });
    } catch {
      setFormData((prev) => ({ ...prev, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
      setPickedLatLng({ lat, lon: lng });
      setMarkerPosition([lat, lng]);
    }
  };

  const handleClosePopup = () => {
    setShowApprovalPopup(false);
    setFormData({ location: '', shelterName: '', phone: '' });
    setPickedLatLng(null);
    setFlyTarget(null);
    setMarkerPosition(null);
  };

  const isFormValid = formData.location && formData.shelterName && formData.phone;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Navbar />

      <div className="absolute top-0 h-full transition-all duration-300" style={{ left: '0', width: '100%' }}>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
          <MapContainer
            center={center}
            zoom={8}
            style={{ width: '100%', height: '100%' }}
          >
            <FlyToHandler target={flyTarget} />
            <MapClickHandler onMapClick={handleMapClick} />
            <TileLayer
              url={mapType === 'satellite'
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Show all existing shelters from Redux */}
            {shelters.map((shelter) => (
              <Marker
                key={shelter.id}
                position={[shelter.lat, shelter.lng]}
                icon={L.divIcon({
                  className: 'custom-shelter-icon',
                  html: `<div style="background-color: #222ba8; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
                eventHandlers={{ click: () => { setSelectedShelter(shelter); setEditMode(false); } }}
              />
            ))}

            {/* Show marker when new shelter is being added */}
            {markerPosition && (
              <Marker
                position={markerPosition}
                icon={L.divIcon({
                  className: 'custom-shelter-icon',
                  html: `<div style="background-color: #222ba8; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
              />
            )}
          </MapContainer>
        </div>

        <div
          className="absolute bg-white"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            right: '24px',
            width: '510px',
            backgroundColor: '#FFFFFF',
            height: '560px',
            borderRadius: '16px',
            boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.15)',
            padding: '32px',
            zIndex: 10,
          }}
        >
          {/* Satellite / Map toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '165px',
                height: '50px',
                border: '1px solid #000000',
                borderRadius: '30px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setMapType(mapType === 'map' ? 'satellite' : 'map')}
            >
              <div
                style={{
                  position: 'absolute',
                  left: mapType === 'map' ? '4px' : 'calc(95% - 36px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  transition: 'left 0.3s ease',
                  zIndex: 2,
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#000000',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaEarthAmericas style={{ fontSize: '18px', color: '#FFFFFF', transform: 'scale(2)' }} />
              </div>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: mapType === 'map' ? 'flex-end' : 'flex-start',
                  paddingLeft: mapType === 'map' ? '0' : '15px',
                  paddingRight: mapType === 'map' ? '15px' : '0',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '20px',
                  fontWeight: 500,
                  color: '#000000',
                  transition: 'all 0.3s ease',
                }}
              >
                <span>{mapType === 'map' ? 'Map' : 'Satellite'}</span>
              </div>
            </div>
          </div>

          <h2
            style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#000000',
              marginTop: '0',
              marginBottom: '20px',
            }}
          >
            Add Shelter
          </h2>
          {/* Separator Line */}
          <div style={{ height: '1px', backgroundColor: '#6d707054', margin: '15px 0' }} />
          <div style={{ marginBottom: '24px', position: 'relative' }}>
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
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleFormChange('location', e.target.value)}
              onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Punjab"
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #D1D5DB',
                borderRadius: showSuggestions && locationSuggestions.length > 0 ? '20px 20px 0 0' : '20px',
                padding: '0 16px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-radius 0.2s ease',
              }}
            />

            {/* Location Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderTop: 'none',
                  borderRadius: '0 0 20px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 100,
                }}
              >
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.place_id || index}
                    onClick={() => selectLocation(suggestion)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: index < locationSuggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: '#1F2937',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {suggestion.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <div style={{ marginBottom: '24px' }}>
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
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              placeholder="+92-300-1234567"
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #D1D5DB',
                borderRadius: '20px',
                padding: '0 16px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          {/* Name Input */}
          <div style={{ marginBottom: '32px' }}>
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
              Name
            </label>
            <input
              type="text"
              value={formData.shelterName}
              onChange={(e) => handleFormChange('shelterName', e.target.value)}
              placeholder="Askardano Flood Relief"
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #D1D5DB',
                borderRadius: '20px',
                padding: '0 16px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!isFormValid}
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: isFormValid ? '#b7c9dc' : '#D1D5DB',
              border: `2px solid ${isFormValid ? '#b7c9dc' : '#D1D5DB'}`,
              color: isFormValid ? '#000000' : '#9CA3AF',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (isFormValid) {
                e.target.style.backgroundColor = '#8f9dad';
                e.target.style.color = '#000000';
                e.target.style.borderColor = '#8f9dad';
              }
            }}
            onMouseLeave={(e) => {
              if (isFormValid) {
                e.target.style.backgroundColor = '#b7c9dc';
                e.target.style.color = '#000000';
                e.target.style.borderColor = '#b7c9dc';
              }
            }}
          >
            Add
          </button>

        </div>
      </div>

      {/* Shelter Info Overlay */}
      {selectedShelter && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: editMode ? '380px' : '300px',
            transition: 'width 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 600, color: '#000000', margin: 0 }}>
              Shelter Info
            </h3>
            <button
              onClick={() => { setSelectedShelter(null); setEditMode(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <CloseOutlined style={{ color: '#6B7280', fontSize: '20px' }} />
            </button>
          </div>

          {!editMode ? (
            <>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '2px' }}>Name</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000' }}>{selectedShelter.name}</span>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '2px' }}>Phone</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#000000' }}>{selectedShelter.phone || 'N/A'}</span>
              </div>
              {selectedShelter.email === userEmail && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setEditMode(true); setEditForm({ name: selectedShelter.name, phone: selectedShelter.phone || '' }); }}
                    style={{
                      flex: 1, height: '36px', backgroundColor: '#b7c9dc', border: 'none',
                      borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                      color: '#000000', cursor: 'pointer', transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#8f9dad'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#b7c9dc'}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      dispatch(requestDeleteShelter(selectedShelter));
                      setSelectedShelter(null);
                      setShowDeleteToast(true);
                      setTimeout(() => setShowDeleteToast(false), 3000);
                    }}
                    style={{
                      flex: 1, height: '36px', backgroundColor: '#FFFFFF', border: '2px solid #F87171',
                      borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                      color: '#EF4444', cursor: 'pointer', transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    Request Delete
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#000000', marginBottom: '4px', display: 'block' }}>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%', height: '38px', border: '1px solid #D1D5DB', borderRadius: '12px',
                    padding: '0 12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#000000', marginBottom: '4px', display: 'block' }}>Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%', height: '38px', border: '1px solid #D1D5DB', borderRadius: '12px',
                    padding: '0 12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (editForm.name.trim()) {
                      dispatch(editShelter({ id: selectedShelter.id, name: editForm.name.trim(), phone: editForm.phone.trim() }));
                      setEditMode(false);
                      setSelectedShelter(null);
                    }
                  }}
                  style={{
                    flex: 1, height: '36px', backgroundColor: '#b7c9dc', border: 'none',
                    borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                    color: '#000000', cursor: 'pointer', transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#8f9dad'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#b7c9dc'}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  style={{
                    flex: 1, height: '36px', backgroundColor: '#FFFFFF', border: '2px solid #D1D5DB',
                    borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                    color: '#6B7280', cursor: 'pointer', transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete Request Toast */}
      {showDeleteToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1F618A',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          Delete request submitted for admin review
        </div>
      )}

      {showApprovalPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            paddingTop: '220px',
          }}
          onClick={handleClosePopup}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              width: '90%',
              maxWidth: '450px',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              paddingTop: '80px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Approval Image - sticking out */}
            <img
              src="/approval.png"
              alt="Approval"
              style={{
                position: 'absolute',
                top: '-450px',
                left: '0',
                width: '100%',
                height: 'auto',
              }}
            />

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#000000',
                marginBottom: '24px',
                textAlign: 'center',
                lineHeight: 1.5,
                paddingTop: '20px',
              }}
            >
              Your shelter information has been successfully submitted for verification.
              <br />
              You will be notified once your request is approved.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={handleClosePopup}
                style={{
                  padding: '12px 32px',
                  width: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#b7c9dc',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#8f9dad'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#b7c9dc'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShelterManagement;