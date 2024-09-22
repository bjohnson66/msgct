import { ThemeProvider, createTheme, CssBaseline, Switch } from '@mui/material';  // Add CssBaseline and Switch imports
import { Button, Typography, Container, Box } from '@mui/material';
import Confetti from 'react-confetti';
import { Helmet } from 'react-helmet';  // Import Helmet for managing metadata
import * as React from 'react';
import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import {pink} from '@mui/material/colors';
import './App.css';


// Function to create GPS satellite data, mimicking GPS-153 receiver output
function createSatelliteData(prn, azimuth, elevation, signalStrength, health, blockType) {
  return { prn, azimuth, elevation, signalStrength, health, blockType };
}


// Mock dataset of satellites the receiver is currently seeing
const satellites = [
  createSatelliteData(1, 45, 30, 48, 'Healthy', 'Block IIR-M'),
  createSatelliteData(3, 120, 45, 40, 'Healthy', 'Block IIF'),
  createSatelliteData(6, 90, 20, 35, 'Healthy', 'Block IIR-M'),
  createSatelliteData(9, 180, 60, 50, 'Unhealthy', 'Block IIIA'),
  createSatelliteData(12, 270, 15, 42, 'Healthy', 'Block IIF'),
  createSatelliteData(17, 320, 70, 55, 'Healthy', 'Block IIR-M'),
];

function GPSSatelliteTable() {
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
          {satellites.map((satellite) => (
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


function App() {
  // State to track the current theme mode
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Toggle between light and dark modes
  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };
  
  const handleButtonClick = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000); // Confetti will disappear after 3 seconds
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

      {/*Title Banner of Page*/}
      <Container style={{ marginTop: '50px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           {/* Logo and Title */}
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo Image */}
            <img
              src="%PUBLIC_URL%/logo512.png" // Replace with your actual logo path
              alt="Logo"
              style={{ width: '50px', height: '50px', marginRight: '10px' }} // Adjust logo size and spacing
            />
            <Typography variant="h4">
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

      {/*Body of Page */}
      <Stack spacing={2}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2, md: 4 }}
        >
          <Container>
            <GPSSatelliteTable />
          </Container>
          <Container>
            <SelectSVsOfInterest />
          </Container>
        </Stack>
      </Stack>
    </ThemeProvider>
  );
}

export default App;

