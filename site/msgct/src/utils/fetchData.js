//-------------------------------------
// Retreiving Almanac Data from Server
//-------------------------------------
export const fetchAlmanacByFilename = async (filename, constellation) => {
  try {
      const response = await fetch(`/sv_data/${constellation}_data/${filename}`);
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