import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import PortReader from './PortReader';

function SerialPortComponent({ onPositionUpdate, positionSource }) {
  const [ports, setPorts] = useState([]); // No initial ports
  const [portReaders, setPortReaders] = useState([]); // Active port readers

  // Function to request a new serial port
  const handleRequestPort = async () => {
    if ('serial' in navigator) {
      try {
        const port = await navigator.serial.requestPort();
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
          window.prompt('Enter a name for the device:', defaultName) || defaultName;

        const portWithInfo = { port, name: customName };
        setPorts((prevPorts) => [...prevPorts, portWithInfo]); // Add new port to the list
      } catch (error) {
        console.error('Error requesting serial port:', error);
      }
    } else {
      alert('Web Serial API not supported in this browser.');
    }
  };

  // Function to start reading from the selected port
  const handleStartReading = (portInfo) => {
    if (!portReaders.some((reader) => reader.port === portInfo.port)) {
      setPortReaders((prevReaders) => [...prevReaders, portInfo]);
    }
  };

  // Function to remove a port reader when disconnected
  const handleRemovePortReader = (portInfo) => {
    setPortReaders((prevReaders) =>
      prevReaders.filter((reader) => reader.port !== portInfo.port)
    );
  };

  return (
    <Container style={{ marginTop: '20px' }}>
      <Typography variant="h6">Serial Port Reader</Typography>
      <Box sx={{ mt: 2 }}>
        {/* Button to request a new port */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRequestPort}
          sx={{ mt: 2 }}
        >
          Request a COM Port
        </Button>

        {/* List of available ports */}
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

        {/* Render PortReader components for active ports */}
        {portReaders.map((portInfo, index) => (
          <PortReader
            key={index}
            portInfo={portInfo}
            onPositionUpdate={onPositionUpdate}
            positionSource={positionSource}
            onDisconnect={handleRemovePortReader}
          />
        ))}
      </Box>
    </Container>
  );
}

export default SerialPortComponent;
