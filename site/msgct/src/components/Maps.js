import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Maps = ({ positionSource, manualPosition, setManualPosition, receiverPosition }) => {
  const [currentPosition, setCurrentPosition] = useState({
    lat: 45.0,
    lon: -93.0,
    alt: 0.0,
  });

  // Bounds to cover the entire world
  const worldBounds = [
    [-90, -180], // Southwest corner
    [90, 180],   // Northeast corner
  ];

  // Update the map position based on the selected position source
  useEffect(() => {
    if (positionSource === 'manual') {
      setCurrentPosition({
        lat: manualPosition.lat || 0,
        lon: manualPosition.lon || 0,
        alt: manualPosition.alt || 0,
      });
    } else if (positionSource === 'receiver') {
      setCurrentPosition({
        lat: receiverPosition.lat || 0,
        lon: receiverPosition.lon || 0,
        alt: receiverPosition.alt || 0,
      });
    } else if (positionSource === 'device' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, altitude } = position.coords;
          setCurrentPosition({
            lat: latitude || 0,
            lon: longitude || 0,
            alt: altitude || 0,
          });
        },
        (error) => console.error('Error fetching device position:', error)
      );
    }
  }, [positionSource, manualPosition, receiverPosition]);

  // Handle map clicks to update manual position
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setManualPosition({ lat, lon: lng, alt: 0 }); // Update manual position
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[currentPosition.lat, currentPosition.lon]}
      zoom={2}
      style={{ height: '400px', width: '800px' }} // Adjusted to a smaller size
      maxBounds={[[90, -180], [-90, 180]]} // Strict bounds for the map
      maxBoundsViscosity={1.0} // Prevent panning outside
      minZoom={2} // Minimum zoom
      maxZoom={18} // Maximum zoom
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[currentPosition.lat, currentPosition.lon]}>
        <Popup>
          {`Latitude: ${currentPosition.lat.toFixed(5)}, Longitude: ${currentPosition.lon.toFixed(5)}, Altitude: ${currentPosition.alt}m`}
        </Popup>
      </Marker>
      <MapClickHandler />
    </MapContainer>
  );
};

export default Maps;
