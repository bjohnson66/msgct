import React, { useEffect, useState, useRef, useCallback } from 'react';
import {Container, Typography, Box, Button, TextField, Select, MenuItem,} from '@mui/material';
import GPSSatelliteTable from './GPSSatelliteTable';
import { parseGSV, parseGGA } from './NMEAParser'; // Import parseGSV and parseGGA

function SerialPortComponent({ onPositionUpdate }) {
  const [ports, setPorts] = useState([]); // Array of { port, name }
  const [selectedPortInfo, setSelectedPortInfo] = useState(null); // Selected port info object
  const [serialData, setSerialData] = useState(''); // Raw serial data to display
  const [isPortOpen, setIsPortOpen] = useState(false); // Track if port is open
  const [serialTableData, setSerialTableData] = useState([]); // Data for the table
  const [selectedSatellites, setSelectedSatellites] = useState({}); // State for selected satellites

  const readerRef = useRef(null);
  const bufferRef = useRef(''); // Buffer to store incoming data
  const readableStreamClosedRef = useRef(null); // Reference to the readableStreamClosed promise

  // Request available ports on page load
  useEffect(() => {
    async function getPorts() {
      if ('serial' in navigator) {
        try {
          const availablePorts = await navigator.serial.getPorts();
          const portsWithInfo = await Promise.all(
            availablePorts.map(async (port) => {
              const info = port.getInfo();
              let name = 'Unknown Device';

              // Attempt to use product and manufacturer strings
              if (info.usbVendorId && info.usbProductId) {
                const vendorId = info.usbVendorId.toString(16).padStart(4, '0');
                const productId = info.usbProductId.toString(16).padStart(4, '0');
                name = `USB Device (${vendorId}, ${productId})`;
              }

              return { port, name };
            })
          );
          setPorts(portsWithInfo);
        } catch (error) {
          console.error('Error accessing serial ports:', error);
        }
      }
    }
    getPorts();
  }, []);

  // Function to handle selecting a port
  const handlePortSelection = async (event) => {
    const selectedPortInfo = event.target.value;
    setSelectedPortInfo(selectedPortInfo);
  };

  // Function to start reading from the selected port
  const handleStartReading = async () => {
    if (selectedPortInfo && selectedPortInfo.port) {
      const selectedPort = selectedPortInfo.port;
      try {
        await selectedPort.open({ baudRate: 9600 }); // Open the port with the required baud rate
        setIsPortOpen(true);

        selectedPort.addEventListener('disconnect', () => {
          handlePortDisconnect().catch((error) => {
            console.error('Error during port disconnect:', error);
          });
        });

        const textDecoder = new TextDecoderStream();
        readableStreamClosedRef.current = selectedPort.readable.pipeTo(
          textDecoder.writable
        );
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

                // Process the buffer to extract complete lines
                let lines = bufferRef.current.split('\n');
                bufferRef.current = lines.pop(); // Save incomplete line for next read

                for (let line of lines) {
                  processLine(line.trim());
                }
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

      } catch (error) {
        console.error('Error opening serial port:', error);
      }
    }
  };

  // Function to process each line as it arrives
  const processLine = (line) => {
    if (
      line.startsWith('$GPGSV') ||
      line.startsWith('$GLGSV') ||
      line.startsWith('$GAGSV') ||
      line.startsWith('$BDGSV') ||
      line.startsWith('$GNGSV') // Added for combined GNSS sentences
    ) {
    
      const satelliteInfo = parseGSV(line);
      if (satelliteInfo && satelliteInfo.length > 0) {
        // Update serialTableData
        setSerialTableData((prevData) => {
          const satellitesByID = {};
          prevData.forEach((sat) => {
            satellitesByID[sat.ID] = sat;
          });
          satelliteInfo.forEach((sat) => {
            satellitesByID[sat.ID] = sat;
          });
          return Object.values(satellitesByID).sort(
            (a, b) => parseInt(a.ID) - parseInt(b.ID)
          );
        });

        // Update selectedSatellites state
        setSelectedSatellites((prevSelected) => {
          const newSelected = { ...prevSelected };
          satelliteInfo.forEach((sat) => {
            if (!(sat.ID in newSelected)) {
              newSelected[sat.ID] = true; // Default to true (checked)
            }
          });
          return newSelected;
        });
      }
    } else if (
      line.startsWith('$GPGGA') ||
      line.startsWith('$GLGGA') ||
      line.startsWith('$GAGGA') ||
      line.startsWith('$BDGGA') ||
      line.startsWith('$GNGGA') // Added for combined GNSS sentences
    ) {
      
      const positionInfo = parseGGA(line);
      if (positionInfo && onPositionUpdate) {
        console.log('Position update:', positionInfo);
        onPositionUpdate(positionInfo);
      }
    }
  };

  // Function to request a new serial port
  const handleRequestPort = async () => {
    if ('serial' in navigator) {
      try {
        const port = await navigator.serial.requestPort(); // User selects a port from the browser dialog
        const info = port.getInfo();
        let defaultName = 'Unknown Device';

        // Attempt to use product and manufacturer strings
        if (info.usbVendorId && info.usbProductId) {
          const vendorId = info.usbVendorId.toString(16).padStart(4, '0');
          const productId = info.usbProductId.toString(16).padStart(4, '0');
          defaultName = `USB Device (${vendorId}, ${productId})`;
        }

        // Prompt the user for a custom name
        const customName =
          window.prompt('Enter a name for the device:', defaultName) ||
          defaultName;

        const portWithInfo = { port, name: customName };
        setPorts((prevPorts) => [...prevPorts, portWithInfo]); // Add new port to the list
        setSelectedPortInfo(portWithInfo);
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

    if (selectedPortInfo && selectedPortInfo.port) {
      try {
        await selectedPortInfo.port.close();
      } catch (error) {
        console.error('Error closing port:', error);
      }
      selectedPortInfo.port.removeEventListener('disconnect', handlePortDisconnect);
    }

  }, [selectedPortInfo]);

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
        if (selectedPortInfo && selectedPortInfo.port) {
          selectedPortInfo.port.removeEventListener('disconnect', handlePortDisconnect);
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

        if (selectedPortInfo && selectedPortInfo.port && selectedPortInfo.port.readable) {
          try {
            await selectedPortInfo.port.close();
          } catch (error) {
            console.error('Error closing port during cleanup:', error);
          }
        }
      };
      cleanup().catch((error) => {
        console.error('Error during cleanup:', error);
      });
    };
  }, [handlePortDisconnect, selectedPortInfo]);

  return (
    <Container style={{ marginTop: '20px' }}>
      <Typography variant="h6">Serial Port Reader</Typography>
      <Box sx={{ mt: 2 }}>
        {/* Dropdown to select COM port */}
        <Select
          value={selectedPortInfo || ''}
          onChange={handlePortSelection}
          displayEmpty
          fullWidth
          variant="outlined"
        >
          <MenuItem value="">
            <em>Select a COM port</em>
          </MenuItem>
          {ports.map((portInfo, index) => (
            <MenuItem key={index} value={portInfo}>
              {portInfo.name}
            </MenuItem>
          ))}
        </Select>

        {/* Button to request a new port */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRequestPort}
          sx={{ mt: 2 }}
        >
          Request a COM Port
        </Button>

        {/* Button to start reading from the selected COM port */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleStartReading}
          sx={{ mt: 2 }}
          disabled={isPortOpen || !selectedPortInfo} // Disable button if port is already open or not selected
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
