//-------------------------------------
// Retreiving Almanac Data from Server
//-------------------------------------
const fetchFileByFilename = async (filename, directory) => {
  const url = `/sv_data/${directory}/${filename}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch file: ${url}`, error);
    return [];
  }
};


export async function fetchAlmanacByFilename(filename, directory) {
  return fetchFileByFilename(filename, `${directory}_data`);
}

export async function fetchBlockByFilename(filename) {
  return fetchFileByFilename(filename, 'gps_block_type_data');
}
