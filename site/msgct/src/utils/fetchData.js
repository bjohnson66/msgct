//-------------------------------------
// Retreiving Almanac Data from Server
//-------------------------------------
const fetchFileByFilename = async (filename, directory) => {
  try {
      const response = await fetch(`/sv_data/${directory}/${filename}`);
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

export async function fetchAlmanacByFilename(filename, directory) {
  return fetchFileByFilename(filename, `${directory}_data`);
}

export async function fetchBlockByFilename(filename) {
  return fetchFileByFilename(filename, 'gps_block_type_data');
}
