import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Container, Typography, Box, Button, TextField, Select, MenuItem } from '@mui/material';
import GPSSatelliteTable from './GPSSatelliteTable';

function SerialPortComponent({ onPositionUpdate }) {
  const [ports, setPorts] = useState([]); // Available serial ports
  const [selectedPort, setSelectedPort] = useState(null); // Selected COM port
  const [serialData, setSerialData] = useState(''); // Raw serial data to display
  const [isPortOpen, setIsPortOpen] = useState(false); // Track if port is open
  const [serialTableData, setSerialTableData] = useState([]); // Data for the table
  const [selectedSatellites, setSelectedSatellites] = useState({}); // State for selected satellites

  const readerRef = useRef(null);
  const bufferRef = useRef(''); // Buffer to store incoming data
  const readableStreamClosedRef = useRef(null); // Reference to the readableStreamClosed promise

  // Timer reference for updating the table every 4 seconds
  const timerRef = useRef(null);

  // Request available ports on page load
  useEffect(() => {
    async function getPorts() {
      if ('serial' in navigator) {
        try {
          const availablePorts = await navigator.serial.getPorts();
          setPorts(availablePorts);
        } catch (error) {
          console.error('Error accessing serial ports:', error);
        }
      }
    }
    getPorts();
  }, []);

  // Function to handle selecting a port
  const handlePortSelection = async (event) => {
    const selectedPort = event.target.value;
    setSelectedPort(selectedPort);
  };

  // Function to start reading from the selected port
  const handleStartReading = async () => {
    if (selectedPort) {
      try {
        await selectedPort.open({ baudRate: 9600 }); // Open the port with the required baud rate
        setIsPortOpen(true);

        selectedPort.addEventListener('disconnect', () => {
          handlePortDisconnect().catch((error) => {
            console.error('Error during port disconnect:', error);
          });
        });

        const textDecoder = new TextDecoderStream();
        readableStreamClosedRef.current = selectedPort.readable.pipeTo(textDecoder.writable);
        readableStreamClosedRef.current.catch((error) => {
          console.error('Error with readableStreamClosed:', error);
        });

        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;

        const readLoop = async () => {
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                break; // Exit the loop when no more data
              }
              if (value) {
                bufferRef.current += value;
                setSerialData((prevData) => prevData + value); // Update the serialData text field
              }
            }
          } catch (error) {
            console.error('Error reading from serial port:', error);
          } finally {
            if (reader) {
              try {
                reader.releaseLock();
              } catch (error) {
                console.error('Error releasing reader lock:', error);
              }
            }
          }
        };

        readLoop();

        // Start the timer to update the table every 2 seconds
        timerRef.current = setInterval(() => {
          processSerialData();
        }, 2000);
      } catch (error) {
        console.error('Error opening serial port:', error);
      }
    }
  };

  // Function to request a new serial port
  const handleRequestPort = async () => {
    if ('serial' in navigator) {
      try {
        const port = await navigator.serial.requestPort(); // User selects a port from the browser dialog
        setPorts((prevPorts) => [...prevPorts, port]); // Add new port to the list
        setSelectedPort(port);
      } catch (error) {
        console.error('Error requesting serial port:', error);
      }
    }
  };

  // Function to handle port disconnection
  const handlePortDisconnect = useCallback(async () => {
    console.log('Serial port disconnected');
    setIsPortOpen(false);

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
      } catch (error) {
        console.error('Error handling reader on disconnect:', error);
      }
    }

    if (readableStreamClosedRef.current) {
      try {
        await readableStreamClosedRef.current;
      } catch (error) {
        console.error('Error with readableStreamClosed during disconnect:', error);
      }
    }

    if (selectedPort) {
      try {
        await selectedPort.close();
      } catch (error) {
        console.error('Error closing port:', error);
      }
      selectedPort.removeEventListener('disconnect', handlePortDisconnect);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [selectedPort, readerRef, timerRef]);

  // Function to disconnect from the serial port
  const handleDisconnect = async () => {
    try {
      await handlePortDisconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (selectedPort) {
          selectedPort.removeEventListener('disconnect', handlePortDisconnect);
        }
        if (readerRef.current) {
          try {
            await readerRef.current.cancel();
            readerRef.current.releaseLock();
          } catch (error) {
            console.error('Error releasing reader lock during cleanup:', error);
          }
        }

        if (readableStreamClosedRef.current) {
          try {
            await readableStreamClosedRef.current;
          } catch (error) {
            console.error('Error with readableStreamClosed during cleanup:', error);
          }
        }

        if (selectedPort && selectedPort.readable) {
          try {
            await selectedPort.close();
          } catch (error) {
            console.error('Error closing port during cleanup:', error);
          }
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      cleanup().catch((error) => {
        console.error('Error during cleanup:', error);
      });
    };
  }, [handlePortDisconnect, selectedPort]);

  // Function to process serial data and update the table
  const processSerialData = () => {
    const data = bufferRef.current;
    bufferRef.current = ''; // Clear the buffer after processing

    // Split the data into lines
    const lines = data.split('\n');

    // Use an object to store satellites by PRN to prevent duplicates
    const satellitesByID = {};

    lines.forEach((line) => {
      line = line.trim();
      if (
        line.startsWith('$GPGSV') ||
        line.startsWith('$GLGSV') ||
        line.startsWith('$GAGSV') ||
        line.startsWith('$BDGSV')
      ) {
        // Parse GSV sentences
        const satelliteInfo = parseGSV(line);
        if (satelliteInfo && satelliteInfo.length > 0) {
          satelliteInfo.forEach((satellite) => {
            satellitesByID[satellite.ID] = satellite; // Overwrite if PRN already exists
          });
        }
      } else if (
        line.startsWith('$GPGGA') ||
        line.startsWith('$GLGGA') ||
        line.startsWith('$GAGGA') ||
        line.startsWith('$BDGGA')
      ) {
        // Parse GGA sentences
        const positionInfo = parseGGA(line);
        if (positionInfo && onPositionUpdate) {
          onPositionUpdate(positionInfo);
        }
      }
    });

    let parsedData = Object.values(satellitesByID);

    parsedData.sort((a, b) => {
      const idA = parseInt(a.ID, 10);
      const idB = parseInt(b.ID, 10);
      return idA - idB;
    });

    if (parsedData.length > 0) {
      // Update selectedSatellites state
      setSelectedSatellites((prevSelected) => {
        const newSelected = { ...prevSelected };
        parsedData.forEach((sat) => {
          if (!(sat.ID in newSelected)) {
            newSelected[sat.ID] = true; // Default to true (checked)
          }
        });
        return newSelected;
      });

      setSerialTableData(parsedData); // Replace the state with deduplicated data
    }
  };

  // Function to parse GSV sentences
  const parseGSV = (sentence) => {
    const fields = sentence.split(',');

    if (fields.length < 4) {
      console.error('Invalid GSV sentence:', sentence);
      return [];
    }

    const satellites = [];

    // Parse satellites data from GSV sentence
    for (let i = 4; i + 3 < fields.length; i += 4) {
      const prn = fields[i];
      const elevation = fields[i + 1];
      const azimuth = fields[i + 2];
      const snr = fields[i + 3];

      if (prn) {
        satellites.push({
          ID: prn.trim(),                   // Change 'prn' to 'ID' to match GPSSatelliteTable
          elevation: parseFloat(elevation) || 0,  // Ensure numeric values are passed
          azimuth: parseFloat(azimuth) || 0,
          snr: parseFloat(snr) || 0,             // Change to 'snr' to match table
          health: "000", // Assuming default health status
        });
      }
    }

    return satellites;
  };

  // Function to parse GGA sentences
  const parseGGA = (sentence) => {
    // GGA - Global Positioning System Fix Data
    const fields = sentence.split(',');
    if (fields.length < 15) {
      console.error('Invalid GGA sentence:', sentence);
      return null;
    }
    const latField = fields[2];
    const latHemisphere = fields[3];
    const lonField = fields[4];
    const lonHemisphere = fields[5];
    const altitude = parseFloat(fields[9]);

    const lat = convertNMEACoordinateToDecimal(latField, latHemisphere);
    const lon = convertNMEACoordinateToDecimal(lonField, lonHemisphere);

    return {
      lat,
      lon,
      alt: altitude,
    };
  };

  // Helper function to convert NMEA coordinates to decimal degrees
  const convertNMEACoordinateToDecimal = (coordinate, hemisphere) => {
    if (!coordinate || coordinate.length < 3) {
      return null;
    }
    const dotIndex = coordinate.indexOf('.');
    const degreesLength = dotIndex > 2 ? dotIndex - 2 : 2;
    const degrees = parseInt(coordinate.slice(0, degreesLength), 10);
    const minutes = parseFloat(coordinate.slice(degreesLength));

    let decimalDegrees = degrees + minutes / 60;
    if (hemisphere === 'S' || hemisphere === 'W') {
      decimalDegrees *= -1;
    }
    return decimalDegrees;
  };

  return (
    <Container style={{ marginTop: '20px' }}>
      <Typography variant="h6">Serial Port Reader</Typography>
      <Box sx={{ mt: 2 }}>
        {/* Dropdown to select COM port */}
        <Select
          value={selectedPort || ''}
          onChange={handlePortSelection}
          displayEmpty
          fullWidth
          variant="outlined"
        >
          <MenuItem value="">
            <em>Select a COM port</em>
          </MenuItem>
          {ports.map((port, index) => (
            <MenuItem key={index} value={port}>
              Port {index + 1} {/* You can customize this to show actual port info */}
            </MenuItem>
          ))}
        </Select>

        {/* Button to request a new port */}
        <Button variant="contained" color="secondary" onClick={handleRequestPort} sx={{ mt: 2 }}>
          Request a COM Port
        </Button>

        {/* Button to start reading from the selected COM port */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleStartReading}
          sx={{ mt: 2 }}
          disabled={isPortOpen || !selectedPort} // Disable button if port is already open or not selected
        >
          Start Reading
        </Button>

        {/* Button to disconnect from the serial port */}
        <Button
          variant="contained"
          color="error"
          onClick={handleDisconnect}
          sx={{ mt: 2 }}
          disabled={!isPortOpen} // Disable button if port is not open
        >
          Disconnect
        </Button>

        {/* Text field to display serial data */}
        <TextField
          multiline
          rows={6}
          fullWidth
          value={serialData}
          sx={{ mt: 2 }}
          variant="outlined"
          label="Serial Data"
        />

        {/* Table to display parsed serial data */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Parsed Satellite Data
          </Typography>
          <GPSSatelliteTable
            tableSatellites={serialTableData}
            selectedSatellites={selectedSatellites}
            setSelectedSatellites={setSelectedSatellites}
          />
        </Box>
      </Box>
    </Container>
  );
}

export default SerialPortComponent;
