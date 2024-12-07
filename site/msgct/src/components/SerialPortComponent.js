import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import PortReader from './PortReader';

function SerialPortComponent({ onPositionUpdate, positionSource, onSatelliteDataUpdate }) { // ADDED onSatelliteDataUpdate prop
  const [ports, setPorts] = useState([]);
  const [portReaders, setPortReaders] = useState([]);

  const handleRequestPort = async () => {
    if ('serial' in navigator) {
      try {
        const port = await navigator.serial.requestPort();
        const info = port.getInfo();
        let defaultName = 'Unknown Device';

        if (info.usbVendorId && info.usbProductId) {
          const vendorId = info.usbVendorId.toString(16).padStart(4, '0');
          const productId = info.usbProductId.toString(16).padStart(4, '0');
          defaultName = `USB Device (${vendorId}, ${productId})`;
        }

        const customName =
          window.prompt('Enter a name for the device:', defaultName) || defaultName;

        const portWithInfo = { port, name: customName };
        setPorts((prevPorts) => [...prevPorts, portWithInfo]);
      } catch (error) {
        console.error('Error requesting serial port:', error);
      }
    } else {
      alert('Web Serial API not supported in this browser.');
    }
  };

  const handleStartReading = (portInfo) => {
    if (!portReaders.some((reader) => reader.port === portInfo.port)) {
      setPortReaders((prevReaders) => [...prevReaders, portInfo]);
    }
  };

  const handleRemovePortReader = (portInfo) => {
    setPortReaders((prevReaders) =>
      prevReaders.filter((reader) => reader.port !== portInfo.port)
    );
  };

  return (
    <Container style={{ marginTop: '20px' }}>
      <Typography variant="h6">Serial Port Reader</Typography>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRequestPort}
          sx={{ mt: 2 }}
        >
          Request a COM Port
        </Button>

        {ports.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Available Ports</Typography>
            {ports.map((portInfo, index) => (
              <Box key={index} sx={{ mt: 1 }}>
                <Typography>{portInfo.name}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleStartReading(portInfo)}
                  disabled={portReaders.some((reader) => reader.port === portInfo.port)}
                  sx={{ mt: 1 }}
                >
                  Start Reading
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {portReaders.map((portInfo, index) => (
          <PortReader
            key={index}
            portInfo={portInfo}
            onPositionUpdate={onPositionUpdate}
            positionSource={positionSource}
            onDisconnect={handleRemovePortReader}
            onSatelliteDataUpdate={onSatelliteDataUpdate} // ADDED
          />
        ))}
      </Box>
    </Container>
  );
}

export default SerialPortComponent;
