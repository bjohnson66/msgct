import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Typography, Box, Button, TextField } from '@mui/material';
import GPSSatelliteTable from './GPSSatelliteTable';
import { parseGSV, parseGGA } from './NMEAParser';

function PortReader({ portInfo, onPositionUpdate, positionSource, onDisconnect }) {
  const [serialData, setSerialData] = useState('');
  const [isPortOpen, setIsPortOpen] = useState(false);
  const [serialTableData, setSerialTableData] = useState({
    gps: [],
    qzss: [],
    galileo: [],
    beidou: [],
    glonass: [],
  });
  const [selectedSatellites, setSelectedSatellites] = useState({
    gps: {},
    qzss: {},
    galileo: {},
    beidou: {},
    glonass: {},
  });
  const [selectedConstellations] = useState({
    gps: true,
    qzss: true,
    galileo: true,
    beidou: true,
    glonass: true,
  });

  const readerRef = useRef(null);
  const bufferRef = useRef('');
  const readableStreamClosedRef = useRef(null);

  // Function to determine the constellation based on PRN
  const getConstellationFromPRN = (prn) => {
    prn = parseInt(prn, 10);
    if (prn >= 1 && prn <= 32) {
      return 'gps';
    } else if (prn >= 33 && prn <= 64) {
      return 'sbas'; // Handle SBAS separately
    } else if (prn >= 65 && prn <= 96) {
      return 'glonass';
    } else if (prn >= 193 && prn <= 199) {
      return 'qzss';
    } else if (prn >= 201 && prn <= 237) {
      return 'beidou';
    } else if (prn >= 301 && prn <= 336) {
      return 'galileo';
    } else {
      return 'unknown';
    }
  };

  // Function to process each line as it arrives
  const processLine = (line) => {
    if (
      line.startsWith('$GPGSV') ||
      line.startsWith('$GLGSV') ||
      line.startsWith('$GAGSV') ||
      line.startsWith('$BDGSV') ||
      line.startsWith('$QZGSV') ||
      line.startsWith('$GNGSV') // Combined GNSS sentences
    ) {
      const satelliteInfo = parseGSV(line);
      if (satelliteInfo && satelliteInfo.length > 0) {
        satelliteInfo.forEach((sat) => {
          const constellation = getConstellationFromPRN(sat.ID);
          if (constellation !== 'unknown') {
            // Update serialTableData
            setSerialTableData((prevData) => {
              const updatedData = { ...prevData };
              if (!updatedData[constellation]) {
                updatedData[constellation] = [];
              }

              const satellitesByID = {};
              updatedData[constellation].forEach((existingSat) => {
                satellitesByID[existingSat.ID] = existingSat;
              });
              satellitesByID[sat.ID] = sat;
              updatedData[constellation] = Object.values(satellitesByID).sort(
                (a, b) => parseInt(a.ID) - parseInt(b.ID)
              );
              return updatedData;
            });

            // Update selectedSatellites state
            setSelectedSatellites((prevSelected) => {
              const updatedSelected = { ...prevSelected };
              if (!updatedSelected[constellation]) {
                updatedSelected[constellation] = {};
              }
              if (!(sat.ID in updatedSelected[constellation])) {
                updatedSelected[constellation][sat.ID] = true; // Default to true (checked)
              }
              return updatedSelected;
            });
          }
        });
      }
    } else if (
      line.startsWith('$GPGGA') ||
      line.startsWith('$GLGGA') ||
      line.startsWith('$GAGGA') ||
      line.startsWith('$BDGGA') ||
      line.startsWith('$QZGGA') ||
      line.startsWith('$GNGGA') // Combined GNSS sentences
    ) {
      const positionInfo = parseGGA(line);
      if (positionInfo && onPositionUpdate && positionSource === 'receiver') {
        console.log('Position update:', positionInfo);
        onPositionUpdate(positionInfo);
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

    if (portInfo && portInfo.port) {
      try {
        await portInfo.port.close();
      } catch (error) {
        console.error('Error closing port:', error);
      }
      portInfo.port.removeEventListener('disconnect', handlePortDisconnect);
    }

    // Inform parent component that the port has been disconnected
    if (onDisconnect) {
      onDisconnect(portInfo);
    }
  }, [portInfo, onDisconnect]);

  // Function to disconnect from the serial port
  const handleDisconnect = async () => {
    try {
      await handlePortDisconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  };

  // Start reading from the port when the component mounts
  useEffect(() => {
    const startReading = async () => {
      if (portInfo && portInfo.port) {
        const selectedPort = portInfo.port;
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

    startReading();

    // Cleanup on component unmount
    return () => {
      const cleanup = async () => {
        if (portInfo && portInfo.port) {
          portInfo.port.removeEventListener('disconnect', handlePortDisconnect);
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

        if (portInfo && portInfo.port && portInfo.port.readable) {
          try {
            await portInfo.port.close();
          } catch (error) {
            console.error('Error closing port during cleanup:', error);
          }
        }
      };
      cleanup().catch((error) => {
        console.error('Error during cleanup:', error);
      });
    };
  }, [handlePortDisconnect, portInfo]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">{portInfo.name}</Typography>
      {/* Remove Start Reading button */}
      <Button
        variant="contained"
        color="error"
        onClick={handleDisconnect}
        sx={{ mt: 2 }}
        disabled={!isPortOpen}
      >
        Disconnect
      </Button>
      <TextField
        multiline
        rows={6}
        fullWidth
        value={serialData}
        sx={{ mt: 2 }}
        variant="outlined"
        label="Serial Data"
      />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Parsed Satellite Data
        </Typography>
        <GPSSatelliteTable
          mgnssRelativePositions={serialTableData}
          selectedConstellations={selectedConstellations}
          selectedSatellites={selectedSatellites}
          setSelectedSatellites={setSelectedSatellites}
        />
      </Box>
    </Box>
  );
}

export default PortReader;
