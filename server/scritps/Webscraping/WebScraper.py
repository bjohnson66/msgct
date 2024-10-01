import requests
import httpx
import schedule
import time
import os
import json
from datetime import datetime

# List of URLs with their corresponding fetch intervals in hours and save directories
urls = {
    "galileo": {
        "url": "https://celestrak.com/NORAD/elements/galileo.txt",
        "interval_hours": 1,  # Set the interval in hours
        "save_directory": "Galilio_Data"  # Set the save directory
    },
    "GPS": {
        "url": "https://navcen.uscg.gov/sites/default/files/gps/almanac/current_yuma.alm",
        "interval_hours": 1,  # Set the interval in hours
        "save_directory": "GPS_Data"  # Set the save directory
    },
    "glonass": {
        "url": "https://celestrak.org/NORAD/elements/glo-ops.txt",
        "interval_hours": 1,  # Set the interval in hours
        "save_directory": "GLONASS_Data"  # Set the save directory
    },
    "qzss_almanac": {
        "url": "https://sys.qzss.go.jp/dod/api/get/almanac",
        "interval_hours": 1,
        "save_directory": "QZSS_Almanac_Data"
    },
    "qzss_ephemeris": {
        "url": "https://sys.qzss.go.jp/dod/api/get/ephemeris",
        "interval_hours": 1,
        "save_directory": "QZSS_Ephemeris_Data"
    }
}

# Function to fetch data and save to files in JSON format
def fetch_and_save(name, url, save_directory):
    try:
        # Special handling for QZSS API to get the latest available data using httpx
        if name.startswith("qzss"):
            with httpx.Client(verify=False) as client:
                response = client.get(url)
            response.raise_for_status()

            # Extracting the filename from Content-Disposition header
            content_disposition = response.headers.get('Content-Disposition', '')
            if 'filename=' in content_disposition:
                file_name = content_disposition.split("filename=")[-1].strip()
            else:
                # If filename is not provided, generate a default name
                file_name = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.dat"

            content = response.content

        else:
            # For other URLs, use the default requests settings
            response = requests.get(url)
            response.raise_for_status()
            content = response.text
            file_name = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        # Ensure the save directory exists
        os.makedirs(save_directory, exist_ok=True)
        file_path = os.path.join(save_directory, file_name)

        # Save the content to the designated directory
        if name.startswith("qzss"):
            with open(file_path, "wb") as file:
                file.write(content)
        else:
            data = {
                "name": name,
                "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
                "url": url,
                "content": content
            }
            with open(file_path, "w") as file:
                json.dump(data, file, indent=4)

        print(f"Saved {name} data to {file_path}")

    except (requests.exceptions.RequestException, httpx.RequestError) as e:
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
        # Schedule each task with its specific interval and save directory
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
