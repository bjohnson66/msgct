// Function to parse GSV sentences
export const parseGSV = (sentence) => {
  const fields = sentence.split(',');

  if (fields.length < 4) {
    console.error('Invalid GSV sentence:', sentence);
    return [];
  }

  const satellites = [];

  // Parse satellite data from GSV sentence
  for (let i = 4; i + 3 < fields.length; i += 4) {
    const prn = fields[i];
    const elevation = fields[i + 1];
    const azimuth = fields[i + 2];
    const snrRaw = fields[i + 3];

    if (prn) {
      // Normalize the SNR field
      const snrTrimmed = snrRaw ? snrRaw.trim().toUpperCase() : '';
      const isNAA = (snrTrimmed === 'N/A'); // Check if exactly "N/A"

      let snrValue = 0;
      if (!isNAA) {
        const parsedSNR = parseFloat(snrRaw);
        if (!isNaN(parsedSNR)) {
          snrValue = parsedSNR;
        }
      }

      // If SNR is N/A or <= 0, consider Unhealthy, else Healthy (000)
      const healthStatus = (isNAA || snrValue <= 0) ? 'Unhealthy' : '000';

      satellites.push({
        ID: prn.trim(),
        elevation: parseFloat(elevation) || 0,
        azimuth: parseFloat(azimuth) || 0,
        snr: snrValue,
        health: healthStatus,
      });
    }
  }

  return satellites;
};

// Function to parse GGA sentences
export const parseGGA = (sentence) => {
  const fields = sentence.split(',');
  if (fields.length < 10) {
    console.error('Invalid GGA sentence:', sentence);
    return null;
  }
  const latField = fields[2];
  const latHemisphere = fields[3];
  const lonField = fields[4];
  const lonHemisphere = fields[5];
  const fixQuality = fields[6];
  const numSatellites = fields[7];
  const hdop = fields[8];
  const altitude = parseFloat(fields[9]);

  const lat = convertNMEACoordinateToDecimal(latField, latHemisphere);
  const lon = convertNMEACoordinateToDecimal(lonField, lonHemisphere);

  if (lat === null || lon === null) {
    console.error('Invalid coordinates in GGA sentence:', sentence);
    return null;
  }

  return {
    lat,
    lon,
    alt: altitude || 0,
    fixQuality: parseInt(fixQuality, 10) || 0,
    numSatellites: parseInt(numSatellites, 10) || 0,
    hdop: parseFloat(hdop) || 0,
  };
};

// Helper function to convert NMEA coordinates to decimal degrees
export const convertNMEACoordinateToDecimal = (coordinate, hemisphere) => {
  if (!coordinate || coordinate.length < 3) {
    return null;
  }
  const dotIndex = coordinate.indexOf('.');
  const degreesLength = dotIndex > 2 ? dotIndex - 2 : 2;
  const degrees = parseInt(coordinate.slice(0, degreesLength), 10);
  const minutes = parseFloat(coordinate.slice(degreesLength));

  if (isNaN(degrees) || isNaN(minutes)) {
    return null;
  }

  let decimalDegrees = degrees + minutes / 60;
  if (hemisphere === 'S' || hemisphere === 'W') {
    decimalDegrees *= -1;
  }
  return decimalDegrees;
};
