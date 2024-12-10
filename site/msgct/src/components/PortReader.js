import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Typography, Box, Button, TextField } from '@mui/material';
import GPSSatelliteTable from './GPSSatelliteTable';
import { parseGSV, parseGGA } from './NMEAParser';

function PortReader({ portInfo, onPositionUpdate, positionSource, onDisconnect, onSatelliteDataUpdate }) {
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

  const getConstellationFromPRN = (prn) => {
    prn = parseInt(prn, 10);
    if (prn >= 1 && prn <= 32) {
      return 'gps';
    } else if (prn >= 33 && prn <= 64) {
      return 'sbas';
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

  const processLine = useCallback((line) => {
    const trimmedLine = line.trim();

    // Check if it's a GSV sentence
    if (
      trimmedLine.startsWith('$GPGSV') ||
      trimmedLine.startsWith('$GLGSV') ||
      trimmedLine.startsWith('$GAGSV') ||
      trimmedLine.startsWith('$BDGSV') ||
      trimmedLine.startsWith('$QZGSV') ||
      trimmedLine.startsWith('$GNGSV')
    ) {
      const fields = trimmedLine.split(',');

      // Basic validation: GSV sentences have a known structure. At a minimum:
      // $xxGSV,total_msgs,msg_no,total_sats,[satellite blocks...]
      // Each satellite block has 4 fields, so total fields should be 4 + (4 * number_of_satellites_in_this_sentence).
      if (fields.length < 4 || (fields.length - 4) % 4 !== 0) {
        console.warn('GSV line does not have the expected field count for satellites:', trimmedLine);
        return; // Skip invalid line
      }

      const satelliteInfo = parseGSV(trimmedLine);
      if (satelliteInfo && satelliteInfo.length > 0) {
        satelliteInfo.forEach((sat) => {
          // Validate PRN is numeric and positive
          const prnNum = parseInt(sat.ID, 10);
          if (isNaN(prnNum) || prnNum <= 0) {
            console.warn('Invalid PRN detected, skipping this satellite:', sat.ID, 'Line:', trimmedLine);
            return; // Skip this satellite
          }

          const constellation = getConstellationFromPRN(sat.ID);
          if (constellation !== 'unknown') {
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

            setSelectedSatellites((prevSelected) => {
              const updatedSelected = { ...prevSelected };
              if (!updatedSelected[constellation]) {
                updatedSelected[constellation] = {};
              }
              if (!(sat.ID in updatedSelected[constellation])) {
                updatedSelected[constellation][sat.ID] = true;
              }
              return updatedSelected;
            });
          }
        });
      } else {
        // Even if parseGSV returned empty or invalid data, warn and move on
        console.warn('GSV parsing returned no satellites or invalid data for line:', trimmedLine);
      }
    } else if (
      trimmedLine.startsWith('$GPGGA') ||
      trimmedLine.startsWith('$GLGGA') ||
      trimmedLine.startsWith('$GAGGA') ||
      trimmedLine.startsWith('$BDGGA') ||
      trimmedLine.startsWith('$QZGGA') ||
      trimmedLine.startsWith('$GNGGA')
    ) {
      const positionInfo = parseGGA(trimmedLine);
      if (positionInfo && onPositionUpdate && positionSource === 'receiver') {
        console.log('Position update:', positionInfo);
        onPositionUpdate(positionInfo, portInfo.name);
      }
    } else {
      // If not GSV or GGA, ignore or handle other sentence types if needed.
    }
  }, [setSerialTableData, setSelectedSatellites, onPositionUpdate, positionSource, portInfo.name]);

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

    if (onDisconnect) {
      onDisconnect(portInfo);
    }
  }, [portInfo, onDisconnect]);

  const handleDisconnect = async () => {
    try {
      await handlePortDisconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  };

  useEffect(() => {
    const startReading = async () => {
      if (portInfo && portInfo.port) {
        const selectedPort = portInfo.port;
        try {
          await selectedPort.open({ baudRate: 9600 });
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
                  break;
                }
                if (value) {
                  bufferRef.current += value;
                  setSerialData((prevData) => prevData + value);

                  let lines = bufferRef.current.split('\n');
                  bufferRef.current = lines.pop();

                  for (let line of lines) {
                    processLine(line);
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
  }, [handlePortDisconnect, processLine, portInfo]);

  useEffect(() => {
    if (onSatelliteDataUpdate && portInfo.name) {
      const combinedSats = [];
      Object.keys(serialTableData).forEach((constellation) => {
        combinedSats.push(...serialTableData[constellation]);
      });
      onSatelliteDataUpdate(portInfo.name, combinedSats);
    }
  }, [serialTableData, onSatelliteDataUpdate, portInfo.name]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">{portInfo.name}</Typography>
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
