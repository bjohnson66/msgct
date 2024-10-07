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
import * as d3 from 'd3';
import { Select, MenuItem, TextField } from '@mui/material';
import useEnhancedEffect from '@mui/material/utils/useEnhancedEffect';
import { RadioGroup, Radio, FormControl, FormLabel } from '@mui/material';

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
/*
* gpsAlmanacDataGlobal
* global variable to store GPS almanac data
*/
export let gpsAlmanacDataGlobal = [];
export const setGpsAlmanacDataGlobal = (data) => {
  gpsAlmanacDataGlobal = data;
};
export const getGpsAlmanacDataGlobal = () => gpsAlmanacDataGlobal;
/*
* userPosition
* global variable to store userPosition
*/
let userPosition = { lat: 45.0, lon: -93.0, alt: 0.0 };
export const setUserPosition = (lat, lon, alt) => {
  userPosition = { lat, lon, alt };
};
export const getUserPosition = () => userPosition;
/*
* prn, asmith, elevation, SNR for GPS
*/
export let computedSatellitesGlobal = [];
export const setComputedSatellitesGlobal = (data) => {
  computedSatellitesGlobal = data;
};
export const getComputedSatellitesGlobal = () => computedSatellitesGlobal;


/*
* Intitial state of SV table
*/
const initialTableSatellites = [];


//-------------------------------------
// Retreiving Almanac Data from Server
//-------------------------------------
const fetchAlmanacData = async () => {
  try {
    const response = await fetch('/sv_data/gps_data/gps_20241006_204720.json');
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

//-------------------------------------
// GPS Satellite Calculaitons - ECEF
//--------------------------------------
//See: https://gssc.esa.int/navipedia/index.php?title=GPS_and_Galileo_Satellite_Coordinates_Computation
// Constants
const GM = 3.986005e14; // Gravitational constant for Earth (m^3/s^2)
const OMEGA_DOT_E = 7.2921151467e-5; // Earth's rotation rate (rad/s)

function calculateSatellitePosition(satelliteData, t) {
  const {
    SQRT_A,               // Square root of the semi-major axis (meters^1/2)
    Eccentricity,         // Eccentricity
    OrbitalInclination,   // Orbital inclination (radians)
    RightAscenAtWeek,     // Right ascension of ascending node at reference time (radians)
    ArgumentOfPerigee,    // Argument of perigee (radians)
    MeanAnom,             // Mean anomaly at reference time (radians)
    TimeOfApplicability,  // Reference time (seconds)
    RateOfRightAscen      // Rate of right ascension (OMEGA_DOT) (rad/s)
  } = satelliteData;

  // Convert SQRT_A to semi-major axis
  const semiMajorAxis = Math.pow(SQRT_A, 2);

  // Compute mean motion (n)
  const meanMotion = Math.sqrt(GM / Math.pow(semiMajorAxis, 3));

  // Time since epoch (seconds)
  const deltaT = t - TimeOfApplicability;

  // Calculate the mean anomaly at time t
  const meanAnomaly = MeanAnom + meanMotion * deltaT;

  // Normalize mean anomaly to between 0 and 2π
  const normalizedMeanAnomaly = meanAnomaly % (2 * Math.PI);

  // Solve Kepler's equation for eccentric anomaly (iterative method)
  let eccentricAnomaly = normalizedMeanAnomaly;
  let previousEccentricAnomaly = 0;
  const tolerance = 1e-12;

  while (Math.abs(eccentricAnomaly - previousEccentricAnomaly) > tolerance) {
    previousEccentricAnomaly = eccentricAnomaly;
    eccentricAnomaly =
      normalizedMeanAnomaly + Eccentricity * Math.sin(eccentricAnomaly);
  }

  // Calculate the true anomaly
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + Eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - Eccentricity) * Math.cos(eccentricAnomaly / 2)
  );

  // Calculate the distance to the satellite
  const distance = semiMajorAxis * (1 - Eccentricity * Math.cos(eccentricAnomaly));

  // Compute the argument of latitude
  const argumentOfLatitude = ArgumentOfPerigee + trueAnomaly;

  // Correct the right ascension of ascending node
  const correctedRightAscension = RightAscenAtWeek + (RateOfRightAscen - OMEGA_DOT_E) * deltaT - OMEGA_DOT_E * TimeOfApplicability;

  // Position in orbital plane
  const xOrbital = distance * Math.cos(argumentOfLatitude);
  const yOrbital = distance * Math.sin(argumentOfLatitude);

  // Calculate ECEF coordinates (x, y, z)
  const cosInclination = Math.cos(OrbitalInclination);
  const sinInclination = Math.sin(OrbitalInclination);

  const x = xOrbital * Math.cos(correctedRightAscension) - yOrbital * Math.sin(correctedRightAscension) * cosInclination;
  const y = xOrbital * Math.sin(correctedRightAscension) + yOrbital * Math.cos(correctedRightAscension) * cosInclination;
  const z = yOrbital * sinInclination;

  return { x, y, z };
}



//--------------------------------------
// GPS SV Calculaiton topocentric coordinates
//--------------------------------------
// Function to convert ECEF coordinates of a satellite to topocentric (ENU) coordinates
// Takes in satellite position {x, y, z} and user position {lat, lon, alt} (latitude, longitude in radians)
function calculateElevationAzimuth(satellitePosition, userPosition) {
  const { lat, lon, alt } = userPosition; // User's geodetic position (latitude and longitude in radians)
  const { x: xs, y: ys, z: zs } = satellitePosition; // Satellite's position in ECEF coordinates

  // Convert user's geodetic position to ECEF coordinates
  const a = 6378137; // WGS-84 Earth semi-major axis (meters)
  const f = 1 / 298.257223563; // WGS-84 flattening factor
  const e2 = f * (2 - f); // Square of Earth's eccentricity

  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const cosLon = Math.cos(lon);
  const sinLon = Math.sin(lon);

  // Calculate radius of curvature in the prime vertical
  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);

  // User's ECEF coordinates
  const xUser = (N + alt) * cosLat * cosLon;
  const yUser = (N + alt) * cosLat * sinLon;
  const zUser = (N * (1 - e2) + alt) * sinLat;

  // Vector from user to satellite in ECEF
  const dx = xs - xUser;
  const dy = ys - yUser;
  const dz = zs - zUser;

  // Transform the vector to ENU (East-North-Up) coordinates
  const east = -sinLon * dx + cosLon * dy;
  const north = -sinLat * cosLon * dx - sinLat * sinLon * dy + cosLat * dz;
  const up = cosLat * cosLon * dx + cosLat * sinLon * dy + sinLat * dz;

  // Calculate the azimuth (radians)
  const azimuth = Math.atan2(east, north);
  const azimuthDegrees = (azimuth * 180) / Math.PI;
  
  // Calculate the elevation (radians)
  const horizontalDistance = Math.sqrt(east * east + north * north);
  const elevation = Math.atan2(up, horizontalDistance);
  const elevationDegrees = (elevation * 180) / Math.PI;

  return {
    elevation: elevationDegrees, // Elevation in degrees
    azimuth: (azimuthDegrees + 360) % 360, // Azimuth in degrees (normalized to 0-360 range)
    snr: estimateSNR(elevationDegrees) // Call SNR estimation based on elevation
  };
}

// Function to estimate SNR based on elevation angle (simple model)
// Higher elevations generally result in better signal quality due to less atmospheric interference
function estimateSNR(elevation) {
  // SNR estimation can be complex, depending on atmospheric models, hardware, etc.
  // Here's a simple model: the higher the elevation, the better the signal
  if (elevation <= 0) return 0; // Below horizon, no signal

  // Linearly estimate SNR, assuming 0 dB at 0° elevation and 50 dB at zenith (90°)
  const snr = Math.min(50, Math.max(0, elevation * (50 / 90)));
  return snr;
}

//--------------------------------------
//  SV Data Table Component
//--------------------------------------
function GPSSatelliteTable({ tableSatellites }) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} size="small" aria-label="GPS Satellite table">
        <TableHead>
          <TableRow>
            <TableCell>PRN</TableCell>
            <TableCell align="right">Elevation (°)</TableCell>
            <TableCell align="right">Azimuth (°)</TableCell>
            <TableCell align="right">SNR (dB)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableSatellites.map((satellite) => (
            <TableRow key={satellite.ID}>
              <TableCell component="th" scope="row">
                {satellite.ID}
              </TableCell>
              <TableCell align="right">{satellite.elevation.toFixed(2)}</TableCell>
              <TableCell align="right">{satellite.azimuth.toFixed(2)}</TableCell>
              <TableCell align="right">{satellite.snr.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

//--------------------------------------
// Live Sky Plot Component
//--------------------------------------
function SkyPlot({ satellites, satelliteHistories, darkMode }) {
  const svgRef = useRef(null);

  useEffect(() => {
    // Define colors based on darkMode
    const circleColor = darkMode ? '#ffffff' : '#000000'; // White in dark mode, black in light mode
    const lineColor = darkMode ? '#aaaaaa' : '#666666';   // Light gray in dark mode, darker in light mode
    const textColor = darkMode ? '#ffffff' : '#000000';   // White in dark mode, black in light mode
    const satelliteColor = darkMode ? 'yellow' : 'red';   // Yellow in dark mode, red in light mode
    const tailColor = darkMode ? 'lightblue' : 'blue';    // Light blue in dark mode, blue in light mode

    // Function to draw the sky plot with updated satellite data
    const drawSkyPlot = (satellites) => {
      // Dimensions
      const width = 400;
      const height = 400;
      const margin = 40;
      const radius = Math.min(width, height) / 2 - margin;

      // Remove existing SVG if any
      d3.select(svgRef.current).selectAll('*').remove();

      // Create SVG
      const svg = d3
        .select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      // Create a group and move it to the center
      const g = svg
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

      // Draw concentric circles for elevation lines
      const elevations = [0, 30, 60, 90]; // Elevation angles
      const elevationScale = d3
        .scaleLinear()
        .domain([0, 90]) // Elevation from 0° (horizon) to 90° (zenith)
        .range([radius, 0]); // Map to radial distance

      elevations.forEach((elev) => {
        g.append('circle')
          .attr('r', elevationScale(elev))
          .attr('fill', 'none')
          .attr('stroke', circleColor);
        g.append('text')
          .attr('x', 0)
          .attr('y', -elevationScale(elev))
          .attr('dy', '-0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill', textColor)
          .text(`${elev}°`);
      });

      // Draw azimuth lines and labels
      const azimuths = d3.range(0, 360, 30); // Every 30°
      azimuths.forEach((az) => {
        const angle = (az - 90) * (Math.PI / 180); // Offset by -90° to align north at top
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Draw line
        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', x)
          .attr('y2', y)
          .attr('stroke', lineColor);

        // Add label
        const labelX = Math.cos(angle) * (radius + 15);
        const labelY = Math.sin(angle) * (radius + 15);
        g.append('text')
          .attr('x', labelX)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('fill', textColor)
          .text(`${az}°`);
      });

      // Plot satellites and their tails
      satellites.forEach((sat) => {
        const { azimuth, elevation, ID } = sat;

        // Convert azimuth and elevation to position
        const azRad = (azimuth - 90) * (Math.PI / 180); // Offset by -90° to align north at top
        const elevRad = elevationScale(elevation);

        const x = Math.cos(azRad) * elevRad;
        const y = Math.sin(azRad) * elevRad;

        // Draw tail if history exists
        const history = satelliteHistories[ID];
        if (history && history.length > 1) {
          const lineGenerator = d3.line()
            .x(d => {
              const az = (d.azimuth - 90) * (Math.PI / 180);
              const r = elevationScale(d.elevation);
              return Math.cos(az) * r;
            })
            .y(d => {
              const az = (d.azimuth - 90) * (Math.PI / 180);
              const r = elevationScale(d.elevation);
              return Math.sin(az) * r;
            })
            .curve(d3.curveCatmullRom.alpha(0.5));

          // Create a group for the tail
          const tailGroup = g.append('g');

          // For each segment between points, draw a line with decreasing opacity
          for (let i = 1; i < history.length; i++) {
            const segment = [history[i - 1], history[i]];
            const age = i / history.length; // Older segments have smaller age values
            const opacity = age; // Adjust this to control fading effect

            tailGroup.append('path')
              .datum(segment)
              .attr('d', lineGenerator)
              .attr('fill', 'none')
              .attr('stroke', tailColor)
              .attr('stroke-width', 1)
              .attr('stroke-opacity', opacity);
          }
        }

        // Draw satellite point
        g.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 5)
          .attr('fill', satelliteColor);

        // Add label
        g.append('text')
          .attr('x', x)
          .attr('y', y - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', textColor)
          .text(ID);
      });
    };

    // Draw the sky plot initially
    drawSkyPlot(satellites);

    // Update the sky plot whenever satellites data, histories, or darkMode change
  }, [satellites, satelliteHistories, darkMode]); // Redraw when satellites, histories, or darkMode data changes

  return (
    <svg ref={svgRef}></svg>
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
//  PositionSourceSelector Component
//--------------------------------------
function PositionSourceSelector({ positionSource, onPositionSourceChange, manualPosition, setManualPosition }) {
  const handleManualPositionChange = (field) => (event) => {
    setManualPosition({ ...manualPosition, [field]: parseFloat(event.target.value) });
  };

  return (
    <Box>
      <FormControl component="fieldset">
        <FormLabel component="legend">Select Position Source</FormLabel>
        <RadioGroup value={positionSource} onChange={onPositionSourceChange}>
          <FormControlLabel value="device" control={<Radio />} label="Use Device Position" />
          <FormControlLabel value="receiver" control={<Radio />} label="Use Connected Receiver Position" />
          <FormControlLabel value="manual" control={<Radio />} label="Manually Enter Position" />
        </RadioGroup>
      </FormControl>
      {positionSource === 'manual' && (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Latitude"
            type="number"
            value={manualPosition.lat}
            onChange={handleManualPositionChange('lat')}
            sx={{ mr: 2 }}
          />
          <TextField
            label="Longitude"
            type="number"
            value={manualPosition.lon}
            onChange={handleManualPositionChange('lon')}
            sx={{ mr: 2 }}
          />
          <TextField
            label="Altitude"
            type="number"
            value={manualPosition.alt}
            onChange={handleManualPositionChange('alt')}
          />
        </Box>
      )}
    </Box>
  );
}

//--------------------------------------
//  SerialPortComponent
//--------------------------------------
function SerialPortComponent({ onPositionUpdate }) {
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
      } else if (
        line.startsWith('$GPGGA') ||
        line.startsWith('$GLGGA') ||
        line.startsWith('$GAGGA') ||
        line.startsWith('$BDGGA')
      ) {
        // Parse GGA sentences
        const positionInfo = parseGGA(line);
        if (positionInfo && onPositionUpdate) {
          onPositionUpdate(positionInfo);
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

  // Function to parse GGA sentences
  const parseGGA = (sentence) => {
    // GGA - Global Positioning System Fix Data
    const fields = sentence.split(',');
    if (fields.length < 15) {
      console.error('Invalid GGA sentence:', sentence);
      return null;
    }
    const latField = fields[2];
    const latHemisphere = fields[3];
    const lonField = fields[4];
    const lonHemisphere = fields[5];
    const altitude = parseFloat(fields[9]);

    const lat = convertNMEACoordinateToDecimal(latField, latHemisphere);
    const lon = convertNMEACoordinateToDecimal(lonField, lonHemisphere);

    return {
      lat,
      lon,
      alt: altitude,
    };
  };

  // Helper function to convert NMEA coordinates to decimal degrees
  const convertNMEACoordinateToDecimal = (coordinate, hemisphere) => {
    if (!coordinate || coordinate.length < 3) {
      return null;
    }
    const dotIndex = coordinate.indexOf('.');
    const degreesLength = dotIndex > 2 ? dotIndex - 2 : 2;
    const degrees = parseInt(coordinate.slice(0, degreesLength), 10);
    const minutes = parseFloat(coordinate.slice(degreesLength));

    let decimalDegrees = degrees + minutes / 60;
    if (hemisphere === 'S' || hemisphere === 'W') {
      decimalDegrees *= -1;
    }
    return decimalDegrees;
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


//--------------------------------------
//  Main App Component
//--------------------------------------
function App() {
  // State for table and live sky satellites
  const [tableSatellites, setTableSatellites] = useState(initialTableSatellites);
  const [satelliteHistories, setSatelliteHistories] = useState({});

  // State to track the current theme mode
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Ref to store the interval ID
  const intervalRef = useRef(null);

  // State for position source and manual position
  const [positionSource, setPositionSource] = useState('manual'); // 'device', 'receiver', or 'manual'
  const [manualPosition, setManualPosition] = useState({ lat: 45.0, lon: -93.0, alt: 0.0 });
  const [userPositionState, setUserPositionState] = useState({ lat: 45.0, lon: -93.0, alt: 0.0 });

  const handlePositionSourceChange = (event) => {
    const newPositionSource = event.target.value;
    setPositionSource(newPositionSource);
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
    } else if (positionSource === 'receiver') {
      // Do nothing; position will be updated via onPositionUpdate from SerialPortComponent
    } else if (positionSource === 'manual') {
      setUserPositionState(manualPosition);
    }
  }, [positionSource, manualPosition]);

  // Update the global userPosition whenever userPositionState changes
  useEffect(() => {
    setUserPosition(userPositionState.lat, userPositionState.lon, userPositionState.alt);
  }, [userPositionState]);

  const calculateHistories = () => {
    if (gpsAlmanacDataGlobal && gpsAlmanacDataGlobal.length > 0) {
      const timeWindow = 6 * 60 * 60; // 6 hours in seconds
      const timeStep = 60; // Time step in seconds (e.g., every 60 seconds)
      const numberOfSteps = Math.floor(timeWindow / timeStep);
      const histories = {};

      const currentTime = Date.now() / 1000; // Current time in seconds

      // Loop over the time window
      for (let i = numberOfSteps; i >= 0; i--) {
        const t = currentTime - i * timeStep;

        const computedSatellites = gpsAlmanacDataGlobal.map((satellite) => {
          const ecefPosition = calculateSatellitePosition(satellite, t);
          const { elevation, azimuth } = calculateElevationAzimuth(
            ecefPosition,
            getUserPosition()
          );
          const ID = satellite.ID;
          return {
            ID,
            elevation,
            azimuth,
            timestamp: t,
          };
        });

        // Filter out satellites that are above the horizon (elevation > 0)
        const visibleSatellites = computedSatellites.filter(
          (sat) => sat.elevation > 0
        );

        visibleSatellites.forEach((sat) => {
          if (!histories[sat.ID]) {
            histories[sat.ID] = [];
          }
          histories[sat.ID].push({
            elevation: sat.elevation,
            azimuth: sat.azimuth,
            timestamp: sat.timestamp,
          });
        });
      }

      setSatelliteHistories(histories);
    }
  };

  useEffect(() => {
    calculateHistories();
  }, [gpsAlmanacDataGlobal]);
  
  // Toggle between light and dark modes
  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const updateSatellitePositions = () => {
    if (gpsAlmanacDataGlobal && gpsAlmanacDataGlobal.length > 0) {
      const currentTime = Date.now() / 1000; // Current time in seconds
      const computedSatellites = gpsAlmanacDataGlobal.map((satellite) => {
        const t = currentTime;
        const ecefPosition = calculateSatellitePosition(satellite, t);
        const { elevation, azimuth, snr } = calculateElevationAzimuth(
          ecefPosition,
          getUserPosition()
        );
        const ID = satellite.ID;
        return {
          ID,
          elevation,
          azimuth,
          snr,
          timestamp: t, // Add timestamp
        };
      });
  
      // Filter out satellites that are below the horizon (elevation <= 0)
      const visibleSatellites = computedSatellites.filter(
        (sat) => sat.elevation > 0
      );
  
      setComputedSatellitesGlobal(visibleSatellites);
      setTableSatellites(visibleSatellites);
      calculateHistories();
    }
  };
  

  const handleButtonClick = async () => {
    try {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500); // Confetti disappears after 3.5 seconds

      // Fetch almanac data from the server
      const data = await fetchAlmanacData();
      setGpsAlmanacDataGlobal(data.satellites); // Update global variable with fetched data

      // Update satellite positions immediately
      updateSatellitePositions();

      // Start the interval to update satellite positions every second
      if (intervalRef.current === null) {
        intervalRef.current = setInterval(() => {
          updateSatellitePositions();
        }, 1000);
      }

    } catch (error) {
      console.error('Failed to update satellite data:', error);
    }
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  

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
            <Typography variant="h4">
              Multi-Source GNSS Constellation Tracker
            </Typography>
          </Box>
          <Typography>
                Dark Mode:
          </Typography>
          <Switch checked={darkMode} onChange={handleThemeChange} id="darkModeSwitch"/>
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
          {/* Satellite Table */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              GPS Satellite Data
            </Typography>
            <GPSSatelliteTable tableSatellites={tableSatellites} />
          </Grid>
          <Grid>
            <Typography variant="h6" gutterBottom>
              Live Sky Plot
            </Typography>
            <SkyPlot satellites={tableSatellites} satelliteHistories={satelliteHistories} darkMode={darkMode} />
           </Grid>
        </Grid>

        {/* Position Source Selector */}
        <Grid item xs={12} md={6}>
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

        {/* Select SVs of Interest */}
        <Grid item="true" xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Select SVs of Interest
          </Typography>
          <SelectSVsOfInterest />
        </Grid>

        {/* Add the SerialPortComponent here */}
        <Grid item="true" xs={12} md={12}>
          <SerialPortComponent onPositionUpdate={handlePositionUpdate} />
        </Grid>

      </Stack>
    </ThemeProvider>
  );
}

export { App, GPSSatelliteTable, SelectSVsOfInterest, SerialPortComponent };
export default App;
