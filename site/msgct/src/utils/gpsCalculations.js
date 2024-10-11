//-------------------------------------
// GPS Satellite Calculaitons - ECEF
//--------------------------------------
//See: https://gssc.esa.int/navipedia/index.php?title=GPS_and_Galileo_Satellite_Coordinates_Computation
// Constants
const GM = 3.986005e14; // Gravitational constant for Earth (m^3/s^2)
const OMEGA_DOT_E = 7.2921151467e-5; // Earth's rotation rate (rad/s)

export const calculateSatellitePosition = (satellite, currentTimeGPST) => {
  const {
    Eccentricity,
    OrbitalInclination,
    RateOfRightAscen,
    RightAscenAtWeek,
    ArgumentOfPerigee,
    MeanAnom,
    Af0,
    Af1,
    TimeOfApplicability
  } = satellite;

  // Constants
  const mu = 3.986005e14; // Earth's gravitational constant in m^3/s^2
  const semiMajorAxis = 26560e3; // Approximate semi-major axis for GPS satellites in meters
  const n0 = Math.sqrt(mu / Math.pow(semiMajorAxis, 3)); // Mean motion
  
  // Calculate time difference from TimeOfApplicability
  const t = currentTimeGPST - TimeOfApplicability;
  
  // Calculate the corrected mean anomaly
  const M = MeanAnom + n0 * t;
  
  // Solve Kepler's equation for the Eccentric Anomaly (E)
  const solveKepler = (M, e, tolerance = 1e-8) => {
    let E = M;
    let delta = 1;
    while (Math.abs(delta) > tolerance) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
    }
    return E;
  };
  const E = solveKepler(M, Eccentricity);
  
  // Calculate True Anomaly (ν)
  const sinV = Math.sqrt(1 - Eccentricity ** 2) * Math.sin(E) / (1 - Eccentricity * Math.cos(E));
  const cosV = (Math.cos(E) - Eccentricity) / (1 - Eccentricity * Math.cos(E));
  const trueAnomaly = Math.atan2(sinV, cosV);
  
  // Calculate radius (r)
  const r = semiMajorAxis * (1 - Eccentricity * Math.cos(E));
  
  // Position in the orbital plane
  const xOrbital = r * Math.cos(trueAnomaly);
  const yOrbital = r * Math.sin(trueAnomaly);
  
  // Correct for argument of perigee and inclination
  const cosArgPerigee = Math.cos(ArgumentOfPerigee);
  const sinArgPerigee = Math.sin(ArgumentOfPerigee);
  const cosInclination = Math.cos(OrbitalInclination);
  const sinInclination = Math.sin(OrbitalInclination);
  
  // ECEF coordinates (simplified)
  const x = xOrbital * cosArgPerigee - yOrbital * sinArgPerigee * cosInclination;
  const y = xOrbital * sinArgPerigee + yOrbital * cosArgPerigee * cosInclination;
  const z = yOrbital * sinInclination;

  return { x, y, z };
};



//--------------------------------------
// GPS SV Calculaiton topocentric coordinates
//--------------------------------------
// Function to convert ECEF coordinates of a satellite to topocentric (ENU) coordinates
// Takes in satellite position {x, y, z} and user position {lat, lon, alt} (latitude, longitude in radians)
export const calculateElevationAzimuth = (satellitePosition, userPosition) => {
  const { lat, lon, alt } = userPosition; // User's geodetic position (latitude and longitude in radians)
  const { x: xs, y: ys, z: zs } = satellitePosition; // Satellite's position in ECEF coordinates

  // Convert user's geodetic position to ECEF coordinates
  const a = 6378137; // WGS-84 Earth semi-major axis (meters)
  const f = 1 / 298.257223563; // WGS-84 flattening factor
  const e2 = f * (2 - f); // Square of Earth's eccentricity

  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const cosLon = Math.cos(lon);
  const sinLon = Math.sin(lon);

  // Calculate radius of curvature in the prime vertical
  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);

  // User's ECEF coordinates
  const xUser = (N + alt) * cosLat * cosLon;
  const yUser = (N + alt) * cosLat * sinLon;
  const zUser = (N * (1 - e2) + alt) * sinLat;

  // Vector from user to satellite in ECEF
  const dx = xs - xUser;
  const dy = ys - yUser;
  const dz = zs - zUser;

  // Transform the vector to ENU (East-North-Up) coordinates
  const east = -sinLon * dx + cosLon * dy;
  const north = -sinLat * cosLon * dx - sinLat * sinLon * dy + cosLat * dz;
  const up = cosLat * cosLon * dx + cosLat * sinLon * dy + sinLat * dz;

  // Calculate the azimuth (radians)
  const azimuth = Math.atan2(east, north);
  const azimuthDegrees = (azimuth * 180) / Math.PI;
  
  // Calculate the elevation (radians)
  const horizontalDistance = Math.sqrt(east * east + north * north);
  const elevation = Math.atan2(up, horizontalDistance);
  const elevationDegrees = (elevation * 180) / Math.PI;

  return {
    elevation: elevationDegrees, // Elevation in degrees
    azimuth: (azimuthDegrees + 360) % 360, // Azimuth in degrees (normalized to 0-360 range)
    snr: estimateSNR(elevationDegrees) // Call SNR estimation based on elevation
  };
}

// Function to estimate SNR based on elevation angle (simple model)
// Higher elevations generally result in better signal quality due to less atmospheric interference
function estimateSNR(elevation) {
  // SNR estimation can be complex, depending on atmospheric models, hardware, etc.
  // Here's a simple model: the higher the elevation, the better the signal
  if (elevation <= 0) return 0; // Below horizon, no signal

  // Linearly estimate SNR, assuming 0 dB at 0° elevation and 50 dB at zenith (90°)
  const snr = Math.min(50, Math.max(0, elevation * (50 / 90)));
  return snr;
}