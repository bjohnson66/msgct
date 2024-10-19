//-------------------------------------
// GPS Satellite Calculaitons - ECEF
//--------------------------------------
//See: https://www.gps.gov/technical/icwg/meetings/2019/09/GPS-SV-velocity-and-acceleration.pdf
const mu = 3.986005e14; // Gravitational constant for Earth (m^3/s^2)
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
  let A = Math.pow(SQRT_A, 2);

  // Compute mean motion (n)
  let n_0 = Math.sqrt(mu / Math.pow(A, 3));
  let n = n_0 + deltaN; // Corrected mean motion (n)

  // Time from ephemeris reference epoch #TODO
  let t_k = t - TimeOfApplicability;
  if (t_k > 302400) t_k -= 604800; // Week crossover correction
  if (t_k < -302400) t_k += 604800;

  // Calculate the mean anomaly at time t
  let M_k = MeanAnom + (n* t_k);

  // Solve Kepler's equation for eccentric anomaly
  let E_0 = M_k; // Initial guess eccentricAnomaly
  let E_j_minus_one = E_0;
  let E_j = 0;
  for (let j = 0; j < 3; j++) {
    E_j = E_j_minus_one + ((M_k - E_j_minus_one + Eccentricity * Math.sin(E_j_minus_one))/
                                  (1- Eccentricity * Math.cos(E_j_minus_one)));
  }
  let E_k = E_j; //Final calue E_k = E_3

  // Calculate the true anomaly
  // const trueAnomaly = 2 * Math.atan(
  //   Math.sqrt((1 + Eccentricity) / (1 - Eccentricity)) * Math.tan(eccentricAnomaly / 2)
  // );
  let v_k = 2* (Math.atan(Math.sqrt((1+Eccentricity)/(1-Eccentricity))*Math.tan(E_k/2)));
  
  // Argument of latitude
  let phi_k = v_k + ArgumentOfPerigee;

  // Latitude correction
  let delta_u_k = (cus * Math.sin(2 * phi_k)) + (cuc * Math.cos(2 * phi_k));

  // Radius correction
  let delta_r_k = (crs * Math.sin(2 * phi_k)) + (crc * Math.cos(2 * phi_k));

  // Inclination correction
  let delta_i_k = (cis * Math.sin(2 * phi_k)) + (cic * Math.cos(2 * phi_k));

  // Corrected argument of latitude
  let u_k = phi_k + delta_u_k;

  // Corrected radius
  let r_k = (A * (1 - (Eccentricity * Math.cos(E_k)))) + delta_r_k;

  // Corrected inclination
  let i_k = OrbitalInclination + delta_i_k + (IDOT * t_k);

  // Orbital plane positions (x', y')
  let x_prime_k = r_k * Math.cos(u_k);
  let y_prime_k = r_k * Math.sin(u_k);

  // Corrected right ascension of ascending node
  let omega_k = RightAscenAtWeek + ((RateOfRightAscen - OMEGA_DOT_E) * t_k) - (OMEGA_DOT_E * TimeOfApplicability);

  // Earth-fixed coordinates (x, y, z)
  const x = (x_prime_k * Math.cos(omega_k)) - (y_prime_k * Math.cos(i_k) * Math.sin(omega_k));
  const y = (x_prime_k * Math.sin(omega_k)) + (y_prime_k * Math.cos(i_k) * Math.cos(omega_k));
  const z = y_prime_k * Math.sin(i_k);

  return { x, y, z };
};


// This implementation is from GPS ICD200C Table 20-IV
// https://www.gps.gov/technical/icwg/ICD-GPS-200C.pdf
// export const calculateSatellitePosition = (
//   satelliteData,
//   t,
//   deltaN = 0,
//   cuc = 0,  // Latitude correction coefficient (cosine)
//   cus = 0,  // Latitude correction coefficient (sine)
//   crc = 0,  // Radius correction coefficient (cosine)
//   crs = 0,  // Radius correction coefficient (sine)
//   cic = 0,  // Inclination correction coefficient (cosine)
//   cis = 0,  // Inclination correction coefficient (sine)
//   IDOT = 0  // Rate of change of inclination angle
// ) => {
//   const {
//     SQRT_A, // Square root of the semi-major axis (m^1/2)
//     Eccentricity, // Eccentricity of the orbit
//     OrbitalInclination, // Inclination angle (i0) in radians
//     RightAscenAtWeek, // Right ascension of the ascending node (Ω0)
//     ArgumentOfPerigee, // Argument of perigee (ω)
//     MeanAnom, // Mean anomaly (M0)
//     TimeOfApplicability, // toe: Time of ephemeris applicability (seconds)
//     RateOfRightAscen // Rate of right ascension (Ω̇)
//   } = satelliteData;

//   // Step 1: Semi-major axis (A)
//   const A = SQRT_A ** 2;

//   // Step 2: Compute mean motion (n_0)
//   const n_0 = Math.sqrt(mu / (A ** 3));

//   // Step 3: Time from ephemeris reference epoch (tk)
//   let t_k = t - TimeOfApplicability;
//   if (t_k > 302400) t_k -= 604800; // Adjust for end of week
//   if (t_k < -302400) t_k += 604800;

//   // Step 4: Corrected mean motion (n)
//   const n = n_0 + deltaN;

//   // Step 5: Mean anomaly (Mk) at time t
//   const M_k = MeanAnom + n * t_k;

//   // Step 6: Solve Kepler's Equation for eccentric anomaly (Ek) using iterative method
//   let E_k = M_k;
//   for (let i = 0; i < 10; i++) {
//     E_k = M_k + Eccentricity * Math.sin(E_k);
//   }

//   // Step 7: True anomaly (vk)
//   const v_k = 2 * Math.atan2(
//     Math.sqrt(1 + Eccentricity) * Math.sin(E_k / 2),
//     Math.sqrt(1 - Eccentricity) * Math.cos(E_k / 2)
//   );

//   // Step 8: Argument of latitude (Φk)
//   const phi_k = v_k + ArgumentOfPerigee;

//   // Step 9: Second harmonic perturbations
//   const delta_u_k = cus * Math.sin(2 * phi_k) + cuc * Math.cos(2 * phi_k); // Latitude correction
//   const delta_r_k = crs * Math.sin(2 * phi_k) + crc * Math.cos(2 * phi_k); // Radius correction
//   const delta_i_k = cis * Math.sin(2 * phi_k) + cic * Math.cos(2 * phi_k); // Inclination correction

//   // Step 10: Corrected argument of latitude (uk)
//   const u_k = phi_k + delta_u_k;

//   // Step 11: Corrected radius (rk)
//   const r_k = A * (1 - Eccentricity * Math.cos(E_k)) + delta_r_k;

//   // Step 12: Corrected inclination (ik)
//   const i_k = OrbitalInclination + delta_i_k + (IDOT * t_k);

//   // Step 13: Orbital plane positions (x', y')
//   const x_prime_k = r_k * Math.cos(u_k);
//   const y_prime_k = r_k * Math.sin(u_k);

//   // Step 14: Corrected longitude of ascending node (Ωk)
//   const omega_k = RightAscenAtWeek + (RateOfRightAscen - OMEGA_DOT_E) * t_k - (OMEGA_DOT_E * TimeOfApplicability);

//   // Step 15: Earth-fixed coordinates (ECEF)
//   const x = x_prime_k * Math.cos(omega_k) - y_prime_k * Math.cos(i_k) * Math.sin(omega_k);
//   const y = x_prime_k * Math.sin(omega_k) + y_prime_k * Math.cos(i_k) * Math.cos(omega_k);
//   const z = y_prime_k * Math.sin(i_k);

//   // Return the satellite's position in ECEF coordinates (x, y, z)
//   return { x, y, z };
// };



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