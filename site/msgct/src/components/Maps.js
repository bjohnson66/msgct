import React from 'react';
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
    shadowAnchor: [12, 41],
  });
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Maps = ({ positionSource, manualPosition, setManualPosition, receiverPosition, receiversPositionsData }) => {
  const [currentPosition, setCurrentPosition] = React.useState({
    lat: 45.0,
    lon: -93.0,
    alt: 0.0,
  });

  React.useEffect(() => {
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
          {`Reference Position: Lat ${currentPosition.lat.toFixed(5)}, Lon ${currentPosition.lon.toFixed(5)}, Alt ${currentPosition.alt}m`}
        </Popup>
      </Marker>

      {/* Plot each receiver's historical positions */}
      {receiversPositionsData && Object.keys(receiversPositionsData).map((receiverName, rIndex) => {
        const colorIndex = rIndex % receiverColors.length;
        const icon = createColoredIcon(receiverColors[colorIndex]);
        return receiversPositionsData[receiverName].map((pos, pIndex) => (
          <Marker key={`${receiverName}-${pIndex}`} position={[pos.lat, pos.lon]} icon={icon}>
            <Popup>
              Receiver: {receiverName}<br/>
              Lat: {pos.lat.toFixed(5)}, Lon: {pos.lon.toFixed(5)}, Alt: {pos.alt.toFixed(2)}<br/>
              Time: {new Date(pos.timestamp).toLocaleTimeString()}
            </Popup>
          </Marker>
        ));
      })}
      <MapClickHandler />
    </MapContainer>
  );
};

export default Maps;