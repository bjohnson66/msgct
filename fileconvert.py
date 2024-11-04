import os
from datetime import datetime

def convert_and_rename_files():
    # Get the current working directory
    directory = os.getcwd()
    
    # Get the name of this script file
    script_name = os.path.basename(__file__)

    # List all files in the current directory
    for filename in os.listdir(directory):
        # Skip the script file itself
        if filename == script_name:
            continue
        
        # Check if the filename matches the expected format
        if filename.startswith("qzss_almanac_") and filename.endswith(".json"):
            try:
                # Extract date and time from the filename
                name_parts = filename.split('_')
                date_str = name_parts[2]  # YYYYMMDD
                time_str = name_parts[3].split('.')[0]  # HHMMSS

                # Convert to datetime object in UTC
                dt = datetime.strptime(f"{date_str}{time_str}", "%Y%m%d%H%M%S")
                
                # Convert to epoch time (UTC)
                epoch_seconds = int(dt.timestamp())
                
                # Construct the new filename
                new_filename = f"qzss_almanac_{epoch_seconds}.json"
                
                # Rename the file
                os.rename(filename, new_filename)
                print(f"Renamed {filename} to {new_filename}")
                
            except Exception as e:
                print(f"Error processing filename {filename}: {e}")

# Run the function
if __name__ == "__main__":
    convert_and_rename_files()
