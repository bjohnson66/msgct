import re
import math
from datetime import datetime, timezone, timedelta

# Earth's gravitational constant
mu = 3.986005e14  # m^3/s^2, using WGS-84 value
omega_e = 7.2921151467e-5  # Earth's rotation rate (rad/s)

# Parsing function
def parse_almanac_file(file_path):
    almanac_list = []
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

    # Open the file and read the lines
    with open(file_path, 'r') as file:
        lines = file.readlines()

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

# Kepler's equation solver for eccentric anomaly
def calculate_eccentric_anomaly(M, e, tolerance=1e-10, max_iter=100):
    E = M  # Initial guess
    for _ in range(max_iter):
        delta_E = (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
        E -= delta_E
        if abs(delta_E) < tolerance:
            break
    else:
        raise RuntimeError("Kepler's equation did not converge")
    return E

def calculate_true_anomaly(E, e):
    sin_v = (math.sqrt(1 - e ** 2) * math.sin(E)) / (1 - e * math.cos(E))
    cos_v = (math.cos(E) - e) / (1 - e * math.cos(E))
    v = math.atan2(sin_v, cos_v)
    return v

# Corrected calculation function
def calculate_satellite_position(satellite_data):
    # Extract parameters from satellite_data
    SQRT_A = satellite_data['SQRT(A)']
    M0 = satellite_data['Mean Anomaly']  # Mean Anomaly at reference time (in radians)
    e = satellite_data['Eccentricity']
    Omega0 = satellite_data['Right Ascension at Week']  # Omega0 (in radians)
    Omega_dot = satellite_data['Rate of Right Ascension']  # Rate of right ascension (rad/s)
    t0 = satellite_data['Time of Applicability']  # t0 (seconds into GPS week)
    i = satellite_data['Orbital Inclination']  # Inclination (radians)
    w = satellite_data['Argument of Perigee']  # Argument of perigee (radians)
    week = satellite_data['week']  # GPS week number

    # Earth's rotation rate
    omega_e = 7.2921151467e-5  # rad/s

    # Set current time t (e.g., 1 hour after t0)
    t = t0 + 3600  # Time in seconds into GPS week
    delta_t = t - t0  # delta_t = 3600 seconds

    # Calculations for semi-major axis, mean motion, and mean anomaly
    a = SQRT_A ** 2
    n0 = math.sqrt(mu / a ** 3)  # Computed mean motion (rad/s)
    n = n0  # Almanac does not provide delta_n
    M = M0 + n * delta_t  # Mean anomaly at time t
    M = M % (2 * math.pi)  # Normalize M

    # Solve Kepler's equation for Eccentric Anomaly E
    E = calculate_eccentric_anomaly(M, e)

    # Calculate true anomaly
    v = calculate_true_anomaly(E, e)

    # Calculate argument of latitude
    u = v + w  # Argument of latitude
    u = u % (2 * math.pi)  # Normalize u

    # Calculate radius
    r = a * (1 - e * math.cos(E))

    # Corrected longitude of ascending node
    Omega = Omega0 + (Omega_dot - omega_e) * delta_t
    Omega = Omega % (2 * math.pi)  # Normalize Omega

    # Compute ECEF coordinates using standard formulas
    sin_u = math.sin(u)
    cos_u = math.cos(u)
    sin_i = math.sin(i)
    cos_i = math.cos(i)
    sin_Omega = math.sin(Omega)
    cos_Omega = math.cos(Omega)

    X = r * (cos_u * cos_Omega - sin_u * sin_Omega * cos_i)
    Y = r * (cos_u * sin_Omega + sin_u * cos_Omega * cos_i)
    Z = r * (sin_u * sin_i)

    return X, Y, Z

def calculate_long_latitude_altitude(X, Y, Z):
    # WGS-84 ellipsoid constants
    a = 6378137.0  # Semi-major axis in meters
    f = 1 / 298.257223563  # Flattening
    e2 = f * (2 - f)  # Square of eccentricity

    # Calculate longitude in radians
    longitude = math.atan2(Y, X)

    # Calculate preliminary latitude in radians
    p = math.sqrt(X ** 2 + Y ** 2)
    theta = math.atan2(Z * a, p * (1 - f) * a)
    sin_theta = math.sin(theta)
    cos_theta = math.cos(theta)

    # Calculate latitude in radians
    latitude = math.atan2(Z + e2 * (1 - f) * a * sin_theta ** 3,
                          p - e2 * a * cos_theta ** 3)

    # Calculate altitude
    N = a / math.sqrt(1 - e2 * math.sin(latitude) ** 2)
    altitude = p / math.cos(latitude) - N

    # Convert latitude and longitude to degrees
    latitude = math.degrees(latitude)
    longitude = math.degrees(longitude)

    return longitude, latitude, altitude

# Example usage
file_path = 'GPS_DATA/current_yuma.alm'
data = parse_almanac_file(file_path)

for satellite in data:
    try:
        X, Y, Z = calculate_satellite_position(satellite)
        longitude, latitude, altitude = calculate_long_latitude_altitude(X, Y, Z)
        print(f"Satellite ID {satellite['ID']}:")
        print(f"ECEF Coordinates: X = {X}, Y = {Y}, Z = {Z}")
        print(f"Geodetic Coordinates: Longitude = {longitude}, Latitude = {latitude}, Altitude = {altitude}")
    except Exception as e:
        print(f"Error calculating position for satellite {satellite['ID']}: {e}")
