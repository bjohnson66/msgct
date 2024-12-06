/*
  -----------------------------------
  Acknowledgments
  -----------------------------------
  
  This project utilized OpenAI's ChatGPT (GPT-4o) to assist in the development and optimization of various components, including:

  - Generating and refining React components for the application structure.
  - Creating stubs and doing basic JSON conversion during early development.
  - Assisting in research for physics formulas and calculations needed to solve the problem of GPS (calculating and converting SV position), specifically TLE calculations

  All AI-generated code required thorough review and refinement. Its output was by no means perfect or complete without my direct involvement. Specific prompts, corrections,
  and domain expertise—provided by me, Bradley Johnson—were essential in shaping the app. The AI tools served as accelerators for routine development work, which was epsecailly
  impactful when expanding original functionality out to include all constellations. 

  ------------------------------------------------------------------------------
  The MGNSS capability of this App was developed with assistance from OpenAI's GPT-4o model and O1 preview models. We took the initial, GPS only, build and expanded it into a
  comprehensive MGNSS solution. To that end, the AI played a significant role in handling boilerplate code and repetitive tasks, allowing me to focus on higher-level architecture
  and system design.
  The MGNSS-expansion process was contained to this single chat session:
  See: https://chatgpt.com/share/6739764f-f0c4-800d-8fb9-10f6a4b99790
  Files changed: 
        modified:   msgct/src/App.js
        modified:   msgct/src/components/GPSSatelliteTable.js
        modified:   msgct/src/components/SelectSVsOfInterest.js
        modified:   msgct/src/components/SerialPortComponent.js
        modified:   msgct/src/components/SkyPlot.js
        modified:   msgct/src/utils/fetchData.js
        modified:   msgct/src/utils/gpsCalculations.js
  It is important to note that the AI-generated code was not taken at face value, nor was it copy-pasted directly into the project. Every line of code provided by the AI was 
  carefully reviewed to ensure it aligned with the overall architecture and project requirements. Significant manual tweaks were made throughout the development process, and in 
  many cases, deviations from the AI's implementation were necessary. The AI acted as a tool to streamline the more tedious aspects of development, but the overall structure 
  and execution relied on deliberate decisions informed by Bradley Johnson's knowledge of GPS and MGNSS systems.
  ------------------------------------------------------------------------------
*/
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {ThemeProvider,createTheme,CssBaseline,Switch,Container,Typography,Box,Stack,Grid,Checkbox,IconButton,TextField,} from '@mui/material';
import { Helmet } from 'react-helmet';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import GPSSatelliteTable from './components/GPSSatelliteTable';
import PositionSourceSelector from './components/PositionSourceSelector';
import SelectSVsOfInterest from './components/SelectSVsOfInterest';
import SerialPortComponent from './components/SerialPortComponent';
import { fetchAlmanacByFilename, fetchBlockByFilename } from './utils/fetchData';
import {calculateSatellitePosition,calculateElevationAzimuth, calculateSatellitePositionFromTLE,} from './utils/gpsCalculations';
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
  description:
    'Monitor the status of GNSS Constellations in real time or in the past.',
  meta: {
    charset: 'utf-8',
    name: {
      keywords: 'react,meta,document,html,tags',
    },
  },
};

//-------------------------------------
// Globals
//-------------------------------------
export let mgnssAlmanacDataGlobal = {
  gps: [],
  qzss: [],
  galileo: [],
  beidou: [],
  glonass: []
};

// GPS Setters and Getters
export const setGpsAlmanacDataGlobal = (data) => {
  mgnssAlmanacDataGlobal.gps = data;
};
export const getGpsAlmanacDataGlobal = () => mgnssAlmanacDataGlobal.gps;

// QZSS Setters and Getters
export const setQzssAlmanacDataGlobal = (data) => {
  mgnssAlmanacDataGlobal.qzss = data;
};
export const getQzssAlmanacDataGlobal = () => mgnssAlmanacDataGlobal.qzss;

// Galileo Setters and Getters
export const setGalileoAlmanacDataGlobal = (data) => {
  mgnssAlmanacDataGlobal.galileo = data;
};
export const getGalileoAlmanacDataGlobal = () => mgnssAlmanacDataGlobal.galileo;

// Beidou Setters and Getters
export const setBeidouAlmanacDataGlobal = (data) => {
  mgnssAlmanacDataGlobal.beidou = data;
};
export const getBeidouAlmanacDataGlobal = () => mgnssAlmanacDataGlobal.beidou;

// GLONASS Setters and Getters
export const setGlonassAlmanacDataGlobal = (data) => {
  mgnssAlmanacDataGlobal.glonass = data;
};
export const getGlonassAlmanacDataGlobal = () => mgnssAlmanacDataGlobal.glonass;

// Function to reset all data (optional)
export const resetMgnssAlmanacDataGlobal = () => {
  mgnssAlmanacDataGlobal = {
    gps: [],
    qzss: [],
    galileo: [],
    beidou: [],
    glonass: []
  };
};

export let mgnssRelativePositionsGlobal = {
  gps: [],
  qzss: [],
  galileo: [],
  beidou: [],
  glonass: []
};

// GPS Setters and Getters
export const setGpsRelativePositionsGlobal = (data) => {
  mgnssRelativePositionsGlobal.gps = data;
};
export const getGpsRelativePositionsGlobal = () => mgnssRelativePositionsGlobal.gps;

// QZSS Setters and Getters
export const setQzssRelativePositionsGlobal = (data) => {
  mgnssRelativePositionsGlobal.qzss = data;
};
export const getQzssRelativePositionsGlobal = () => mgnssRelativePositionsGlobal.qzss;

// Galileo Setters and Getters
export const setGalileoRelativePositionsGlobal = (data) => {
  mgnssRelativePositionsGlobal.galileo = data;
};
export const getGalileoRelativePositionsGlobal = () => mgnssRelativePositionsGlobal.galileo;

// Beidou Setters and Getters
export const setBeidouRelativePositionsGlobal = (data) => {
  mgnssRelativePositionsGlobal.beidou = data;
};
export const getBeidouRelativePositionsGlobal = () => mgnssRelativePositionsGlobal.beidou;

// GLONASS Setters and Getters
export const setGlonassRelativePositionsGlobal = (data) => {
  mgnssRelativePositionsGlobal.glonass = data;
};
export const getGlonassRelativePositionsGlobal = () => mgnssRelativePositionsGlobal.glonass;

// Reset function (optional)
export const resetMgnssRelativePositionsGlobal = () => {
  mgnssRelativePositionsGlobal = {
    gps: [],
    qzss: [],
    galileo: [],
    beidou: [],
    glonass: []
  };
};


//--------------------------------------
//  Main App Component
//--------------------------------------
function App() {
  const [showLabels, setShowLabels] = useState(true);
  const [selectedConstellations, setSelectedConstellations] = useState({
    gps: true,
    IIR: true,
    IIRM: true,
    IIF: true,
    III: true,
    other: true,
    qzss: true,
    galileo: true,
    glonass: true,
    beidou: true,
  });
  const [satelliteHistories, setSatelliteHistories] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [availableAlmanacs, setAvailableAlmanacs] = useState({
    gps: [],
    qzss: [],
    galileo: [],
    beidou: [],
    glonass: []
  });
  const [selectedAlmanac, setSelectedAlmanac] = useState('');
  const [positionSource, setPositionSource] = useState('manual');
  const [manualPosition, setManualPosition] = useState({
    lat: 45.0,
    lon: -93.0,
    alt: 0.0,
  });
  const [userPositionState, setUserPositionState] = useState({
    lat: 45.0,
    lon: -93.0,
    alt: 0.0,
  });
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [manualGPST, setManualGPST] = useState(
    Math.floor(Date.now() / 1000 - 18 - 315964800)
  );
  const [gpsWeekNumber, setGpsWeekNumber] = useState(0);
  const [selectedSatellites, setSelectedSatellites] = useState({
    gps: {},
    qzss: {},
    galileo: {},
    beidou: {},
    glonass: {}
  });
  const MASK_ANGLE = 5; //degrees above horizon

  const intervalRef = useRef(null);

  const handleConstellationSelectionChange = (selection) => {
    setSelectedConstellations(selection);
  };

  const handlePositionSourceChange = (event) => {
    setPositionSource(event.target.value);
  };

  const handlePositionUpdate = (position) => {
    if (positionSource === 'receiver') {
      console.log('Updating user position from receiver:', position);
      setUserPositionState(position);
    } else {
      console.log('Ignoring receiver position update since positionSource is:', positionSource);
    }
  };

  const getCurrentTime = useCallback(() => {
    const UTC_GPST_OFFSET = 18;
    const GPS_SEC_IN_WEEK = 604800;
    const UNIX_GPS_EPOCH_DIFF = 315964800; // Difference between Unix and GPS epoch

    let currentTimeGPST  = Date.now() / 1000 - UTC_GPST_OFFSET - UNIX_GPS_EPOCH_DIFF;

    if (!useCurrentTime) {
      currentTimeGPST  = manualGPST;
    }
    const currentTimeUTC = useCurrentTime? Date.now() / 1000 : currentTimeGPST + UTC_GPST_OFFSET + UNIX_GPS_EPOCH_DIFF;


    //We need to make sure that time is properly accounting for GPST week and GPST ToW
    //This line means that currentTime is the number of seconds since the GPS week that the almanac is from
    // In a sense, currentTime is now in GPS ToW but we don't need to worry about making sure it is bounded,
    // Adjust the current time to the GPS Time of Week by subtracting the number of seconds since the start of the GPS week
    currentTimeGPST  -= gpsWeekNumber * GPS_SEC_IN_WEEK;

    // ToW may roll over, so ensure it's bounded within a single week (0 to 604800 seconds)
    currentTimeGPST  = currentTimeGPST  % GPS_SEC_IN_WEEK;

    return { currentTimeGPST, currentTimeUTC };
  }, [useCurrentTime, manualGPST, gpsWeekNumber]);

  useEffect(() => {
    if (positionSource === 'device') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, altitude } = position.coords;
            setUserPositionState({
              lat: latitude,
              lon: longitude,
              alt: altitude || 0,
            });
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
    } else if (positionSource === 'receiver') {
      // No action needed here; position updates come from handlePositionUpdate
    }
  }, [positionSource, manualPosition]);

  const calculateHistories = useCallback(() => {
    const timeWindow = 3 * 60 * 60; // 3 hours in seconds
    const timeStep = 60; // Time step in seconds
    const numberOfSteps = Math.floor(timeWindow / timeStep);
    const newHistories = {};
  
    const { currentTimeGPST, currentTimeUTC } = getCurrentTime();
  
    Object.keys(mgnssAlmanacDataGlobal).forEach((constellation) => {
      if (selectedConstellations[constellation] && mgnssAlmanacDataGlobal[constellation].length > 0) {
  
        for (let i = numberOfSteps; i >= 0; i--) {
          // Calculate time 't' for each step
          let t;
          if (constellation === 'gps' || constellation === 'qzss') {
            t = currentTimeGPST - i * timeStep;
          } else {
            t = currentTimeUTC - i * timeStep;
          }
  
          let computedSatellites;
  
          if (constellation === 'gps' || constellation === 'qzss') {
            computedSatellites = mgnssAlmanacDataGlobal[constellation].map((satellite) => {
              const ecefPosition = calculateSatellitePosition(satellite, t);
              const { elevation, azimuth } = calculateElevationAzimuth(
                ecefPosition,
                userPositionState
              );
              return { ID: satellite.ID, elevation, azimuth, timestamp: t };
            });
          } else {
            computedSatellites = mgnssAlmanacDataGlobal[constellation].map((satellite) => {
              const ecefPosition = calculateSatellitePositionFromTLE(
                satellite.Line1,
                satellite.Line2,
                t
              );
              if (!ecefPosition) {
                return null; // Skip if position could not be calculated
              }
              const { elevation, azimuth } = calculateElevationAzimuth(
                ecefPosition,
                userPositionState
              );
              return { ID: satellite.ID || satellite.Name, elevation, azimuth, timestamp: t };
            }).filter(sat => sat !== null);
          }
  
          computedSatellites.forEach((sat) => {
            if (!newHistories[constellation]) {
              newHistories[constellation] = {};
            }
            if (!newHistories[constellation][sat.ID]) {
              newHistories[constellation][sat.ID] = [];
            }
            newHistories[constellation][sat.ID].push({
              elevation: sat.elevation > 0 ? sat.elevation : 0,
              azimuth: sat.azimuth,
              timestamp: sat.timestamp,
            });
          });
        }
      }
    });
  
    setSatelliteHistories(newHistories);
  }, [getCurrentTime, userPositionState, selectedConstellations]);
  

  const updateSatellitePositions = useCallback(() => {
    const { currentTimeGPST, currentTimeUTC } = getCurrentTime();
  
    Object.keys(mgnssAlmanacDataGlobal).forEach((constellation) => {
      if (selectedConstellations[constellation] && mgnssAlmanacDataGlobal[constellation].length > 0) {
        let computedSatellites;
  
        if (constellation === 'gps') {
          computedSatellites = mgnssAlmanacDataGlobal.gps
            .filter((satellite) => {
              const blockType = satellite.BlockType; // 'IIR', 'IIR-M', 'IIF', or 'III'

              // Check if this block type is currently selected
              if (blockType === 'IIR' && !selectedConstellations.IIR) return false;
              if (blockType === 'IIRM' && !selectedConstellations.IIRM) return false;
              if (blockType === 'IIF' && !selectedConstellations.IIF) return false;
              if (blockType === 'III' && !selectedConstellations.III) return false;
              if (blockType === 'other' && !selectedConstellations.other) return false;

              return true;
            })
            .map((satellite) => {
              const ecefPosition = calculateSatellitePosition(satellite, currentTimeGPST);
              const { elevation, azimuth, snr } = calculateElevationAzimuth(
                ecefPosition,
                userPositionState
              );
              const health = satellite.Health;
              return { ID: satellite.ID, elevation, azimuth, snr, health };
            })
            .filter((sat) => sat.elevation > MASK_ANGLE);
        }
        else if (constellation === 'qzss') {
          // Use existing calculateSatellitePosition function
          computedSatellites = mgnssAlmanacDataGlobal[constellation]
            .map((satellite) => {
              const ecefPosition = calculateSatellitePosition(satellite, currentTimeGPST);
              const { elevation, azimuth, snr } = calculateElevationAzimuth(
                ecefPosition,
                userPositionState
              );
              const health = satellite.Health;
              return { ID: satellite.ID, elevation, azimuth, snr, health };
            })
            .filter((sat) => sat.elevation > MASK_ANGLE);
        } 
         else {
          // For other constellations, use TLE-based calculation
          computedSatellites = mgnssAlmanacDataGlobal[constellation]
            .map((satellite) => {
              const ecefPosition = calculateSatellitePositionFromTLE(
                satellite.Line1,
                satellite.Line2,
                currentTimeUTC
              );
  
              if (!ecefPosition) {
                return null; // Skip satellite if position could not be calculated
              }
  
              const { elevation, azimuth, snr } = calculateElevationAzimuth(
                ecefPosition,
                userPositionState
              );
              // Assume satellite is healthy; TLE data does not provide health info
              const health = '000';
              return { ID: satellite.ID || satellite.Name, elevation, azimuth, snr, health };
            })
            .filter((sat) => sat && sat.elevation > MASK_ANGLE);
        }
  
        // Save computed satellites to the correct global
        switch (constellation) {
          case "gps":
            setGpsRelativePositionsGlobal(computedSatellites);
            break;
          case "qzss":
            setQzssRelativePositionsGlobal(computedSatellites);
            break;
          case "galileo":
            setGalileoRelativePositionsGlobal(computedSatellites);
            break;
          case "beidou":
            setBeidouRelativePositionsGlobal(computedSatellites);
            break;
          case "glonass":
            setGlonassRelativePositionsGlobal(computedSatellites);
            break;
          default:
            console.warn(`Unknown constellation: ${constellation}`);
        }
      }
    });
  
    // Call calculateHistories once after all constellations are updated
    calculateHistories();
  }, [getCurrentTime, userPositionState, selectedConstellations, calculateHistories]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (useCurrentTime) {
      intervalRef.current = setInterval(updateSatellitePositions, 1000);
    } else{
      updateSatellitePositions();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateSatellitePositions, useCurrentTime]);

  useEffect(() => {
    const loadAllManifests = async () => {
      const constellations = ['gps', 'qzss', 'galileo', 'beidou', 'glonass'];
      const newAvailableAlmanacs = {};
  
      for (const constellation of constellations) {
        try {
          const response = await fetch(`/sv_data/${constellation}_data/manifest.json`);
          const filenames = await response.json();
          // Extract timestamps from filenames and store them
          newAvailableAlmanacs[constellation] = filenames.map((filename) => {
            const timestamp = parseInt(filename.split('_')[1].split('.')[0], 10);
            return { filename, timestamp };
          });
        } catch (error) {
          console.error(`Failed to load manifest for ${constellation}:`, error);
          newAvailableAlmanacs[constellation] = [];
        }
      }
  
      setAvailableAlmanacs(newAvailableAlmanacs);
    };
  
    loadAllManifests(); // Initial load
  
    // Set up daily manifest reloading
    const manifestInterval = setInterval(loadAllManifests, 24 * 60 * 60 * 1000); // Reload every 24 hours
  
    return () => {
      clearInterval(manifestInterval); // Cleanup on unmount
    };
  }, []);
  

  const loadSelectedAlmanacs = useCallback(async (selectedAlmanacs) => {
    const constellations = Object.keys(selectedAlmanacs);
    let gpsDataGood = false; // Track if valid GPS data has been loaded
    let qzssGpsBackup = [];  // Temporary storage for GPS PRNs in QZSS
  
    for (const constellation of constellations) {
      const filename = selectedAlmanacs[constellation];
      if (filename) {
        const data = await fetchAlmanacByFilename(filename, constellation);
        if (data) {
          switch (constellation) {
            case 'gps':
              const block = await fetchBlockByFilename(filename)
              setGpsWeekNumber(data.week); // Set GPS week number
              setGpsAlmanacDataGlobal(data.satellites);
              gpsDataGood = true;
              break;
  
            case 'qzss':
              // Extract GPS satellites as a backup if GPS data is missing
              qzssGpsBackup = data.satellites.filter((satellite) => {
                const idNum = parseInt(satellite.ID, 10);
                return idNum >= 1 && idNum <= 32; // Keep GPS PRNs (1-32)
              });
  
              // Remove GPS satellites from QZSS data
              data.satellites = data.satellites.filter((satellite) => {
                const idNum = parseInt(satellite.ID, 10);
                return !(idNum >= 1 && idNum <= 32); // Exclude GPS PRNs
              });
  
              setQzssAlmanacDataGlobal(data.satellites);
              break;
  
            case 'galileo':
              setGalileoAlmanacDataGlobal(data.satellites);
              break;
  
            case 'beidou':
              setBeidouAlmanacDataGlobal(data.satellites);
              break;
  
            case 'glonass':
              setGlonassAlmanacDataGlobal(data.satellites);
              break;
  
            default:
              console.warn(`Unknown constellation: ${constellation}`);
          }
        }
      }
    }
  
    // Load GPS data from QZSS if no valid GPS data was loaded
    if (!gpsDataGood && qzssGpsBackup.length > 0) {
      console.warn('No GPS data found; using GPS satellites from QZSS almanac.');
      setGpsAlmanacDataGlobal(qzssGpsBackup);
    }
  
    // Update satellite positions after loading new almanacs
    updateSatellitePositions();
  }, [updateSatellitePositions]);
  
  const selectBestAlmanacs = useCallback(() => {
    const selectedTime = useCurrentTime
      ? Math.floor(Date.now() / 1000)
      : manualGPST + 315964800 + 18; // Convert GPST to UTC time in seconds
  
    const newSelectedAlmanacs = {};
  
    Object.keys(availableAlmanacs).forEach((constellation) => {
      const almanacs = availableAlmanacs[constellation];
  
      // Find the almanac file with the closest timestamp not after the selected time
      const suitableAlmanacs = almanacs.filter((almanac) => almanac.timestamp <= selectedTime);
  
      if (suitableAlmanacs.length > 0) {
        const bestAlmanac = suitableAlmanacs.reduce((prev, curr) =>
          curr.timestamp > prev.timestamp ? curr : prev
        );
  
        // Only load new almanac if it's different from the currently selected one
        if (selectedAlmanac[constellation] !== bestAlmanac.filename) {
          newSelectedAlmanacs[constellation] = bestAlmanac.filename;
        }
      } else {
        console.warn(`No suitable almanac found for ${constellation} at time ${selectedTime}`);
      }
    });
  
    if (Object.keys(newSelectedAlmanacs).length > 0) {
      // Update selected almanacs and load them
      setSelectedAlmanac((prevSelectedAlmanac) => ({
        ...prevSelectedAlmanac,
        ...newSelectedAlmanacs,
      }));
  
      // Load the selected almanac files
      loadSelectedAlmanacs(newSelectedAlmanacs);
    }
  }, [availableAlmanacs, useCurrentTime, manualGPST, selectedAlmanac, loadSelectedAlmanacs]);
  

  useEffect(() => {
    if (availableAlmanacs && Object.keys(availableAlmanacs).length > 0) {
      selectBestAlmanacs();
    }
  }, [useCurrentTime, manualGPST, availableAlmanacs, selectBestAlmanacs]);

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
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta charSet={meta.meta.charset} />
        <meta name="keywords" content={meta.meta.name.keywords} />
      </Helmet>

      <Container style={{ marginTop: '50px' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} className="Logo" alt="MSGCT Logo" />
            <Typography variant="h4">
              MGNSS.live
            </Typography>
          </Box>
          <Typography>Dark Mode:</Typography>
          <Switch
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
            id="darkModeSwitch"
          />
        </Box>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Time Control (GPST)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={useCurrentTime}
              onChange={() => setUseCurrentTime(!useCurrentTime)}
            />
            <Typography>Use Current Time</Typography>
            {!useCurrentTime && (
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                <IconButton
                  onClick={() => setManualGPST(manualGPST - 15 * 60)}
                >
                  <ArrowDownward />
                </IconButton>
                <TextField
                  label="GPST Time (seconds)"
                  type="number"
                  value={manualGPST}
                  onChange={(e) => setManualGPST(parseFloat(e.target.value))}
                />
                <IconButton
                  onClick={() => setManualGPST(manualGPST + 15 * 60)}
                >
                  <ArrowUpward />
                </IconButton>
              </Box>
            )}
          </Box>
        </Grid>
      </Container>
      <Stack spacing={2} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={1}>
          <Grid item xs={11} md={3.5}>
            <Typography variant="h6" gutterBottom>
              Live Sky Plot
            </Typography>
            {SkyPlot && (
              <SkyPlot
                mgnssRelativePositions={mgnssRelativePositionsGlobal}
                selectedConstellations={selectedConstellations}
                selectedSatellites={selectedSatellites}
                darkMode={darkMode}
                satelliteHistories={satelliteHistories}
                showLabels={showLabels}
              />
            )}
            <Typography>Show Satellite Labels:</Typography>
            <Switch
              checked={showLabels}
              onChange={() => setShowLabels(!showLabels)}
              id="showLabelsSwitch"
            />
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select SVs of Interest
              </Typography>
              <SelectSVsOfInterest onSelectionChange={handleConstellationSelectionChange} />
            </Grid>
          </Grid>
          <Grid item xs={11} md={8}>
            <Typography variant="h6" gutterBottom>
              GPS Satellite Data
            </Typography>
              <GPSSatelliteTable
                mgnssRelativePositions={mgnssRelativePositionsGlobal}
                selectedConstellations={selectedConstellations}
                selectedSatellites={selectedSatellites}
                setSelectedSatellites={setSelectedSatellites}
              />
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
            receiverPosition={userPositionState}
          />
        </Grid>
        <Grid item xs={12}>
          <SerialPortComponent onPositionUpdate={handlePositionUpdate} positionSource={positionSource} />
        </Grid>
      </Stack>
    </ThemeProvider>
  );
}

export default App;
