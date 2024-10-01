/*
  -----------------------------------
  Acknowledgments
  -----------------------------------
  
  This project utilized OpenAI's ChatGPT (GPT-4) to assist in the development and optimization of various components, including:

  - Generating and refining React components for the application structure.
  - Integrating satellite tracking functionalities using satellite.js for realistic orbit simulations.
  - Enhancing visualizations with D3.js to create dynamic and interactive sky plots.
  - Implementing performance optimizations for efficient rendering and state management.
  - Debugging and troubleshooting code to ensure application stability.

  All AI-assisted code has been thoroughly reviewed and customized to meet the project's specific requirements and standards.
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
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import { pink } from '@mui/material/colors';
import './App.css';
import logo from './logo_msgct.png';
import * as d3 from 'd3';
import { Select, MenuItem, TextField } from '@mui/material';

// Set meta data
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

//--------------------------------------
//  LIVE SKY AND SV DATA PLOT COMPONENT
//   - AI Generated Component Using GPT o1
//--------------------------------------
// Utility function to convert degrees to radians
const deg2rad = (deg) => (deg * Math.PI) / 180;

// Utility function to calculate azimuth and elevation
function ECEFToAzEl(satPosECEF, observerPosECEF, observerLat, observerLon) {
  // Translate satellite position relative to observer
  const dx = satPosECEF.x - observerPosECEF.x;
  const dy = satPosECEF.y - observerPosECEF.y;
  const dz = satPosECEF.z - observerPosECEF.z;

  // Convert observer latitude and longitude to radians
  const lat = deg2rad(observerLat);
  const lon = deg2rad(observerLon);

  // Rotation matrix from ECEF to ENU
  const t = [
    [-Math.sin(lon), Math.cos(lon), 0],
    [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)],
    [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)],
  ];

  // Apply rotation
  const east = t[0][0] * dx + t[0][1] * dy + t[0][2] * dz;
  const north = t[1][0] * dx + t[1][1] * dy + t[1][2] * dz;
  const up = t[2][0] * dx + t[2][1] * dy + t[2][2] * dz;

  // Calculate azimuth and elevation
  const azimuth = Math.atan2(east, north) * (180 / Math.PI);
  const horizontalDist = Math.sqrt(east * east + north * north);
  const elevation = Math.atan2(up, horizontalDist) * (180 / Math.PI);

  return {
    azimuth: (azimuth + 360) % 360, // Normalize to [0, 360)
    elevation,
  };
}

const SkyPlot = ({ satellites, observerPos, observerLat, observerLon }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Initial setup
    const width = 500;
    const height = 500;
    const svg = d3.select(svgRef.current)
                  .attr('width', width)
                  .attr('height', height);

    // Clear previous content
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2 - 50; // Padding

    const g = svg.append('g')
                 .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Draw horizon circle
    g.append('circle')
     .attr('r', radius)
     .attr('fill', 'none')
     .attr('stroke', '#ccc');

    // Add elevation rings
    const elevationLevels = [30, 60];
    elevationLevels.forEach((el) => {
      const elRadius = (el / 90) * radius;
      g.append('circle')
       .attr('r', elRadius)
       .attr('fill', 'none')
       .attr('stroke', '#eee')
       .attr('stroke-dasharray', '4 2');
      
      // Add elevation labels
      g.append('text')
       .attr('x', 0)
       .attr('y', -elRadius)
       .attr('dy', '-0.35em')
       .attr('text-anchor', 'middle')
       .attr('font-size', '10px')
       .attr('fill', '#666')
       .text(`${el}°`);
    });

    // Add azimuth lines every 45 degrees
    for (let az = 0; az < 360; az += 45) {
      const azRad = deg2rad(az);
      const x = radius * Math.sin(azRad);
      const y = -radius * Math.cos(azRad);
      g.append('line')
       .attr('x1', 0)
       .attr('y1', 0)
       .attr('x2', x)
       .attr('y2', y)
       .attr('stroke', '#eee')
       .attr('stroke-dasharray', '2 2');
      
      // Add azimuth labels
      const labelX = (radius + 15) * Math.sin(azRad);
      const labelY = -(radius + 15) * Math.cos(azRad);
      g.append('text')
       .attr('x', labelX)
       .attr('y', labelY)
       .attr('dy', '0.35em')
       .attr('text-anchor', 'middle')
       .attr('font-size', '10px')
       .attr('fill', '#666')
       .text(`${az}°`);
    }

    // Save radius and group for later use
    svg.node().radius = radius;
    svg.node().g = g;
  }, []);

  useEffect(() => {
    // Update satellite data with azimuth and elevation
    const updatedSatData = satellites.map((sat) => {
      const azEl = ECEFToAzEl(
        sat.positionECEF,
        observerPos,
        observerLat,
        observerLon
      );
      return {
        ...sat,
        azimuth: azEl.azimuth,
        elevation: azEl.elevation,
      };
    });

    // Select SVG and group
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const radius = svg.node().radius;

    // Bind data
    const sats = g.selectAll('.satellite-group')
                 .data(updatedSatData, d => d.id);

    // Enter new satellites
    const satsEnter = sats.enter()
                          .append('g')
                          .attr('class', 'satellite-group');

    // Append satellite circle
    satsEnter.append('circle')
             .attr('class', 'satellite')
             .attr('r', 5)
             .attr('fill', 'red');

    // Merge and update
    sats.merge(satsEnter).each(function(d) {
      const group = d3.select(this);

      // Calculate current position
      const azRad = deg2rad(d.azimuth);
      const elRatio = d.elevation / 90; // 0 to 1
      const x = radius * elRatio * Math.sin(azRad);
      const y = -radius * elRatio * Math.cos(azRad);

      // Update satellite position
      group.select('.satellite')
           .attr('cx', x)
           .attr('cy', y);
    });

    // Remove satellites no longer present
    sats.exit().remove();
  }, [satellites, observerPos, observerLat, observerLon]);

  return <svg ref={svgRef}></svg>;
};

const satelliteECEF = {
  x: 15600e3,   // Example value
  y: 7540e3,    // Example value
  z: 20140e3    // Example value
};

// Observer position in ECEF coordinates (in meters)
const observerECEF = {
  x: 1917020.0, // Example value
  y: 6029070.0, // Example value
  z: 0.0        // Example value
};

const observerLatitude = 45.0;  // Example latitude in degrees
const observerLongitude = -93.0; // Example longitude in degrees

// Function to generate initial satellite data
function generateInitialSatellites() {
  const satellites = [];
  const numSatellites = 6; // Adjust as needed

  for (let i = 1; i <= numSatellites; i++) {
    satellites.push({
      id: `sat${i}`,
      prn: i,
      azimuth: Math.random() * 360,
      elevation: Math.random() * 90,
      signalStrength: 40 + Math.random() * 20, // 40 to 60 dB-Hz
      health: 'Healthy',
      blockType: ['Block IIR-M', 'Block IIF', 'Block IIIA'][i % 3],
      positionECEF: {
        x: 15600e3 + Math.random() * 1000, // Example initial positions
        y: 7540e3 + Math.random() * 1000,
        z: 20140e3 + Math.random() * 1000,
      },
      history: [],
    });
  }

  return satellites;
}

// Function to simulate satellite movement
function updateSatellitePositions(satellites) {
  return satellites.map((sat) => {
    // Simulate movement by adjusting ECEF positions slightly
    const delta = 1000; // meters per update
    const angle = deg2rad(sat.azimuth);
    const elevationRad = deg2rad(sat.elevation);

    // Simple circular movement in azimuth
    const newAzimuth = (sat.azimuth + 5) % 360;

    // Update positionECEF based on new azimuth and elevation
    const r = Math.sqrt(
      sat.positionECEF.x ** 2 +
        sat.positionECEF.y ** 2 +
        sat.positionECEF.z ** 2
    );

    const newElevation = sat.elevation; // Keep elevation constant for simplicity

    // Convert spherical to Cartesian coordinates for new position
    const newX =
      r * Math.cos(deg2rad(newElevation)) * Math.sin(deg2rad(newAzimuth));
    const newY =
      r * Math.cos(deg2rad(newElevation)) * Math.cos(deg2rad(newAzimuth));
    const newZ = r * Math.sin(deg2rad(newElevation));

    // Calculate azimuth and elevation from new positions
    const azEl = ECEFToAzEl(
      { x: newX, y: newY, z: newZ },
      observerECEF,
      observerLatitude,
      observerLongitude
    );

    // Update history
    const newHistory = [...sat.history, { azimuth: azEl.azimuth, elevation: azEl.elevation }];
    if (newHistory.length > 60) newHistory.shift(); // Keep last 60 points (1 minute at 1Hz)

    return {
      ...sat,
      azimuth: azEl.azimuth,
      elevation: azEl.elevation,
      positionECEF: { x: newX, y: newY, z: newZ },
      history: newHistory,
    };
  });
}

//--------------------------------------
//  SV Data Table Component
//--------------------------------------
// Remove initialTableSatellites since we'll populate from serial data
// function createSatelliteData(prn, azimuth, elevation, signalStrength, health, blockType) {
//   return { prn, azimuth, elevation, signalStrength, health, blockType };
// }

// function GPSSatelliteTable
function GPSSatelliteTable({ tableSatellites }) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} size="small" aria-label="GPS Satellite table">
        <TableHead>
          <TableRow>
            <TableCell>PRN</TableCell>
            <TableCell align="right">Azimuth (°)</TableCell>
            <TableCell align="right">Elevation (°)</TableCell>
            <TableCell align="right">Signal Strength (SNR) dB</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableSatellites.map((satellite) => (
            <TableRow key={satellite.PRN}>
              <TableCell component="th" scope="row">{satellite.PRN}</TableCell>
              <TableCell align="right">{satellite.Azimuth}</TableCell>
              <TableCell align="right">{satellite.Elevation}</TableCell>
              <TableCell align="right">{satellite.SNR}</TableCell>
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
    py: true,
    m: true,
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
      py: event.target.checked,
      m: event.target.checked,
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
  const isIndeterminate = checked.ca !== checked.py || checked.py !== checked.m;

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

      {/* Child Checkboxes (C/A, P/Y, M) */}
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
          label="P/Y"
          control={
            <Checkbox
              checked={checked.py}
              onChange={handleChangeCodeType}
              name="py"
              color="warning"
            />
          }
        />
        <FormControlLabel
          label="M"
          control={
            <Checkbox
              checked={checked.m}
              onChange={handleChangeCodeType}
              name="m"
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
  // State for table satellites (initialize as empty array)
  const [tableSatellites, setTableSatellites] = useState([]);

  // State for sky plot satellites
  const [skySatellites, setSkySatellites] = useState(generateInitialSatellites());

  // State to track the current theme mode
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Toggle between light and dark modes
  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const handleButtonClick = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000); // Confetti disappears after 3 seconds
  };

  // Define the light and dark themes
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  // Effect to update satellite positions every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Update skySatellites
      setSkySatellites((prevSatellites) => updateSatellitePositions(prevSatellites));

      // Optionally, update tableSatellites if needed
      // For now, we'll keep tableSatellites static
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

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

          {/* Sky Plot */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Sky Plot
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <SkyPlot
                satellites={skySatellites}
                observerPos={observerECEF}
                observerLat={observerLatitude}
                observerLon={observerLongitude}
              />
            </Box>
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
          <SerialPortComponent setTableSatellites={setTableSatellites} />
        </Grid>

      </Stack>
    </ThemeProvider>
  );
}

//--------------------------------------
//  SerialPortComponent
//--------------------------------------
function SerialPortComponent({ setTableSatellites }) {
  const [ports, setPorts] = useState([]); // Available serial ports
  const [selectedPort, setSelectedPort] = useState(null); // Selected COM port
  const [serialData, setSerialData] = useState(''); // Serial data to display
  const [isPortOpen, setIsPortOpen] = useState(false); // Track if port is open
  const [parsedData, setParsedData] = useState([]); // Parsed satellite data
  const [newDataReceived, setNewDataReceived] = useState(false); // Flag for new data

  const dataBufferRef = useRef(''); // Buffer for incoming data

  // Request available ports on page load
  useEffect(() => {
    async function getPorts() {
      if ("serial" in navigator) {
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
        await selectedPort.open({ baudRate: 9600 }); // Open the port with a baud rate of 9600
        setIsPortOpen(true);

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = selectedPort.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        // Continuously read data from the port
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break; // Exit the loop when no more data
          }
          if (value) {
            // Append new data to the buffer
            dataBufferRef.current += value;

            // Process complete lines
            let lines = dataBufferRef.current.split('\n');
            dataBufferRef.current = lines.pop(); // Keep the incomplete line in the buffer

            lines.forEach((line) => {
              line = line.trim();
              if (line) {
                // Update serialData state for display
                setSerialData((prevData) => prevData + line + '\n');

                // Parse the line if it's a GSV sentence
                if (
                  line.startsWith('$GPGSV') ||
                  line.startsWith('$GLGSV') ||
                  line.startsWith('$GAGSV') ||
                  line.startsWith('$GBGSV')
                ) {
                  const satellites = parseGsvSentence(line);
                  if (satellites.length > 0) {
                    setParsedData((prevData) => {
                      // Update parsedData with new satellite info
                      const updatedData = [...prevData];
                      satellites.forEach((sat) => {
                        const index = updatedData.findIndex((s) => s.PRN === sat.PRN);
                        if (index !== -1) {
                          updatedData[index] = { ...updatedData[index], ...sat };
                        } else {
                          updatedData.push(sat);
                        }
                      });
                      return updatedData;
                    });
                    setNewDataReceived(true);
                  }
                }
              }
            });
          }
        }
        reader.releaseLock();
      } catch (error) {
        console.error('Error reading from serial port:', error);
      }
    }
  };

  // Function to request a new serial port
  const handleRequestPort = async () => {
    if ("serial" in navigator) {
      try {
        const port = await navigator.serial.requestPort(); // User selects a port from the browser dialog
        setPorts((prevPorts) => [...prevPorts, port]); // Add new port to the list
        setSelectedPort(port);
      } catch (error) {
        console.error('Error requesting serial port:', error);
      }
    }
  };

  // Function to parse GSV sentences manually
  function parseGsvSentence(line) {
    const fields = line.split(',');
    const satellites = [];

    // Each GSV sentence contains up to 4 satellites
    for (let i = 4; i < fields.length - 4; i += 4) {
      const prn = parseInt(fields[i], 10);
      const elevation = parseInt(fields[i + 1], 10);
      const azimuth = parseInt(fields[i + 2], 10);
      const snr = parseInt(fields[i + 3], 10);

      if (!isNaN(prn)) {
        satellites.push({
          PRN: prn,
          Elevation: isNaN(elevation) ? 'N/A' : elevation,
          Azimuth: isNaN(azimuth) ? 'N/A' : azimuth,
          SNR: isNaN(snr) ? 'N/A' : snr,
        });
      }
    }

    return satellites;
  }

  // Effect to update the display every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (newDataReceived) {
        // Update the tableSatellites state in the main App component
        setTableSatellites(parsedData);
        setNewDataReceived(false);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [newDataReceived, parsedData, setTableSatellites]);

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
          <MenuItem value="" disabled>
            <em>Select a COM port</em>
          </MenuItem>
          {ports.map((port, index) => (
            <MenuItem key={index} value={port}>
              {port.getInfo ? JSON.stringify(port.getInfo()) : `Port ${index + 1}`}
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
      </Box>

      {/* Add the parsed satellite data table */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Parsed Satellite Data
        </Typography>
        <GPSSatelliteTable tableSatellites={parsedData} />
      </Box>
    </Container>
  );
}

export default App;
