//-------------------------------------
// GPS Satellite Calculaitons - ECEF
//--------------------------------------
//See: https://www.gps.gov/technical/icwg/meetings/2019/09/GPS-SV-velocity-and-acceleration.pdf
const GM = 3.986005e14; // Gravitational constant for Earth (m^3/s^2)
const OMEGA_DOT_E = 7.2921151467e-5; // Earth's rotation rate (rad/s)

export const calculateSatellitePosition = (
  satelliteData,
  t,
  deltaN = 0,
  cuc = 0,  // Default to 0 if not provided
  cus = 0,  // Default to 0 if not provided
  crc = 0,  // Default to 0 if not provided
  crs = 0,  // Default to 0 if not provided
  cic = 0,  // Default to 0 if not provided
  cis = 0,  // Default to 0 if not provided
  IDOT = 0  // Default to 0 if not provided
) => {
  const {
    SQRT_A,
    Eccentricity,
    OrbitalInclination,
    RightAscenAtWeek,
    ArgumentOfPerigee,
    MeanAnom,
    TimeOfApplicability,
    RateOfRightAscen
  } = satelliteData;


  // Convert SQRT_A to semi-major axis
  const semiMajorAxis = Math.pow(SQRT_A, 2);

  // Compute mean motion (n)
  const meanMotion = Math.sqrt(GM / Math.pow(semiMajorAxis, 3)) + deltaN; // Corrected mean motion (n)
  
  // Time from ephemeris reference epoch
  let delta_t = t - TimeOfApplicability;
  if (delta_t > 302400) delta_t -= 604800; // Week crossover correction
  if (delta_t < -302400) delta_t += 604800;

  // Calculate the mean anomaly at time t
  const meanAnomaly = MeanAnom + meanMotion * delta_t;

  // Solve Kepler's equation for eccentric anomaly
  let eccentricAnomaly = meanAnomaly; // Initial guess
  for (let i = 0; i < 3; i++) {
    const nextEccentricAnomaly = eccentricAnomaly + (meanAnomaly - (eccentricAnomaly - Eccentricity * Math.sin(eccentricAnomaly))) / (1 - Eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly = nextEccentricAnomaly;
  }

  // Calculate the true anomaly
  // const trueAnomaly = 2 * Math.atan(
  //   Math.sqrt((1 + Eccentricity) / (1 - Eccentricity)) * Math.tan(eccentricAnomaly / 2)
  // );
  const trueAnomaly = Math.atan2(
    Math.sqrt(1 - Eccentricity * Eccentricity) * Math.sin(eccentricAnomaly),
    Math.cos(eccentricAnomaly) - Eccentricity
  );
  
  // Argument of latitude
  const argumentOfLatitude = trueAnomaly + ArgumentOfPerigee;

  // Latitude correction
  const latitudeCorrection = cus * Math.sin(2 * argumentOfLatitude) + cuc * Math.cos(2 * argumentOfLatitude);

  // Radius correction
  const radiusCorrection = crs * Math.sin(2 * argumentOfLatitude) + crc * Math.cos(2 * argumentOfLatitude);

  // Inclination correction
  const inclinationCorrection = cis * Math.sin(2 * argumentOfLatitude) + cic * Math.cos(2 * argumentOfLatitude);

  // Corrected argument of latitude
  const correctedArgumentOfLatitude = argumentOfLatitude + latitudeCorrection;

  // Corrected radius
  const correctedRadius = semiMajorAxis * (1 - Eccentricity * Math.cos(eccentricAnomaly)) + radiusCorrection;

  // Corrected inclination
  const correctedInclination = OrbitalInclination + inclinationCorrection + (IDOT * delta_t);

  // Orbital plane positions (x', y')
  const xOrbitalPlane = correctedRadius * Math.cos(correctedArgumentOfLatitude);
  const yOrbitalPlane = correctedRadius * Math.sin(correctedArgumentOfLatitude);

  // Corrected right ascension of ascending node
  const correctedRightAscension = RightAscenAtWeek + (RateOfRightAscen - OMEGA_DOT_E) * delta_t - OMEGA_DOT_E * TimeOfApplicability;

  // Earth-fixed coordinates (x, y, z)
  const x = xOrbitalPlane * Math.cos(correctedRightAscension) - yOrbitalPlane * Math.cos(correctedInclination) * Math.sin(correctedRightAscension);
  const y = xOrbitalPlane * Math.sin(correctedRightAscension) + yOrbitalPlane * Math.cos(correctedInclination) * Math.cos(correctedRightAscension);
  const z = yOrbitalPlane * Math.sin(correctedInclination);

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

  const latRad = (lat * Math.PI) /180;
  const lonRad = (lon * Math.PI) / 180;

  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const cosLon = Math.cos(lonRad);
  const sinLon = Math.sin(lonRad);

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