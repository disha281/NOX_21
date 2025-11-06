import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pharmacyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const bestPharmacyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit map bounds
const MapBounds = ({ userLocation, pharmacies }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation && pharmacies.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        ...pharmacies.map(p => [p.lat, p.lng])
      ]);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, userLocation, pharmacies]);
  
  return null;
};

const PharmacyMap = ({ userLocation, pharmacies, selectedMedicine, height = 300 }) => {
  const mapRef = useRef();

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatPrice = (price) => {
    return `₹${price.toFixed(0)}`;
  };

  const getMedicineInfo = (pharmacy) => {
    if (!selectedMedicine) return null;
    return pharmacy.inventory?.find(item => item.medicineId === selectedMedicine.id);
  };

  if (!userLocation) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <p>Location not available</p>
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        ref={mapRef}
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds userLocation={userLocation} pharmacies={pharmacies} />
        
        {/* User location marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div>
              <strong>Your Location</strong>
            </div>
          </Popup>
        </Marker>
        
        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy, index) => {
          const medicineInfo = getMedicineInfo(pharmacy);
          const isBest = index === 0; // Assuming first pharmacy is the best recommendation
          
          return (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.lat, pharmacy.lng]}
              icon={isBest ? bestPharmacyIcon : pharmacyIcon}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
                    {pharmacy.name}
                    {isBest && <span style={{ color: '#ff9800', marginLeft: '8px' }}>⭐ Best Choice</span>}
                  </h4>
                  
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    📍 {pharmacy.address}
                  </p>
                  
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    📞 {pharmacy.phone}
                  </p>
                  
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    🚶 {formatDistance(pharmacy.distance)}
                  </p>
                  
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    ⭐ {pharmacy.rating}/5.0
                  </p>
                  
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    🕒 {pharmacy.is24x7 ? '24/7 Open' : `Open: ${pharmacy.openHours}`}
                  </p>
                  
                  {medicineInfo && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px', 
                      backgroundColor: '#f0f8ff', 
                      borderRadius: '4px' 
                    }}>
                      <p style={{ margin: '2px 0', fontSize: '14px', fontWeight: 'bold' }}>
                        {selectedMedicine.name}
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '14px', color: '#2e7d32' }}>
                        💰 {formatPrice(medicineInfo.price)}
                        {medicineInfo.discount > 0 && (
                          <span style={{ color: '#ff5722', marginLeft: '4px' }}>
                            ({medicineInfo.discount}% off)
                          </span>
                        )}
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '14px' }}>
                        📦 {medicineInfo.stock} in stock
                      </p>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '8px' }}>
                    <button
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '4px'
                      }}
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}&key=AIzaSyC6AMF95Ws3mKqX_lQ_OEbTDffjPHkEU5M`;
                        window.open(url, '_blank');
                      }}
                    >
                      Get Directions
                    </button>
                    <button
                      style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      onClick={() => {
                        window.open(`tel:${pharmacy.phone}`, '_self');
                      }}
                    >
                      Call
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default PharmacyMap;