import { useState, useEffect, useRef } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { initFloodOverlay } from '../flood-overlay';

const FlyToHandler = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], 13);
  }, [target, map]);
  return null;
};

function FloodOverlayLayer({ enabled, apiBase = "http://localhost:8002" }) {
  const map = useMap();
  const ctrlRef = useRef(null);

  useEffect(() => {
    ctrlRef.current = initFloodOverlay(map, { apiBase });
  }, []);

  useEffect(() => {
    if (!ctrlRef.current) return;
    ctrlRef.current.ready.then(() => {
      if (enabled) {
        ctrlRef.current.show();
      } else {
        ctrlRef.current.hide();
      }
    });
  }, [enabled]);

  return null;
}
import { useSelector } from 'react-redux';
import L from 'leaflet';
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import {
  SearchOutlined,
  CloseOutlined,
} from '@mui/icons-material';
import { TbWavesElectricity } from 'react-icons/tb';
import { IoWaterOutline, IoHomeOutline } from 'react-icons/io5';
import { FaEarthAmericas } from 'react-icons/fa6';
import Navbar from '../components/Navbar';
import api from '../services/api';


// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const center = {
  lat: 32.65,
  lng: 74.46,
};


const Maps = () => {
  const [flyTarget, setFlyTarget] = useState(null);
  const [shelters, setShelters] = useState([]);
  const accountType   = useSelector((state) => state.auth.accountType);
  const currentUser   = useSelector((state) => state.auth.user);
  const currentUserId = useSelector((state) => state.auth.userId);

  useEffect(() => {
    api.get('/shelters')
      .then((res) => {
        const mapped = res.data.data.map((s) => ({
          ...s,
          lat:   parseFloat(s.latitude),
          lng:   parseFloat(s.longitude),
          name:  s.shelter_name,
          phone: s.phone_number || null,
        }));
        setShelters(mapped);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('http://localhost:8001/api/gauges')
      .then(res => res.json())
      .then(data => {
        const mapped = data.gauges.map(g => ({
          id: g.id,
          name: `${g.name} - ${g.river} River`,
          position: { lat: g.lat, lng: g.lon },
          level: g.status,
          t1_forecast: g.t1_forecast,
        }));
        setRiverGauges(mapped);
      })
      .catch(() => {});
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [mapType, setMapType] = useState('map');
  const [selectedGauge, setSelectedGauge] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [riverGauges, setRiverGauges] = useState([]);
  const [selectedGaugeForecast, setSelectedGaugeForecast] = useState(null);

  // Layer toggles
  const [layers, setLayers] = useState({
    riverGauges: true,
    inundationProbability: false,
    shelters: true,
  });


  const debounceRef = useRef(null);

  const fetchSearchSuggestions = (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
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
          setSearchSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } catch { }
    }, 400);
  };

  const handleSearch = async (selectedResult = null) => {
    try {
      if (selectedResult) {
        setFlyTarget({ lat: parseFloat(selectedResult.lat), lon: parseFloat(selectedResult.lon) });
        setSearchQuery(selectedResult.display_name);
        setShowSuggestions(false);
      } else if (searchQuery) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data.length > 0) {
          setFlyTarget({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
          setShowSuggestions(false);
        }
      }
    } catch { }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleLayer = (layerName) => {
    setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };


  const getMarkerColor = (level) => {
    const colors = {
      extreme: '#952426',
      danger: '#FF1519',
      warning: '#FB9B2D',
      normal: '#43A468',
      noData: '#9CA3AF',
    };
    return colors[level] || colors.noData;
  };

  const handleMarkerClick = (gauge) => {
    setSelectedGauge(gauge);
    setSelectedGaugeForecast(null);
    fetch(`http://localhost:8001/api/gauges/${gauge.id}`)
      .then(res => res.json())
      .then(data => setSelectedGaugeForecast(data))
      .catch(() => {});
  };

  const fmtDate  = (v) => { const d = new Date(v); return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`; };
  const nowDate  = selectedGaugeForecast?.forecast?.[0]
    ? fmtDate(selectedGaugeForecast.forecast[0].date)
    : null;
  const _hist     = selectedGaugeForecast?.historical ?? [];
  const _forecast = selectedGaugeForecast?.forecast   ?? [];
  const _f0       = _forecast[0];
  const chartData = _f0 ? [
    ..._hist.map(d => ({
      date: fmtDate(d.date),
      historical: d.discharge,
    })),
    {
      date:       fmtDate(_f0.date),
      historical: _f0.predicted,
      forecast:   _f0.predicted,
      upper_80:   _f0.upper_80,
    },
    ..._forecast.slice(1).map(d => ({
      date:     fmtDate(d.date),
      forecast: d.predicted,
      upper_80: d.upper_80,
    })),
  ] : [];
  const warning  = selectedGaugeForecast?.thresholds?.warning ?? null;
  const danger   = selectedGaugeForecast?.thresholds?.danger  ?? null;
  const severe   = selectedGaugeForecast?.thresholds?.severe  ?? null;
  const extreme  = severe != null ? +(severe * 1.3).toFixed(1) : null;
  const maxDischarge = chartData.length
    ? Math.max(...chartData.map(d => d.historical ?? d.forecast ?? 0))
    : 0;
  const yMax = extreme != null
    ? Math.ceil(extreme * 1.2 / 1000) * 1000
    : Math.ceil(maxDischarge * 1.2 / 100) * 100;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Navbar />

      {/* Main content - full screen */}
      <div className="absolute top-0 h-full transition-all duration-300" style={{ left: '0', width: '100%' }}>
        {/* Search Bar */}
<div
  className="absolute z-10"
  style={{
    top: '26px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
  }}
>
  <div
    className="flex items-center shadow-lg"
    style={{
      height: '45px',
      paddingLeft: '16px',
      paddingRight: '16px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #5f6063ab',
      borderRadius: showSuggestions && searchSuggestions.length > 0 ? '20px 20px 0 0' : '30px',
      transition: 'border-radius 0.2s ease',
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
      placeholder="Search for location"
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        if (!e.target.value || e.target.value.trim() === '') {
          setShowSuggestions(false);
          setSearchSuggestions([]);
        } else {
          fetchSearchSuggestions(e.target.value);
        }
      }}
      onKeyPress={handleKeyPress}
      onFocus={() => searchSuggestions.length > 0 && searchQuery && setShowSuggestions(true)}
      className="flex-1 outline-none border-none"
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: '#1F2937',
      }}
    />
  </div>

  {/* Search Suggestions Dropdown */}
  {showSuggestions && searchSuggestions.length > 0 && (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderTop: 'none',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        maxHeight: '300px',
        overflowY: 'auto',
      }}
    >
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={suggestion.place_id || index}
          onClick={() => handleSearch(suggestion)}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: index < searchSuggestions.length - 1 ? '1px solid #e6e7e9ff' : 'none',
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


        {/* Layer Toggle Button - only show when View Options is closed */}
        {!showViewOptions && (
          <button
            onClick={() => setShowViewOptions(!showViewOptions)}
            className="absolute z-10 bg-white rounded-full transition-all duration-200 hover:bg-gray-50"
            style={{
              top: '30px',
              right: '30px',
              width: '54px',
              height: '54px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.31)',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <LayersOutlined
              style={{
                color: '#000000ff',
                fontSize: '28px',
              }}
            />
          </button>
        )}

        {/* View Options Panel */}
        {showViewOptions && (
          <div
            className="absolute z-20 bg-white"
            style={{
              top: '30px',
              backgroundColor: '#FFFFFF',
              right: '30px',
              width: '400px',
              padding: '0',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <div className="flex items-center gap-2">
                <LayersOutlined style={{ color: '#000000', fontSize: '24px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 600, color: '#000000', paddingLeft: "10px"  }}>
                  View options
                </span>
              </div>
              <button
                onClick={() => setShowViewOptions(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <CloseOutlined style={{ color: '#000000', fontSize: '24px' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '13px 24px' }}>
              {/* Map Type Toggle */}
              <div className="mb-6 flex justify-center">
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
                  {/* Sliding Earth Icon with black circle background */}
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
                    <FaEarthAmericas
                      style={{
                        fontSize: '18px',
                        color: '#FFFFFF',
                        transform: 'scale(2)',
                      }}
                    />
                  </div>

                  {/* Text - shows opposite side */}
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

              {/* Separator Line */}
              <div style={{ height: '1px', backgroundColor: '#6d707054', margin: '15px 0' }} />

              {/* Layer Toggles */}
              <div className="flex flex-col">
                {/* River Gauges */}
                <div style={{ paddingBottom: '2px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TbWavesElectricity style={{ fontSize: '24px', color: '#000000' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, color: '#000000' , paddingLeft: "10px" }}>
                        River Guages
                      </span>
                    </div>
                    <label className="relative inline-block" style={{ width: '48px', height: '24px' }}>
                      <input
                        type="checkbox"
                        checked={layers.riverGauges}
                        onChange={() => toggleLayer('riverGauges')}
                        className="opacity-0 w-0 h-0"
                      />
                      <span
                        style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: layers.riverGauges ? '#3a88d6ff' : '#D1D5DB',
                          borderRadius: '24px',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: '20px',
                            width: '20px',
                            left: layers.riverGauges ? '26px' : '2px',
                            bottom: '2px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'left 0.2s',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                  {layers.riverGauges && (
                    <div style={{ marginTop: '12px', marginLeft: '36px' }}>
                      <div className="flex flex-col" style={{ gap: '8px' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#952426' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#000000ff', paddingLeft: "10px"  }}>Extreme Level</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF1519' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px',color: '#000000ff', paddingLeft: "10px" }}>Danger Level</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FB9B2D' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#000000ff', paddingLeft: "10px" }}>Warning Level</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px',color: '#000000ff', paddingLeft: "10px" }}>No Data</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#43A468' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px',color: '#000000ff', paddingLeft: "10px"}}>Normal Level</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Separator Line */}
                <div style={{ height: '1px', backgroundColor: '#6d707054', margin: '10px 0' }} />

                {/* Inundation Probability */}
                <div style={{ paddingBottom: '2px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IoWaterOutline style={{ fontSize: '24px', color: '#000000' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, color: '#000000', paddingLeft: "10px"  }}>
                        Inundation Probability
                      </span>
                    </div>
                    <label className="relative inline-block" style={{ width: '48px', height: '24px' }}>
                      <input
                        type="checkbox"
                        checked={layers.inundationProbability}
                        onChange={() => toggleLayer('inundationProbability')}
                        className="opacity-0 w-0 h-0"
                      />
                      <span
                        style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: layers.inundationProbability ? '#3a88d6ff' : '#D1D5DB',
                          borderRadius: '24px',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: '20px',
                            width: '20px',
                            left: layers.inundationProbability ? '26px' : '2px',
                            bottom: '2px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'left 0.2s',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                  {layers.inundationProbability && (
                    <div style={{ marginTop: '12px', marginLeft: '36px' }}>
                      <div className="flex flex-col" style={{ gap: '8px' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1D4ED8' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px',color: '#000000ff', paddingLeft: "10px" }}>Very High</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#60A5FA' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#000000ff', paddingLeft: "10px" }}>High</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#BFDBFE' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#000000ff', paddingLeft: "10px" }}>Moderate</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Separator Line */}

                {/* Separator Line */}
                <div style={{ height: '1px', backgroundColor: '#6d707054', margin: '10px 0' }} />

                {/* Shelter */}
                <div style={{ paddingBottom: '2px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IoHomeOutline style={{ fontSize: '24px', color: '#000000' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 500, color: '#000000', paddingLeft: "10px" }}>
                        Shelter
                      </span>
                    </div>
                    <label className="relative inline-block" style={{ width: '48px', height: '24px' }}>
                      <input
                        type="checkbox"
                        checked={layers.shelters}
                        onChange={() => toggleLayer('shelters')}
                        className="opacity-0 w-0 h-0"
                      />
                      <span
                        style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: layers.shelters ? '#3a88d6ff' : '#D1D5DB',
                          borderRadius: '24px',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: '20px',
                            width: '20px',
                            left: layers.shelters ? '26px' : '2px',
                            bottom: '2px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'left 0.2s',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaflet Map */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={8}
            style={{ width: '100%', height: '100%' }}
          >
            <FlyToHandler target={flyTarget} />
            <FloodOverlayLayer enabled={layers.inundationProbability} apiBase="http://localhost:8002" />
            <TileLayer
              url={mapType === 'satellite'
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* River Gauge Markers */}
            {layers.riverGauges && riverGauges.map((gauge) => (
              <Marker
                key={gauge.id}
                position={[gauge.position.lat, gauge.position.lng]}
                icon={L.divIcon({
                  className: 'custom-gauge-icon',
                  html: `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="${getMarkerColor(gauge.level)}"/><path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="white"/></svg>`,
                  iconSize: [32, 40],
                  iconAnchor: [16, 40],
                  popupAnchor: [0, -40],
                })}
                eventHandlers={{
                  click: () => handleMarkerClick(gauge),
                }}
              >
                <Popup>{gauge.name}</Popup>
              </Marker>
            ))}

            {/* Shelter Markers */}
            {layers.shelters && shelters.map((shelter) => (
              <Marker
                key={shelter.id}
                position={[shelter.lat, shelter.lng]}
                icon={L.divIcon({
                  className: 'custom-shelter-icon',
                  html: `<div style="background-color: #222ba8; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                  popupAnchor: [0, -36],
                })}
                eventHandlers={{ click: () => { setSelectedShelter(shelter); setEditMode(false); } }}
              >
                <Popup minWidth={260} maxWidth={320}>
                  <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px 2px' }}>
                    <div style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 600, color: '#000000', marginBottom: '12px' }}>Shelter Info</div>

                    {!(selectedShelter?.id === shelter.id && editMode) ? (
                      <>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '2px' }}>Name</span>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#000000' }}>{shelter.name}</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '2px' }}>Capacity</span>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#000000' }}>{shelter.capacity ?? 'N/A'}</span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '2px' }}>Phone</span>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#000000' }}>{shelter.phone || 'N/A'}</span>
                        </div>
                        {accountType === 'organization' && String(shelter.added_by) === String(currentUserId) && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { setSelectedShelter(shelter); setEditMode(true); setEditForm({ name: shelter.name, phone: shelter.phone || '' }); }}
                              style={{ flex: 1, height: '32px', backgroundColor: '#b7c9dc', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#000000', cursor: 'pointer' }}>
                              Edit
                            </button>
                            <button onClick={async () => {
                              try {
                                await api.delete(`/shelters/request/${shelter.id}`);
                                setSelectedShelter(null);
                                setShowDeleteToast(true);
                                setTimeout(() => setShowDeleteToast(false), 3000);
                              } catch (err) { alert(err.response?.data?.detail || 'Failed to submit delete request.'); }
                            }}
                              style={{ flex: 1, height: '32px', backgroundColor: '#FFFFFF', border: '2px solid #F87171', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#EF4444', cursor: 'pointer' }}>
                              Request Delete
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 500, color: '#000000', marginBottom: '4px', display: 'block' }}>Name</label>
                          <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', height: '34px', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 500, color: '#000000', marginBottom: '4px', display: 'block' }}>Phone</label>
                          <input type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9+]/g, '') }))} maxLength={14}
                            style={{ width: '100%', height: '34px', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={async () => {
                            if (editForm.name.trim()) {
                              try {
                                await api.put(`/shelters/request/${shelter.id}`, { shelter_name: editForm.name.trim(), location: shelter.location, capacity: shelter.capacity, latitude: shelter.lat, longitude: shelter.lng });
                                setEditMode(false); setSelectedShelter(null);
                                setShowDeleteToast('edit'); setTimeout(() => setShowDeleteToast(false), 3000);
                              } catch (err) { alert(err.response?.data?.detail || 'Failed to submit edit request.'); }
                            }
                          }} style={{ flex: 1, height: '32px', backgroundColor: '#b7c9dc', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#000000', cursor: 'pointer' }}>Save</button>
                          <button onClick={() => setEditMode(false)}
                            style={{ flex: 1, height: '32px', backgroundColor: '#FFFFFF', border: '2px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#6B7280', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Shelter Info Overlay — replaced by Leaflet Popup on each marker */}
        {false && (
          <div>
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
                {accountType === 'organization' && String(selectedShelter.added_by) === String(currentUserId) && (
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
                      onClick={async () => {
                        try {
                          await api.delete(`/shelters/request/${selectedShelter.id}`);
                          setSelectedShelter(null);
                          setShowDeleteToast(true);
                          setTimeout(() => setShowDeleteToast(false), 3000);
                        } catch (err) {
                          alert(err.response?.data?.detail || 'Failed to submit delete request.');
                        }
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
                    maxLength={11}
                    style={{
                      width: '100%', height: '38px', border: '1px solid #D1D5DB', borderRadius: '12px',
                      padding: '0 12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      if (editForm.name.trim()) {
                        try {
                          await api.put(`/shelters/request/${selectedShelter.id}`, {
                            shelter_name: editForm.name.trim(),
                            location:     selectedShelter.location,
                            capacity:     selectedShelter.capacity,
                            latitude:     selectedShelter.lat,
                            longitude:    selectedShelter.lng,
                          });
                          setEditMode(false);
                          setSelectedShelter(null);
                          setShowDeleteToast('edit');
                          setTimeout(() => setShowDeleteToast(false), 3000);
                        } catch (err) {
                          alert(err.response?.data?.detail || 'Failed to submit edit request.');
                        }
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

        {/* Bottom Panel for Gauge Details */}
        {selectedGauge && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70%',
              right: 0,
              height: '290px',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              padding: '20px 40px',
              zIndex: 1000,
              borderTop: '1px solid #E5E7EB',
            }}
          >
            <button
              onClick={() => { setSelectedGauge(null); setSelectedGaugeForecast(null); }}
              style={{ 
                position: 'absolute',
                top: '20px',
                right: '40px',
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <CloseOutlined style={{ color: '#6B7280', fontSize: '24px' }} />
            </button>

            <div className="flex h-full" style={{ gap: '40px', maxWidth: '1400px', margin: '0 auto' }}>
              {/* Left side - Chart */}
              <div
                style={{
                  flex: '0 0 420px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px 16px 8px',
                  backgroundColor: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={195}>
                      <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fontFamily: 'Inter, sans-serif', fill: '#6B7280' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fontFamily: 'Inter, sans-serif', fill: '#6B7280' }}
                          tickLine={false}
                          width={50}
                          domain={[0, yMax || 'auto']}
                          label={{
                            value: 'Discharge in m³/s',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 10,
                            style: { fontSize: 9, fontFamily: 'Inter, sans-serif', fill: '#6B7280', textAnchor: 'middle' },
                          }}
                        />
                        <Tooltip
                          formatter={(v, name) => {
                            if (['upper_80', 'forecast'].includes(name)) return null;
                            if (name === 'historical') return [v != null ? v.toFixed(1) : '—', 'Discharge'];
                            return null;
                          }}
                          contentStyle={{ fontSize: 11, fontFamily: 'Inter, sans-serif', borderRadius: 6 }}
                        />

                        {/* Shaded area under forecast line */}
                        <Area type="monotone" dataKey="forecast" stroke="none" fill="#BFDBFE" fillOpacity={0.4} legendType="none" dot={false} activeDot={false} connectNulls={false} />

                        {/* Threshold horizontal lines — drawn before Lines so they sit beneath the data */}
                        {warning != null && (
                          <ReferenceLine y={Number(warning)} stroke="#F97316" strokeWidth={2} strokeDasharray="0" ifOverflow="visible" />
                        )}
                        {danger != null && (
                          <ReferenceLine y={Number(danger)} stroke="#EF4444" strokeWidth={2} strokeDasharray="0" ifOverflow="visible" />
                        )}
                        {extreme != null && (
                          <ReferenceLine y={Number(extreme)} stroke="#991B1B" strokeWidth={2} strokeDasharray="0" ifOverflow="visible" />
                        )}

                        {/* Historical — solid blue, renders only points where historical is set */}
                        <Line type="monotone" dataKey="historical" stroke="#3988d6" strokeWidth={2} dot={{ r: 2, fill: '#3988d6', strokeWidth: 0 }} activeDot={{ r: 4 }} legendType="none" connectNulls={false} />

                        {/* Forecast — dashed blue, renders only points where forecast is set */}
                        <Line type="monotone" dataKey="forecast" stroke="#3988d6" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 2, fill: '#3988d6', strokeWidth: 0 }} activeDot={{ r: 4 }} legendType="none" connectNulls={false} />

                        {/* "Now" vertical line at first forecast date */}
                        {nowDate && (
                          <ReferenceLine
                            x={nowDate}
                            stroke="#9CA3AF"
                            strokeDasharray="4 4"
                            label={{ value: 'Now', position: 'insideTopRight', fontSize: 9, fill: '#6B7280', fontFamily: 'Inter, sans-serif' }}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>

                    {/* Bottom legend — Warning / Danger / Extreme with live threshold values */}
                    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '6px', fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '22px', borderTop: '2px solid #FB9B2D' }} />
                        <span style={{ color: '#6B7280' }}>Warning{warning != null ? ` (${warning.toFixed(1)})` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '22px', borderTop: '2px solid #FF1519' }} />
                        <span style={{ color: '#6B7280' }}>Danger{danger != null ? ` (${danger.toFixed(1)})` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '22px', borderTop: '2px solid #952426' }} />
                        <span style={{ color: '#6B7280' }}>Extreme{extreme != null ? ` (${extreme.toFixed(1)})` : ''}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#9CA3AF' }}>
                      {selectedGauge ? 'Loading chart…' : 'Select a gauge'}
                    </span>
                  </div>
                )}
              </div>

              {/* Vertical Separator Line */}
              <div style={{ width: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch' }}></div>

              {/* Right side - Gauge Information */}
              <div style={{ flex: 1, paddingTop: '8px', paddingLeft: '20px' }}>
                <h3 style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontSize: '20px', 
                  fontWeight: 600,
                  color: '#000000',
                  marginBottom: '24px',
                }}>
                  Gauge Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Two columns layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: '280px 280px', gap: '60px' }}>
                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <p style={{ 
                          fontFamily: 'Inter, sans-serif', 
                          fontSize: '13px', 
                          color: '#6B7280', 
                          marginBottom: '6px',
                          fontWeight: 400,
                        }}>
                          River Gauge ID
                        </p>
                        <p style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#000000',
                        }}>
                          {selectedGaugeForecast?.id ?? '—'}
                        </p>
                      </div>

                      <div>
                        <p style={{ 
                          fontFamily: 'Inter, sans-serif', 
                          fontSize: '13px', 
                          color: '#6B7280', 
                          marginBottom: '6px',
                          fontWeight: 400,
                        }}>
                          Source
                        </p>
                        <p style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#000000',
                        }}>
                          WAPDA
                        </p>
                      </div>

                      <div>
                        <p style={{ 
                          fontFamily: 'Inter, sans-serif', 
                          fontSize: '13px', 
                          color: '#6B7280', 
                          marginBottom: '6px',
                          fontWeight: 400,
                        }}>
                          Lat/Long
                        </p>
                        <p style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#000000',
                        }}>
                          {selectedGaugeForecast
                            ? `${selectedGaugeForecast.lat}, ${selectedGaugeForecast.lon}`
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <p style={{ 
                          fontFamily: 'Inter, sans-serif', 
                          fontSize: '13px', 
                          color: '#6B7280', 
                          marginBottom: '6px',
                          fontWeight: 400,
                        }}>
                          Station Name
                        </p>
                        <p style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#000000',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          maxWidth: '100%',
                        }}>
                          {selectedGaugeForecast?.name ?? selectedGauge?.name ?? '—'}
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Maps;
