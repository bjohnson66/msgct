//-------------------------------------
// Retreiving Almanac Data from Server
//-------------------------------------
export const fetchAlmanacData = async () => {
    try {
      const response = await fetch('/sv_data/gps_data/gps_20241023_142811.json');
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