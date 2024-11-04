//-------------------------------------
// Retreiving Almanac Data from Server
//-------------------------------------
export const fetchAlmanacByFilename = async (filename) => {
    try {
      console.log(`Opening /sv_data/gps_data/${filename}`);
      const response = await fetch(`/sv_data/gps_data/${filename}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to load GPS data:', error);
      return [];
    }
  };