import requests
import schedule
import time
import os
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
    "qzss": {
        "url": "https://sys.qzss.go.jp/archives/almanac/2024/q2024259.alm",
        "interval_hours": 1,  # Set the interval in hours
        "save_directory": "QZSS_Data"  # Set the save directory
    }
}

# Function to fetch data and save to files
def fetch_and_save(name, url, save_directory):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Check if the request was successful
        content = response.text

        # Ensure the save directory exists
        os.makedirs(save_directory, exist_ok=True)

        # Create a timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"{name}_{timestamp}.txt"
        file_path = os.path.join(save_directory, file_name)

        # Save the content to the designated directory
        with open(file_path, "w") as file:
            file.write(content)
        print(f"Saved {name} data to {file_path}")
    except requests.exceptions.RequestException as e:
        # Send an Error message to console and Error Log folder
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"{name}_{timestamp}.txt"
        file_path = os.path.join("ErrorLogs", file_name)
        with open(file_path, "w") as file:
            file.write(f"Failed to fetch {name} at {timestamp}: {e}")
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
#schedule_tasks()
