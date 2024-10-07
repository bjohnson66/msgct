/*
  -----------------------------------
  Acknowledgments
  -----------------------------------
  
  This project utilized OpenAI's ChatGPT (GPT-4o) to assist in the development and optimization of various components, including:

  - Generating and refining React components for the application structure.
  - Creating stubs and doing basic JSON convsersion during early development.
  - Assisting in reasearch for phyiscs formulas and calculations need to solve the problem of GPS (calculating and converting SV position)

  All AI-assisted code has been thoroughly reviewed and is limited to code that is boilerplate or only for site visuals.
*/

import { ThemeProvider, createTheme, CssBaseline, Switch } from '@mui/material';  // Add CssBaseline and Switch imports
import { Button, Typography, Container, Box } from '@mui/material';
import Confetti from 'react-confetti';
import { Helmet } from 'react-helmet';  // Import Helmet for managing metadata
import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import { pink } from '@mui/material/colors';
import './App.css';
import logo from './logo_msgct.png';
//import * as d3 from 'd3';
import { Select, MenuItem, TextField } from '@mui/material';

//set meta data
const meta = {
  title: 'Multi-Source GNSS Constellation Tracker',
  description: "Monitor the status of GNSS Constellations in real time or in the past.",
  meta: {
    charset: 'utf-8',
    name: {
      keywords: 'react,meta,document,html,tags'
    }
  }
};

//-------------------------------------
// Retreiving Almanac Data from Server
//-------------------------------------
//Stub
const setAlmanacData = async () => {
  try {
    const response = await fetch('/sv_data/gps_data/gps_20241006_112138.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load GPS data:', error);
    return [];
  }
};

//--------------------------------------
// Get User Position Component
//--------------------------------------
let userPosition = { lat: 45.0, lon: -93.0, alt: 0.0 };
export const setUserPosition = (lat, lon, alt) => {
  userPosition = { lat, lon, alt };
};
export const getUserPosition = () => userPosition;



//--------------------------------------
//  SV Data Table Component
//--------------------------------------
const initialTableSatellites = [];

function GPSSatelliteTable({ tableSatellites }) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} size="small" aria-label="GPS Satellite table">
        <TableHead>
          <TableRow>
            <TableCell>PRN</TableCell>
            <TableCell align="right">Azimuth (°)</TableCell>
            <TableCell align="right">Elevation (°)</TableCell>
            <TableCell align="right">Signal Strength (C/N0) dB-Hz</TableCell>
            <TableCell align="right">Health</TableCell>
            <TableCell align="right">Block Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableSatellites.map((satellite) => (
            <TableRow key={satellite.prn}>
              <TableCell component="th" scope="row">{satellite.prn}</TableCell>
              <TableCell align="right">{satellite.azimuth}</TableCell>
              <TableCell align="right">{satellite.elevation}</TableCell>
              <TableCell align="right">{satellite.signalStrength}</TableCell>
              <TableCell align="right">{satellite.health}</TableCell>
              <TableCell align="right">{satellite.blockType}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SelectSVsOfInterest() {
  const [checked, setChecked] = React.useState({
    gps: true,
    ca: true,
    p: true,
    other: true,
    qzss: true,
    galileo: true,
    glonass: true,
    beidou: true,
  });

  // Handle changes for the GPS parent checkbox
  const handleChangeGPS = (event) => {
    setChecked({
      ...checked,
      gps: event.target.checked,
      ca: event.target.checked,
      p: event.target.checked,
      other: event.target.checked,
    });
  };

  // Handle changes for individual child checkboxes (GPS Code Types)
  const handleChangeCodeType = (event) => {
    setChecked({
      ...checked,
      [event.target.name]: event.target.checked,
    });
  };

  // Handle changes for individual constellations (other than GPS)
  const handleChangeConstellation = (event) => {
    setChecked({
      ...checked,
      [event.target.name]: event.target.checked,
    });
  };

  // Determine if the GPS checkbox should be indeterminate
  const isIndeterminate = checked.ca !== checked.p || checked.p !== checked.other;

  return (
    <FormGroup>
      {/* GPS Checkbox (parent) */}
      <FormControlLabel
        label="GPS"
        control={
          <Checkbox
            checked={checked.gps}
            indeterminate={isIndeterminate && checked.gps}
            onChange={handleChangeGPS}
          />
        }
      />

      {/* Child Checkboxes (C/A, P, or Other) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
        <FormControlLabel
          label="C/A"
          control={
            <Checkbox
              checked={checked.ca}
              onChange={handleChangeCodeType}
              name="ca"
              color="primary"
            />
          }
        />
        <FormControlLabel
          label="P"
          control={
            <Checkbox
              checked={checked.p}
              onChange={handleChangeCodeType}
              name="p"
              color="warning"
            />
          }
        />
        <FormControlLabel
          label="Other"
          control={
            <Checkbox
              checked={checked.other}
              onChange={handleChangeCodeType}
              name="other"
              color="success"
            />
          }
        />
      </Box>

      {/* Other Constellations */}
      <FormControlLabel
        label="QZSS"
        control={
          <Checkbox
            checked={checked.qzss}
            onChange={handleChangeConstellation}
            name="qzss"
            color="secondary"
          />
        }
      />
      <FormControlLabel
        label="Galileo"
        control={
          <Checkbox
            checked={checked.galileo}
            onChange={handleChangeConstellation}
            name="galileo"
            color="info"
          />
        }
      />
      <FormControlLabel
        label="GLONASS"
        control={
          <Checkbox
            checked={checked.glonass}
            onChange={handleChangeConstellation}
            name="glonass"
            sx={{
              color: pink[800],
              '&.Mui-checked': {
                color: pink[600],
              },
            }}
          />
        }
      />
      <FormControlLabel
        label="BeiDou"
        control={
          <Checkbox
            checked={checked.beidou}
            onChange={handleChangeConstellation}
            name="beidou"
            color="error"
          />
        }
      />
    </FormGroup>
  );
}

//--------------------------------------
//  Main App Component
//--------------------------------------
function App() {
  // State for table satellites
  const [tableSatellites, setTableSatellites] = useState(initialTableSatellites);

  // State to track the current theme mode
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [gpsAlmanacData, setAlmanacData] = useState([]);

  // Toggle between light and dark modes
  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const handleButtonClick = () => {
    setAlmanacData();

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 6000); // Confetti disappears after 6 seconds
  };

  // Define the light and dark themes
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Ensures proper theme-based background */}
      {showConfetti && <Confetti />}

      {/* Use Helmet to add metadata to the head section */}
      <Helmet>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>Multi-Source GNSS Constellation Tracker</title>
      </Helmet>

      {/* Title Banner of Page */}
      <Container style={{ marginTop: '50px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo Image */}
            <img src={logo} className='Logo' alt='MSGCT Logo' />
            <Typography variant="h4" sx={{ ml: 2 }}>
              Multi-Source GNSS Constellation Tracker
            </Typography>
          </Box>
          <Switch checked={darkMode} onChange={handleThemeChange} /> {/* Dark mode toggle */}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleButtonClick}
          sx={{ mt: 2 }}
        >
          Push Me
        </Button>
      </Container>

      {/* Body of Page */}
      <Stack spacing={2} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Satellite Table */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              GPS Satellite Data
            </Typography>
            <GPSSatelliteTable tableSatellites={tableSatellites} />
          </Grid>
        </Grid>

        {/* Select SVs of Interest */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Select SVs of Interest
          </Typography>
          <SelectSVsOfInterest />
        </Grid>

        {/* Add the SerialPortComponent here */}
        <Grid item xs={12} md={12}>
          <SerialPortComponent />
        </Grid>

      </Stack>
    </ThemeProvider>
  );
}

//--------------------------------------
//  SerialPortComponent
//--------------------------------------
function SerialPortComponent() {
  const [ports, setPorts] = useState([]); // Available serial ports
  const [selectedPort, setSelectedPort] = useState(null); // Selected COM port
  const [serialData, setSerialData] = useState(''); // Raw serial data to display
  const [isPortOpen, setIsPortOpen] = useState(false); // Track if port is open
  const [serialTableData, setSerialTableData] = useState([]); // Data for the table

  const readerRef = useRef(null);
  const bufferRef = useRef(''); // Buffer to store incoming data

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

        selectedPort.addEventListener('disconnect', handlePortDisconnect);

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = selectedPort.readable.pipeTo(textDecoder.writable);
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

        // Start the timer to update the table every 4 seconds
        timerRef.current = setInterval(() => {
          processSerialData();
        }, 4000);
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
  const handlePortDisconnect = () => {
    console.log('Serial port disconnected');
    setIsPortOpen(false);

    if (readerRef.current) {
      try {
        readerRef.current.cancel().catch((error) => {
          console.error('Error canceling reader:', error);
        });
        readerRef.current.releaseLock();
      } catch (error) {
        console.error('Error handling reader on disconnect:', error);
      }
    }

    if (selectedPort) {
      try {
        selectedPort.close();
      } catch (error) {
        console.error('Error closing port:', error);
      }
      selectedPort.removeEventListener('disconnect', handlePortDisconnect);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (selectedPort) {
        selectedPort.removeEventListener('disconnect', handlePortDisconnect);
      }
      if (readerRef.current) {
        try {
          readerRef.current.cancel().catch((error) => {
            console.error('Error canceling reader during cleanup:', error);
          });
          readerRef.current.releaseLock();
        } catch (error) {
          console.error('Error releasing reader lock during cleanup:', error);
        }
      }
      if (selectedPort && selectedPort.readable) {
        try {
          selectedPort.close();
        } catch (error) {
          console.error('Error closing port during cleanup:', error);
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [selectedPort]);

  // Function to process serial data and update the table
  const processSerialData = () => {
    const data = bufferRef.current;
    bufferRef.current = ''; // Clear the buffer after processing

    // Split the data into lines
    const lines = data.split('\n');

    // Use an object to store satellites by PRN to prevent duplicates
    const satellitesByPRN = {};

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
            satellitesByPRN[satellite.prn] = satellite; // Overwrite if PRN already exists
          });
        }
      }
    });

    const parsedData = Object.values(satellitesByPRN);

    if (parsedData.length > 0) {
      setSerialTableData(parsedData); // Replace the state with deduplicated data
    }
  };

  // Function to parse GSV sentences
  const parseGSV = (sentence) => {
    // Split the sentence into fields
    const fields = sentence.split(',');
    // GSV sentences have the following format:
    // $GxGSV,totalNumberOfSentences,sentenceNumber,numberOfSVsInView,
    //   [satellitePRN1,elevation1,azimuth1,SNR1, ... up to 4 satellites per sentence],*checksum

    if (fields.length < 4) {
      console.error('Invalid GSV sentence:', sentence);
      return [];
    }

    // const totalSentences = parseInt(fields[1], 10);
    // const sentenceNumber = parseInt(fields[2], 10);
    // const numberOfSVs = parseInt(fields[3], 10);

    const satellites = [];

    // Each GSV sentence contains data for up to 4 satellites
    // Satellite data starts from field index 4
    for (let i = 4; i < fields.length - 1; i += 4) {
      const prn = fields[i];
      const elevation = fields[i + 1];
      const azimuth = fields[i + 2];
      const snr = fields[i + 3]; // Signal-to-noise ratio (SNR) in dB-Hz

      if (prn) {
        satellites.push({
          prn: prn,
          elevation: elevation || '',
          azimuth: azimuth || '',
          signalStrength: snr || '',
          health: '', // NMEA GSV sentences do not provide health information
          blockType: '', // NMEA GSV sentences do not provide block type
        });
      }
    }

    return satellites;
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
          <GPSSatelliteTable tableSatellites={serialTableData} />
        </Box>
      </Box>
    </Container>
  );
}

export { App, GPSSatelliteTable, SelectSVsOfInterest, SerialPortComponent };
export default App;
