//-------------------------------------
// GPS Satellite Calculaitons - ECEF
//--------------------------------------
//See: https://gssc.esa.int/navipedia/index.php?title=GPS_and_Galileo_Satellite_Coordinates_Computation
// Constants
const GM = 3.986005e14; // Gravitational constant for Earth (m^3/s^2)
const OMEGA_DOT_E = 7.2921151467e-5; // Earth's rotation rate (rad/s)

export const calculateSatellitePosition = (satelliteData, t) => {
  const {
    SQRT_A,               // Square root of the semi-major axis (meters^1/2)
    Eccentricity,         // Eccentricity
    OrbitalInclination,   // Orbital inclination (radians)
    RightAscenAtWeek,     // Right ascension of ascending node at reference time (radians)
    ArgumentOfPerigee,    // Argument of perigee (radians)
    MeanAnom,             // Mean anomaly at reference time (radians)
    TimeOfApplicability,  // Reference time (seconds)
    RateOfRightAscen      // Rate of right ascension (OMEGA_DOT) (rad/s)
  } = satelliteData;

  // Convert SQRT_A to semi-major axis
  const semiMajorAxis = Math.pow(SQRT_A, 2);

  // Compute mean motion (n)
  const meanMotion = Math.sqrt(GM / Math.pow(semiMajorAxis, 3));

  // Time since epoch (seconds)
  const deltaT = t - TimeOfApplicability;

  // Calculate the mean anomaly at time t
  const meanAnomaly = MeanAnom + meanMotion * deltaT;

  // Normalize mean anomaly to between 0 and 2π
  let normalizedMeanAnomaly = meanAnomaly % (2 * Math.PI);
  if (normalizedMeanAnomaly < 0) normalizedMeanAnomaly += 2 * Math.PI;

  // Solve Kepler's equation for eccentric anomaly (using Newton-Raphson method)
  let eccentricAnomaly = normalizedMeanAnomaly;
  let previousEccentricAnomaly;
  const tolerance = 1e-12;
  do {
    previousEccentricAnomaly = eccentricAnomaly;
    eccentricAnomaly =
      previousEccentricAnomaly - 
      (previousEccentricAnomaly - Eccentricity * Math.sin(previousEccentricAnomaly) - normalizedMeanAnomaly) /
      (1 - Eccentricity * Math.cos(previousEccentricAnomaly));
  } while (Math.abs(eccentricAnomaly - previousEccentricAnomaly) > tolerance);

  // Calculate the true anomaly
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + Eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - Eccentricity) * Math.cos(eccentricAnomaly / 2)
  );

  // Calculate the distance to the satellite
  const distance = semiMajorAxis * (1 - Eccentricity * Math.cos(eccentricAnomaly));

  // Compute the argument of latitude
  const argumentOfLatitude = ArgumentOfPerigee + trueAnomaly;

  // Correct the right ascension of ascending node
  const correctedRightAscension = RightAscenAtWeek + (RateOfRightAscen - OMEGA_DOT_E) * deltaT;

  // Position in orbital plane
  const xOrbital = distance * Math.cos(argumentOfLatitude);
  const yOrbital = distance * Math.sin(argumentOfLatitude);

  // Calculate ECEF coordinates (x, y, z)
  const cosInclination = Math.cos(OrbitalInclination);
  const sinInclination = Math.sin(OrbitalInclination);

  const x = xOrbital * Math.cos(correctedRightAscension) - yOrbital * Math.sin(correctedRightAscension) * cosInclination;
  const y = xOrbital * Math.sin(correctedRightAscension) + yOrbital * Math.cos(correctedRightAscension) * cosInclination;
  const z = yOrbital * sinInclination;

  return { x, y, z };
}



//--------------------------------------
// GPS SV Calculaiton topocentric coordinates
//--------------------------------------
// Function to convert ECEF coordinates of a satellite to topocentric (ENU) coordinates
// Takes in satellite position {x, y, z} and user position {lat, lon, alt} (latitude, longitude in radians)
export const calculateElevationAzimuth = (satellitePosition, userPosition) => {
  const { latDegrees, lonDegrees, alt } = userPosition; // User's geodetic position (latitude and longitude in radians)
  const { x: xs, y: ys, z: zs } = satellitePosition; // Satellite's position in ECEF coordinates

  // Convert user's geodetic position to ECEF coordinates
  const a = 6378137; // WGS-84 Earth semi-major axis (meters)
  const f = 1 / 298.257223563; // WGS-84 flattening factor
  const e2 = f * (2 - f); // Square of Earth's eccentricity

  const latRadians = (latDegrees * Math.PI) / 180;
  const lonRadians = (lonDegrees * Math.PI) / 180;

  const cosLat = Math.cos(latRadians);
  const sinLat = Math.sin(latRadians);
  const cosLon = Math.cos(lonRadians);
  const sinLon = Math.sin(lonRadians);

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