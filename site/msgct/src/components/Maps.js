import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom icons for receivers
const receiverColors = [
  'red',
  'green',
  'blue',
  'purple',
  'orange',
  'cyan'
];

// Create marker icons for each receiver index
function createColoredIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
}

const R = 6371; // Earth radius in km
const DISTANCE = 1000; // Distance from user location to plot satellites

function destinationPoint(lat, lon, distance, bearing) {
  // bearing in degrees from north, lat/lon in degrees
  // Convert to radians
  const φ1 = lat * Math.PI/180;
  const λ1 = lon * Math.PI/180;
  const θ = bearing * Math.PI/180;
  const δ = distance/R;

  const φ2 = Math.asin(Math.sin(φ1)*Math.cos(δ) + Math.cos(φ1)*Math.sin(δ)*Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ)*Math.sin(δ)*Math.cos(φ1), Math.cos(δ)-Math.sin(φ1)*Math.sin(φ2));

  return {
    lat: φ2 * 180/Math.PI,
    lon: ((λ2 * 180/Math.PI) + 540) % 360 - 180 // normalize to -180..180
  };
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Maps = ({ positionSource, manualPosition, setManualPosition, receiverPosition, receiversSatelliteData }) => { // receiversSatelliteData
  const [currentPosition, setCurrentPosition] = useState({
    lat: 45.0,
    lon: -93.0,
    alt: 0.0,
  });

  // Bounds to cover the entire world
  const worldBounds = [
    [-90, -180],
    [90, 180],
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
        setManualPosition({ lat, lon: lng, alt: 0 });
      },
    });
    return null;
  }

  // Compute satellite markers for each receiver
  const satelliteMarkers = [];
  if (receiversSatelliteData) {
    const receiverNames = Object.keys(receiversSatelliteData);
    receiverNames.forEach((rName, idx) => {
      const colorIndex = idx % receiverColors.length;
      const icon = createColoredIcon(receiverColors[colorIndex]);
      const sats = receiversSatelliteData[rName];
      sats.forEach((sat) => {
        const { azimuth, elevation, ID } = sat;
        const dest = destinationPoint(currentPosition.lat, currentPosition.lon, DISTANCE, azimuth);
        satelliteMarkers.push(
          <Marker key={`${rName}-${ID}`} position={[dest.lat, dest.lon]} icon={icon}>
            <Popup>
              Receiver: {rName}<br/>
              Satellite: {ID}<br/>
              Az: {azimuth.toFixed(1)}° El: {elevation.toFixed(1)}°
            </Popup>
          </Marker>
        );
      });
    });
  }

  return (
    <MapContainer
      center={[currentPosition.lat, currentPosition.lon]}
      zoom={2}
      style={{ height: '400px', width: '800px' }}
      maxBounds={[[90, -180], [-90, 180]]}
      maxBoundsViscosity={1.0}
      minZoom={2}
      maxZoom={18}
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
      {satelliteMarkers} {/* Satellite Markers */}
      <MapClickHandler />
    </MapContainer>
  );
};

export default Maps;
