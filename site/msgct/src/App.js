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
import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Switch, Container, Button, Typography, Box, Stack, Grid } from '@mui/material';
import { Helmet } from 'react-helmet';
import Confetti from 'react-confetti';
import GPSSatelliteTable from './components/GPSSatelliteTable';
import PositionSourceSelector from './components/PositionSourceSelector';
import SelectSVsOfInterest from './components/SelectSVsOfInterest';
import SerialPortComponent from './components/SerialPortComponent';
import { fetchAlmanacData } from './utils/fetchData';
import { calculateSatellitePosition, calculateElevationAzimuth } from './utils/gpsCalculations';
import './App.css';
import logo from './logo_msgct.png';

// #ifdef my problems away
let SkyPlot;
if (process.env.NODE_ENV !== 'test') {
  SkyPlot = require('./components/SkyPlot').default;
}

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
// Globals
//-------------------------------------
export let gpsAlmanacDataGlobal = [];
export const setGpsAlmanacDataGlobal = (data) => {
  gpsAlmanacDataGlobal = data;
};
export const getGpsAlmanacDataGlobal = () => gpsAlmanacDataGlobal;

let userPosition = { lat: 45.0, lon: -93.0, alt: 0.0 };
export const setUserPosition = (lat, lon, alt) => {
  userPosition = { lat, lon, alt };
};
export const getUserPosition = () => userPosition;

export let computedSatellitesGlobal = [];
export const setComputedSatellitesGlobal = (data) => {
  computedSatellitesGlobal = data;
};
export const getComputedSatellitesGlobal = () => computedSatellitesGlobal;

const initialTableSatellites = [];

//--------------------------------------
//  Main App Component
//--------------------------------------
function App() {
  const [tableSatellites, setTableSatellites] = useState(initialTableSatellites);
  const [satelliteHistories, setSatelliteHistories] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef(null);
  const [positionSource, setPositionSource] = useState('manual');
  const [manualPosition, setManualPosition] = useState({ lat: 45.0, lon: -93.0, alt: 0.0 });
  const [userPositionState, setUserPositionState] = useState({ lat: 45.0, lon: -93.0, alt: 0.0 });

  const handlePositionSourceChange = (event) => {
    setPositionSource(event.target.value);
  };

  const handlePositionUpdate = (position) => {
    if (positionSource === 'receiver') {
      setUserPositionState(position);
    }
  };

  useEffect(() => {
    if (positionSource === 'device') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, altitude } = position.coords;
            setUserPositionState({ lat: latitude, lon: longitude, alt: altitude || 0 });
          },
          (error) => {
            console.error('Error getting device position:', error);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    } else if (positionSource === 'manual') {
      setUserPositionState(manualPosition);
    }
  }, [positionSource, manualPosition]);

  useEffect(() => {
    setUserPosition(userPositionState.lat, userPositionState.lon, userPositionState.alt);
  }, [userPositionState]);

  const updateSatellitePositions = () => {
    if (gpsAlmanacDataGlobal.length > 0) {
      const currentTimeUTC = Date.now() / 1000;
      const gpsUtcOffset = 18; // Adjust this if there are additional leap seconds.
      const currentTimeGPST = currentTimeUTC + gpsUtcOffset;
      
      const computedSatellites = gpsAlmanacDataGlobal.map((satellite) => {
        const ecefPosition = calculateSatellitePosition(satellite, currentTimeGPST);
        const { elevation, azimuth, snr } = calculateElevationAzimuth(ecefPosition, getUserPosition());
        return { ID: satellite.ID, elevation, azimuth, snr };
      }).filter((sat) => sat.elevation > 0);

      setComputedSatellitesGlobal(computedSatellites);
      setTableSatellites(computedSatellites);
      calculateHistories();
    }
  };

  const calculateHistories = () => {
    if (gpsAlmanacDataGlobal.length > 0) {
      const timeWindow = 6 * 60 * 60; // 6 hours in seconds
      const timeStep = 60; // Time step in seconds
      const numberOfSteps = Math.floor(timeWindow / timeStep);
      const histories = {};
      const currentTime = Date.now() / 1000;

      for (let i = numberOfSteps; i >= 0; i--) {
        const t = currentTime - i * timeStep;

        const computedSatellites = gpsAlmanacDataGlobal.map((satellite) => {
          const ecefPosition = calculateSatellitePosition(satellite, t);
          const { elevation, azimuth } = calculateElevationAzimuth(ecefPosition, getUserPosition());
          return { ID: satellite.ID, elevation, azimuth, timestamp: t };
        }).filter((sat) => sat.elevation > 0);

        computedSatellites.forEach((sat) => {
          if (!histories[sat.ID]) {
            histories[sat.ID] = [];
          }
          histories[sat.ID].push({ elevation: sat.elevation, azimuth: sat.azimuth, timestamp: sat.timestamp });
        });
      }

      setSatelliteHistories(histories);
    }
  };

  const handleButtonClick = async () => {
    try {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);

      const data = await fetchAlmanacData();
      setGpsAlmanacDataGlobal(data.satellites);
      updateSatellitePositions();

      if (!intervalRef.current) {
        intervalRef.current = setInterval(updateSatellitePositions, 1000);
      }
    } catch (error) {
      console.error('Failed to update satellite data:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showConfetti && <Confetti />}

      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta charSet={meta.meta.charset} />
        <meta name="keywords" content={meta.meta.name.keywords} />
      </Helmet>

      <Container style={{ marginTop: '50px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} className='Logo' alt='MSGCT Logo' />
            <Typography variant="h4">
              Multi-Source GNSS Constellation Tracker
            </Typography>
          </Box>
          <Typography>Dark Mode:</Typography>
          <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} id="darkModeSwitch" />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleButtonClick}
          sx={{ mt: 2 }}
        >
          Get Latest Almanac
        </Button>
      </Container>

      <Stack spacing={2} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              GPS Satellite Data
            </Typography>
            <GPSSatelliteTable tableSatellites={tableSatellites} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Live Sky Plot
            </Typography>
            {SkyPlot && (
            <Grid item xs={12} md={6}>
              <SkyPlot satellites={tableSatellites} satelliteHistories={satelliteHistories} darkMode={darkMode} />
            </Grid>
          )}s
            
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            User Position Source
          </Typography>
          <PositionSourceSelector
            positionSource={positionSource}
            onPositionSourceChange={handlePositionSourceChange}
            manualPosition={manualPosition}
            setManualPosition={setManualPosition}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Select SVs of Interest
          </Typography>
          <SelectSVsOfInterest />
        </Grid>

        <Grid item xs={12}>
          <SerialPortComponent onPositionUpdate={handlePositionUpdate} />
        </Grid>
      </Stack>
    </ThemeProvider>
  );
}

export default App;

