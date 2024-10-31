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
      const snr = fields[i + 3];
  
      if (prn) {
        satellites.push({
          ID: prn.trim(),
          elevation: parseFloat(elevation) || 0,
          azimuth: parseFloat(azimuth) || 0,
          snr: parseFloat(snr) || 0,
          health: '000', // Assuming default health status
        });
      }
    }
  
    return satellites;
  };
  
  // Function to parse GGA sentences
  export const parseGGA = (sentence) => {
    // GGA - Global Positioning System Fix Data
    const fields = sentence.split(',');
    if (fields.length < 15) {
      console.error('Invalid GGA sentence:', sentence);
      return null;
    }
    const latField = fields[2];
    const latHemisphere = fields[3];
    const lonField = fields[4];
    const lonHemisphere = fields[5];
    const altitude = parseFloat(fields[9]);
  
    const lat = convertNMEACoordinateToDecimal(latField, latHemisphere);
    const lon = convertNMEACoordinateToDecimal(lonField, lonHemisphere);
  
    return {
      lat,
      lon,
      alt: altitude,
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
  
    let decimalDegrees = degrees + minutes / 60;
    if (hemisphere === 'S' || hemisphere === 'W') {
      decimalDegrees *= -1;
    }
    return decimalDegrees;
  };
  