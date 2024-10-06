import requests
import httpx
import schedule
import time
import os
import json
from datetime import datetime

urls = {
    "galileo": {
        "url": "https://celestrak.com/NORAD/elements/galileo.txt",
        "interval_hours": 1,
        "save_directory": "Github\msgct\server\Galilio_Data"
    },
    "GPS": {
        "url": "https://navcen.uscg.gov/sites/default/files/gps/almanac/current_yuma.alm",
        "interval_hours": 1,
        "save_directory": "Github\msgct\server\GPS_Data"
    },
    "glonass": {
        "url": "https://celestrak.org/NORAD/elements/glo-ops.txt",
        "interval_hours": 1,
        "save_directory": "Github\msgct\server\GLONASS_Data"
    },
    "qzss_almanac": {
        "url": "https://sys.qzss.go.jp/dod/api/get/almanac",
        "interval_hours": 1,
        "save_directory": "Github\msgct\server\QZSS_Almanac_Data"
    },
    "qzss_ephemeris": {
        "url": "https://sys.qzss.go.jp/dod/api/get/ephemeris",
        "interval_hours": 1,
        "save_directory": "Github\msgct\server\QZSS_Ephemeris_Data"
    }
}

def find_current_satellite_week_number():
    # Define the GPS epoch start date (January 6, 1980)
    gps_epoch_start = datetime(1980, 1, 6)
    
    # Get the current date in UTC
    current_date = datetime.utcnow()
    
    # Calculate the difference in days between the current date and the GPS epoch start
    delta = current_date - gps_epoch_start
    
    # Calculate the total GPS week number
    total_weeks = delta.days // 7
    
    # Account for the rollover (1024-week period)
    current_week_number = total_weeks % 1024
    
    return current_week_number

# Parsing function for TLE data
def parse_tle(content):
    week = find_current_satellite_week_number()
    satellites = []
    lines = content.splitlines()

    for i in range(0, len(lines), 3):
        if i + 2 >= len(lines):
            break

        satellite_name = lines[i].strip()
        line1 = lines[i + 1].strip()
        line2 = lines[i + 2].strip()

        if line1.startswith('1') and line2.startswith('2'):
            tle_data = {
                "Name": satellite_name,
                "Line1": line1,
                "Line2": line2,
                "SatelliteNumber": line1[2:7].strip(),
                "Classification": line1[7].strip(),
                "LaunchYear": line1[9:11].strip(),
                "LaunchNumber": line1[11:14].strip(),
                "PieceOfLaunch": line1[14:17].strip(),
                "EpochYear": line1[18:20].strip(),
                "EpochDay": float(line1[20:32].strip()),
                "FirstDerivativeMeanMotion": float(line1[33:43].strip()),
                "SecondDerivativeMeanMotion": line1[44:52].strip(),
                "BSTAR": line1[53:61].strip(),
                "SetNumber": line1[64:68].strip(),
                "Inclination": float(line2[8:16].strip()),
                "RAAN": float(line2[17:25].strip()),
                "Eccentricity": float("0." + line2[26:33].strip()),
                "ArgumentOfPerigee": float(line2[34:42].strip()),
                "MeanAnomaly": float(line2[43:51].strip()),
                "MeanMotion": float(line2[52:63].strip()),
                "RevolutionNumber": line2[63:68].strip()
            }
            satellites.append(tle_data)

    return {"week": week, "satellites": satellites}

# Common parsing function to handle all almanac files
def parse_almanac(content):
    week = find_current_satellite_week_number()
    satellites = []
    lines = content.splitlines()
    current_satellite = {}

    for line in lines:
        if line.startswith("ID:"):
            if current_satellite:
                satellites.append(current_satellite)
            current_satellite = {"ID": line.split(":")[1].strip()}
        elif "Health" in line:
            current_satellite["Health"] = line.split(":")[1].strip()
        elif "Eccentricity" in line:
            current_satellite["Eccentricity"] = float(line.split(":")[1].strip())
        elif "Time of Applicability(s)" in line:
            current_satellite["TimeOfApplicability"] = float(line.split(":")[1].strip())
        elif "Orbital Inclination(rad)" in line:
            current_satellite["OrbitalInclination"] = float(line.split(":")[1].strip())
        elif "Rate of Right Ascen(r/s)" in line:
            current_satellite["RateOfRightAscen"] = float(line.split(":")[1].strip())
        elif "SQRT A  (m 1/2)" in line:
            current_satellite["SQRT_A"] = float(line.split(":")[1].strip())
        elif "Right Ascen at Week(rad)" in line:
            current_satellite["RightAscenAtWeek"] = float(line.split(":")[1].strip())
        elif "Argument of Perigee(rad)" in line:
            current_satellite["ArgumentOfPerigee"] = float(line.split(":")[1].strip())
        elif "Mean Anom(rad)" in line:
            current_satellite["MeanAnom"] = float(line.split(":")[1].strip())
        elif "Af0(s)" in line:
            current_satellite["Af0"] = float(line.split(":")[1].strip())
        elif "Af1(s/s)" in line:
            current_satellite["Af1"] = float(line.split(":")[1].strip())

    if current_satellite:
        satellites.append(current_satellite)

    return {"week": week, "satellites": satellites}

# Function to fetch data and save to files in JSON format
def fetch_and_save(name, url, save_directory):
    try:
        # Special handling for QZSS API to get the latest available data using httpx
        if name.startswith("qzss"):
            with httpx.Client(verify=False) as client:
                response = client.get(url)
            response.raise_for_status()
            content = response.content.decode()  # Assuming response is text

        else:
            response = requests.get(url)
            response.raise_for_status()
            content = response.text

        # Ensure the save directory exists
        os.makedirs(save_directory, exist_ok=True)

        # Parse the content into JSON-like structure based on data source
        if name in [ "galileo", "glonass"]:
            parsed_data = parse_tle(content)
        elif name in ["GPS", "qzss_almanac"]:
            parsed_data = parse_almanac(content)
        else:
            parsed_data = {
                "name": name,
                "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
                "url": url,
                "content": content
            }

        # Save the parsed JSON to the designated directory
        file_name = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        file_path = os.path.join(save_directory, file_name)
        with open(file_path, "w") as file:
            json.dump(parsed_data, file, indent=4)

        print(f"Saved {name} data to {file_path}")

    except (requests.exceptions.RequestException, httpx.RequestError, json.JSONDecodeError) as e:
        # Log error to file and print to console
        os.makedirs("ErrorLogs", exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        error_log_path = os.path.join("ErrorLogs", f"{name}_{timestamp}.json")

        error_data = {
            "name": name,
            "timestamp": timestamp,
            "error": str(e)
        }

        with open(error_log_path, "w") as file:
            json.dump(error_data, file, indent=4)

        print(f"Failed to fetch {name}: {e}")

# Function to schedule each task based on its interval
def schedule_tasks():
    for name, details in urls.items():
        schedule.every(details['interval_hours']).hours.do(fetch_and_save, name, details['url'], details['save_directory'])
        print(f"Scheduled {name} to run every {details['interval_hours']} hours, saving to {details['save_directory']}.")

    # Keep the script running
    while True:
        schedule.run_pending()
        time.sleep(1)

# Function to test the scraping immediately without waiting for scheduled intervals
def test_scraping():
    print("Testing scraping functionality...")
    for name, details in urls.items():
        fetch_and_save(name, details['url'], details['save_directory'])

# Uncomment the line below to test the scraping functionality immediately
test_scraping()

# Uncomment the line below to start the scheduled tasks
# schedule_tasks()
