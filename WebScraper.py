import requests
import httpx
import schedule
import time
import os
import json
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
import shutil
from subprocess import run, CalledProcessError
import socket
import time

urls = {
    "galileo": {
        "url": "https://celestrak.com/NORAD/elements/galileo.txt",
        "interval_hours": 48,
        "save_directory": Path("site") / "public" / "sv_data" / "galileo_data"
    },
    "gps": {
        "url": "https://navcen.uscg.gov/sites/default/files/gps/almanac/current_yuma.alm",
        "interval_hours": 48,
        "save_directory": Path("site") / "public" / "sv_data" / "gps_data"
    },
    "glonass": {
        "url": "https://celestrak.org/NORAD/elements/glo-ops.txt",
        "interval_hours": 48,
        "save_directory": Path("site") / "public" / "sv_data" / "glonass_data"
    },
    "qzss": {
        "url": "https://sys.qzss.go.jp/dod/api/get/almanac",
        "interval_hours": 48,
        "save_directory": Path("site") / "public" / "sv_data" / "qzss_data"
    },
    "qzss_ephemeris": {
        "url": "https://sys.qzss.go.jp/dod/api/get/ephemeris",
        "interval_hours": 48,
        "save_directory": Path("site") / "public" / "sv_data" / "qzss_ephemeris_data"
    },
    "beidou": {
        "url": "https://celestrak.com/NORAD/elements/beidou.txt",
        "interval_hours": 48,
        "save_directory": Path("site") / "public" / "sv_data" / "beidou_data"
    },
    "gps_block_type": {
        "url": "https://www.navcen.uscg.gov/gps-constellation",
        "interval_hours": 144,
        "save_directory": Path("site") / "public" / "sv_data" / "gps_block_type_data"
    }
    
}


def wait_for_network(timeout=60, interval=5):
    """
    Waits for the network to be available.

    :param timeout: Maximum time to wait for the network (in seconds).
    :param interval: Time between checks (in seconds).
    """
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            # Try connecting to a public server (Google's DNS)
            socket.create_connection(("8.8.8.8", 53), timeout=2)
            print("Network is available.")
            return True
        except (socket.timeout, socket.error):
            print("Waiting for network...")
            time.sleep(interval)
    print("Network not available after waiting.")
    return False


def copy_to_apache(full_copy=True, constellation_name=None):
    """
    Copies the /site/public/sv_data directory or a specific constellation's directory
    into /var/www/html/sv_data.

    :param full_copy: Whether to copy the entire sv_data directory (default: True).
    :param constellation_name: The specific constellation directory to copy (if full_copy=False).
    """
    # Define paths
    source_path = Path("site") / "public" / "sv_data"
    destination_path = Path("/var/www/html/sv_data")
    
    try:
        if full_copy:
            # Ensure source path exists
            if not source_path.exists():
                print(f"Source path {source_path} does not exist. Skipping copy.")
                return

            # Copy the entire directory
            print(f"Copying {source_path} to {destination_path}...")
            shutil.copytree(source_path, destination_path, dirs_exist_ok=True)

        else:
            # Copy only the relevant constellation's directory
            if not constellation_name:
                print("No constellation specified for partial copy. Skipping.")
                return

            specific_source = source_path / f"{constellation_name}_data"
            specific_destination = destination_path / f"{constellation_name}_data"

            # Ensure the specific source path exists
            if not specific_source.exists():
                print(f"Source path {specific_source} does not exist. Skipping.")
                return

            print(f"Copying {specific_source} to {specific_destination}...")
            shutil.copytree(specific_source, specific_destination, dirs_exist_ok=True)

        print("Data successfully copied to Apache server!")

    except FileNotFoundError as e:
        print(f"File not found during copy: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


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
        elif "SQRT(A)" in line:
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

# Function to fetch the data from block-type page and parse the data
def fetch_and_parse_block_type(url):
    headers = {
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
    }
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # Find the table and ensure it's found
    table = soup.find("table", {"class": "table table-striped views-table views-view-table cols-10"})
    #print(table.prettify())
    # Parse the table rows and columns
    data = []
    # Iterate over the rows in the tbody (skipping the header in thead)
    rows = table.find("tbody").find_all("tr")
    
    for row in rows:
        # Get all the columns in the current row
        columns = row.find_all("td")

        # Extract the relevant fields based on the order of the columns
        row_data = {
            "prn": columns[3].get_text(strip=True),
            "block_type": columns[4].get_text(strip=True)
        }

        # Append the row data to the list
        data.append(row_data)

    sorted_data = sorted(data, key=lambda x: int(x["prn"]))
    #print(sorted_data)

    return sorted_data
def save_to_manifest(file_name, constellation_name):
    # Define the path to the manifest file
    manifest_path = Path("site") / "public" / "sv_data" / f"{constellation_name}_data" / "manifest.json"
    
    # Ensure the directory exists
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    # Load the existing manifest or initialize it as an empty list
    if manifest_path.exists():
        with open(manifest_path, "r") as file:
            manifest = json.load(file)
    else:
        manifest = []

    # Append the new file name to the manifest list
    manifest.append(file_name)

    # Write the updated manifest back to the file
    with open(manifest_path, "w") as file:
        json.dump(manifest, file, indent=4)

    print(f"File '{file_name}' added to manifest for constellation '{constellation_name}'.")

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
        if name in [ "galileo", "glonass", "beidou" ]:
            parsed_data = parse_tle(content)
        elif name in ["gps", "qzss"]:
            parsed_data = parse_almanac(content)
        elif name in ["gps_block_type"]:
            parsed_data = fetch_and_parse_block_type(url)
        else:
            parsed_data = {
                "name": name,
                "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
                "url": url,
                "content": content
            }
        current_datetime = datetime.now()
        epoch_seconds = int(current_datetime.timestamp())
        if "_" not in name:
            # Generate a unique filename for each constellation
            file_name = f"{name}_{epoch_seconds}.json"
            # Call save_to_manifest with the correct parameters
            save_to_manifest(file_name, name)
        else:
            # Save the parsed JSON to the designated directory
            file_name = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        file_path = os.path.join(save_directory, file_name)
        try:
            with open(file_path, "w") as file:
                json.dump(parsed_data, file, indent=4)
        except Exception as e:
            print(f"Error writing JSON file: {e}")

        print(f"Saved {name} data to {file_path}")
        #copy over to apache location for hosting
        copy_to_apache(full_copy=False, constellation_name=name)

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

if __name__ == "__main__":
    # Wait for server to connect to internet before scraping
    print("Starting script to gather MGNSS data. . . ")
    print("Waiting for netowrk ...")
    while not wait_for_network():
        pass
    print("CONNECTED!")
    # We want it to get new almanac immediately on startup
    test_scraping()

    # Start the scheduled tasks
    schedule_tasks()
