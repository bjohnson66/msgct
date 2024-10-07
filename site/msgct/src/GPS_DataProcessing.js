const fs = require('fs');
// Constants
const mu = 3.986005e14;  // m^3/s^2, Earth's gravitational constant
const omega_e = 7.2921151467e-5;  // Earth's rotation rate in rad/s

// Function to solve Kepler's equation for Eccentric Anomaly (E)
function calculateEccentricAnomaly(M, e, tolerance = 1e-10, maxIter = 100) {
    let E = M;  // Initial guess
    for (let i = 0; i < maxIter; i++) {
        const deltaE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= deltaE;
        if (Math.abs(deltaE) < tolerance) break;
    }
    return E;
}

// Function to calculate True Anomaly (v) from Eccentric Anomaly (E)
function calculateTrueAnomaly(E, e) {
    const sin_v = (Math.sqrt(1 - e ** 2) * Math.sin(E)) / (1 - e * Math.cos(E));
    const cos_v = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    return Math.atan2(sin_v, cos_v);
}
function calculateSatellitePosition(satelliteData) {
    // Extract parameters
    const SQRT_A = satelliteData['SQRT_A']; // This should be added to your JSON file if necessary.
    const M0 = satelliteData['MeanAnom'];
    const e = satelliteData['Eccentricity'];
    const Omega0 = satelliteData['RightAscenAtWeek'];
    const Omega_dot = satelliteData['RateOfRightAscen'];
    const t0 = satelliteData['TimeOfApplicability'];
    const i = satelliteData['OrbitalInclination'];
    const w = satelliteData['ArgumentOfPerigee'];

    console.log(`Satellite ID: ${satelliteData['ID']}`);
    console.log(`SQRT_A: ${SQRT_A}, M0: ${M0}, e: ${e}, Omega0: ${Omega0}, Omega_dot: ${Omega_dot}`);
    console.log(`t0: ${t0}, i: ${i}, w: ${w}`);

    
    // Set current time (e.g., 1 hour after t0)
    const t = t0 + 3600;  // Time in seconds into GPS week
    const delta_t = t - t0;

    // Calculations for semi-major axis, mean motion, and mean anomaly
    const a = SQRT_A ** 2;
    const n0 = Math.sqrt(mu / Math.pow(a, 3));  // Computed mean motion (rad/s)
    const M = (M0 + n0 * delta_t) % (2 * Math.PI);  // Mean anomaly at time t

    // Solve for Eccentric Anomaly (E)
    const E = calculateEccentricAnomaly(M, e);

    // Calculate True Anomaly (v)
    const v = calculateTrueAnomaly(E, e);

    // Calculate argument of latitude
    const u = (v + w) % (2 * Math.PI);

    // Calculate radius (r)
    const r = a * (1 - e * Math.cos(E));

    // Corrected longitude of ascending node
    const Omega = (Omega0 + (Omega_dot - omega_e) * delta_t) % (2 * Math.PI);

    // Compute ECEF coordinates using standard formulas
    const sin_u = Math.sin(u);
    const cos_u = Math.cos(u);
    const sin_i = Math.sin(i);
    const cos_i = Math.cos(i);
    const sin_Omega = Math.sin(Omega);
    const cos_Omega = Math.cos(Omega);

    const X = r * (cos_u * cos_Omega - sin_u * sin_Omega * cos_i);
    const Y = r * (cos_u * sin_Omega + sin_u * cos_Omega * cos_i);
    const Z = r * (sin_u * sin_i);

    return { X, Y, Z };
}
function calculateLongLatitudeAltitude(X, Y, Z) {
    // WGS-84 ellipsoid constants
    const a = 6378137.0;  // Semi-major axis in meters
    const f = 1 / 298.257223563;  // Flattening
    const e2 = f * (2 - f);  // Square of eccentricity

    // Calculate longitude in radians
    const longitude = Math.atan2(Y, X);

    // Calculate preliminary latitude in radians
    const p = Math.sqrt(X ** 2 + Y ** 2);
    const theta = Math.atan2(Z * a, p * (1 - f) * a);
    const sin_theta = Math.sin(theta);
    const cos_theta = Math.cos(theta);

    // Calculate latitude in radians
    const latitude = Math.atan2(Z + e2 * (1 - f) * a * Math.pow(sin_theta, 3),
                                p - e2 * a * Math.pow(cos_theta, 3));

    // Calculate altitude
    const N = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(latitude), 2));
    const altitude = p / Math.cos(latitude) - N;

    // Convert latitude and longitude to degrees
    const latitudeDeg = latitude * (180 / Math.PI);
    const longitudeDeg = longitude * (180 / Math.PI);

    return { longitude: longitudeDeg, latitude: latitudeDeg, altitude };
}
// Test function to read JSON and calculate coordinates
function testSatelliteData(jsonFilePath) {
    // Read and parse the JSON file
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            const satellites = jsonData.satellites;

            if (Array.isArray(satellites)) {
                satellites.forEach((satellite, index) => {
                    // Log the satellite data to verify it is being read correctly
                    console.log(`Processing Satellite Index: ${index}`);
                    console.log(`Satellite Data:`, satellite);

                    // Validate each required property
                    const requiredKeys = [
                        'ID', 'Eccentricity', 'TimeOfApplicability', 'OrbitalInclination',
                        'RateOfRightAscen', 'RightAscenAtWeek', 'ArgumentOfPerigee', 'MeanAnom'
                    ];

                    const missingKeys = requiredKeys.filter(key => satellite[key] === undefined);
                    if (missingKeys.length > 0) {
                        console.error(`Missing properties for satellite index ${index}:`, missingKeys);
                        return;  // Skip this satellite if any property is missing
                    }

                    try {
                        const { X, Y, Z } = calculateSatellitePosition(satellite);
                        if (isNaN(X) || isNaN(Y) || isNaN(Z)) {
                            console.error(`NaN detected in ECEF coordinates for satellite index ${index}`);
                        } else {
                            const { longitude, latitude, altitude } = calculateLongLatitudeAltitude(X, Y, Z);
                            console.log(`Satellite ID ${satellite['ID']}:`);
                            console.log(`ECEF Coordinates: X = ${X}, Y = ${Y}, Z = ${Z}`);
                            console.log(`Geodetic Coordinates: Longitude = ${longitude}, Latitude = ${latitude}, Altitude = ${altitude}`);
                        }
                        console.log('---');
                    } catch (error) {
                        console.error(`Error calculating position for satellite index ${index}:`, error);
                    }
                });
            } else {
                console.error('Error: "satellites" is not an array in the parsed JSON.');
            }
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
        }
    });
}



testSatelliteData('C:\\Users\\rutge\\OneDrive - University of Iowa\\Senior Design 4890\\Github\\msgct\\server\\GPS_Data\\GPS_20241006_204720.json');