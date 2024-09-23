import re

def parse_almanac_file(file_path):
    # List to store the extracted data for each satellite
    almanac_list = []

    # Open the file and read the lines
    with open(file_path, 'r') as file:
        lines = file.readlines()

    # Regular expressions to match each parameter
    patterns = {
        'ID': r'ID:\s*(\d+)',
        'Health': r'Health:\s*(\d+)',
        'Eccentricity': r'Eccentricity:\s*([\d.E+-]+)',
        'Time of Applicability': r'Time of Applicability\(s\):\s*([\d.E+-]+)',
        'Orbital Inclination': r'Orbital Inclination\(rad\):\s*([\d.E+-]+)',
        'Rate of Right Ascension': r'Rate of Right Ascen\(r/s\):\s*([\d.E+-]+)',
        'SQRT(A)': r'SQRT\(A\)\s*\(m 1/2\):\s*([\d.E+-]+)',
        'Right Ascension at Week': r'Right Ascen at Week\(rad\):\s*([\d.E+-]+)',
        'Argument of Perigee': r'Argument of Perigee\(rad\):\s*([\d.E+-]+)',
        'Mean Anomaly': r'Mean Anom\(rad\):\s*([\d.E+-]+)',
        'Af0': r'Af0\(s\):\s*([\d.E+-]+)',
        'Af1': r'Af1\(s/s\):\s*([\d.E+-]+)',
        'week': r'week:\s*(\d+)'
    }

    # Initialize a dictionary to hold data for the current satellite
    satellite_data = {}

    # Iterate over the lines and extract data based on the patterns
    for line in lines:
        # Check for the start of a new satellite data block
        if line.strip().startswith('********'):
            if satellite_data:
                # Append the current satellite data to the list
                almanac_list.append(satellite_data)
                satellite_data = {}
            continue  # Skip the separator line

        for key, pattern in patterns.items():
            match = re.search(pattern, line)
            if match:
                satellite_data[key] = match.group(1)

    # Append the last satellite data after the loop
    if satellite_data:
        almanac_list.append(satellite_data)

    # Convert numeric values to appropriate types
    for satellite in almanac_list:
        for key in satellite:
            try:
                value = satellite[key]
                satellite[key] = float(value) if '.' in value or 'E' in value else int(value)
            except ValueError:
                pass  # Keep the value as a string if conversion fails

    return almanac_list

# Example usage
file_path = 'GPS_DATA/current_yuma.alm'
data = parse_almanac_file(file_path)
for satellite in data:
    print(satellite)
