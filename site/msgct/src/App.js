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
const getAlmanacData = () => ([
  {
    ID: 2,
    Health: 0,
    Eccentricity: 0.01620483398,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9670754177,
    RateOfRightAscen: -7.966046104e-9,
    SqrtA: 5153.639648,
    RightAscenAtWeek: -0.442486046,
    ArgumentOfPerigee: -1.12224439,
    MeanAnomaly: 2.634982016,
    Af0: -0.0003423690796,
    Af1: 7.275957614e-11,
    week: 287
  },
  {
    ID: 3,
    Health: 0,
    Eccentricity: 0.005696773529,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9863939882,
    RateOfRightAscen: -7.497455156e-9,
    SqrtA: 5153.608887,
    RightAscenAtWeek: 0.6940551502,
    ArgumentOfPerigee: 1.164144986,
    MeanAnomaly: -0.9065320872,
    Af0: 0.0005626678467,
    Af1: 1.091393642e-10,
    week: 287
  },
  {
    ID: 4,
    Health: 0,
    Eccentricity: 0.003071784973,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9655294527,
    RateOfRightAscen: -7.794610391e-9,
    SqrtA: 5153.643555,
    RightAscenAtWeek: 1.771602501,
    ArgumentOfPerigee: -3.0077753,
    MeanAnomaly: 2.17010382,
    Af0: 0.0004577636719,
    Af1: 7.275957614e-11,
    week: 287
  },
  {
    ID: 5,
    Health: 0,
    Eccentricity: 0.00581407547,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9733311831,
    RateOfRightAscen: -7.634603726e-9,
    SqrtA: 5153.640137,
    RightAscenAtWeek: 0.6409905003,
    ArgumentOfPerigee: 1.335022057,
    MeanAnomaly: 2.794177464,
    Af0: -0.0001888275146,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 6,
    Health: 0,
    Eccentricity: 0.003101348877,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9897495712,
    RateOfRightAscen: -7.760323249e-9,
    SqrtA: 5153.666016,
    RightAscenAtWeek: -0.3412556728,
    ArgumentOfPerigee: -0.765144074,
    MeanAnomaly: 0.5788586608,
    Af0: -0.00002193450928,
    Af1: -2.546585165e-10,
    week: 287
  },
  {
    ID: 7,
    Health: 0,
    Eccentricity: 0.01876735687,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9506570296,
    RateOfRightAscen: -7.886042771e-9,
    SqrtA: 5153.54541,
    RightAscenAtWeek: 2.783763547,
    ArgumentOfPerigee: -2.098882695,
    MeanAnomaly: -0.3297077486,
    Af0: -0.00002956390381,
    Af1: 3.637978807e-11,
    week: 287
  },
  {
    ID: 8,
    Health: 0,
    Eccentricity: 0.009747505188,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9508308008,
    RateOfRightAscen: -8.171768958e-9,
    SqrtA: 5153.640625,
    RightAscenAtWeek: -1.441800002,
    ArgumentOfPerigee: 0.369953023,
    MeanAnomaly: 2.489610372,
    Af0: 0.000376701355,
    Af1: 1.091393642e-10,
    week: 287
  },
  {
    ID: 9,
    Health: 0,
    Eccentricity: 0.003163337708,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9592197583,
    RateOfRightAscen: -7.874613724e-9,
    SqrtA: 5153.526367,
    RightAscenAtWeek: 1.711028986,
    ArgumentOfPerigee: 1.994511706,
    MeanAnomaly: 2.992321642,
    Af0: 0.0003890991211,
    Af1: 1.455191523e-10,
    week: 287
  },
  {
    ID: 10,
    Health: 0,
    Eccentricity: 0.009766101837,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9860344615,
    RateOfRightAscen: -7.486026109e-9,
    SqrtA: 5153.645508,
    RightAscenAtWeek: 0.6915129965,
    ArgumentOfPerigee: -2.376095419,
    MeanAnomaly: -1.830053311,
    Af0: -0.000150680542,
    Af1: -1.455191523e-10,
    week: 287
  },
  {
    ID: 11,
    Health: 0,
    Eccentricity: 0.00167798996,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9663803327,
    RateOfRightAscen: -7.977475151e-9,
    SqrtA: 5153.509766,
    RightAscenAtWeek: -0.3111685271,
    ArgumentOfPerigee: -2.480923681,
    MeanAnomaly: 1.618308535,
    Af0: -0.007419586182,
    Af1: -3.637978807e-11,
    week: 287
  },
  {
    ID: 12,
    Health: 0,
    Eccentricity: 0.008731842041,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9617364455,
    RateOfRightAscen: -7.714607059e-9,
    SqrtA: 5153.540039,
    RightAscenAtWeek: -2.383845093,
    ArgumentOfPerigee: 1.463337527,
    MeanAnomaly: -1.050197477,
    Af0: -0.005435943604,
    Af1: -3.637978807e-11,
    week: 287
  },
  {
    ID: 13,
    Health: 0,
    Eccentricity: 0.008687019348,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9719230367,
    RateOfRightAscen: -7.760323249e-9,
    SqrtA: 5153.63623,
    RightAscenAtWeek: 1.879014862,
    ArgumentOfPerigee: 0.96843323,
    MeanAnomaly: 2.169297132,
    Af0: 0.006799697876,
    Af1: 3.637978807e-11,
    week: 287
  },
  {
    ID: 14,
    Health: 0,
    Eccentricity: 0.004916191101,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9450963492,
    RateOfRightAscen: -7.840326581e-9,
    SqrtA: 5153.647949,
    RightAscenAtWeek: -2.430389201,
    ArgumentOfPerigee: -2.854289212,
    MeanAnomaly: -1.183823832,
    Af0: 0.005121231079,
    Af1: 7.275957614e-11,
    week: 287
  },
  {
    ID: 15,
    Health: 0,
    Eccentricity: 0.01615524292,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9362879439,
    RateOfRightAscen: -8.068907531e-9,
    SqrtA: 5153.648438,
    RightAscenAtWeek: 1.579662781,
    ArgumentOfPerigee: 1.364748177,
    MeanAnomaly: 1.480484706,
    Af0: 0.002126693726,
    Af1: 3.637978807e-11,
    week: 287
  },
  {
    ID: 16,
    Health: 0,
    Eccentricity: 0.01402664185,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9611312421,
    RateOfRightAscen: -7.703178011e-9,
    SqrtA: 5153.585938,
    RightAscenAtWeek: -2.366138775,
    ArgumentOfPerigee: 0.846090023,
    MeanAnomaly: -2.82675583,
    Af0: -0.0001611709595,
    Af1: 1.091393642e-10,
    week: 287
  },
  {
    ID: 17,
    Health: 0,
    Eccentricity: 0.01353311539,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9666260093,
    RateOfRightAscen: -8.023191341e-9,
    SqrtA: 5153.504395,
    RightAscenAtWeek: -1.344935632,
    ArgumentOfPerigee: -1.289951259,
    MeanAnomaly: 2.397231847,
    Af0: 0.006036758423,
    Af1: -1.091393642e-10,
    week: 287
  },
  {
    ID: 18,
    Health: 0,
    Eccentricity: 0.004751205444,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9746134952,
    RateOfRightAscen: -7.897471819e-9,
    SqrtA: 5153.687988,
    RightAscenAtWeek: -0.3390775399,
    ArgumentOfPerigee: -2.982728645,
    MeanAnomaly: 0.4922449224,
    Af0: -0.00657081604,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 19,
    Health: 0,
    Eccentricity: 0.009968757629,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9658410425,
    RateOfRightAscen: -8.034620388e-9,
    SqrtA: 5153.692383,
    RightAscenAtWeek: -1.30066965,
    ArgumentOfPerigee: 2.660728251,
    MeanAnomaly: -1.96586866,
    Af0: 0.005474090576,
    Af1: 3.637978807e-11,
    week: 287
  },
  {
    ID: 20,
    Health: 0,
    Eccentricity: 0.003812789917,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9557503252,
    RateOfRightAscen: -7.828897534e-9,
    SqrtA: 5153.565918,
    RightAscenAtWeek: 0.5098950641,
    ArgumentOfPerigee: -2.521754685,
    MeanAnomaly: 0.9162408074,
    Af0: 0.003700256348,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 21,
    Health: 0,
    Eccentricity: 0.02540922165,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9613169976,
    RateOfRightAscen: -8.011762293e-9,
    SqrtA: 5153.598145,
    RightAscenAtWeek: -0.4504664163,
    ArgumentOfPerigee: -0.509216832,
    MeanAnomaly: 2.288360781,
    Af0: 0.0001001358032,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 22,
    Health: 0,
    Eccentricity: 0.01401996613,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9604721098,
    RateOfRightAscen: -7.680319916e-9,
    SqrtA: 5153.643066,
    RightAscenAtWeek: -2.362846484,
    ArgumentOfPerigee: -1.106000523,
    MeanAnomaly: 2.963684962,
    Af0: -0.0006866455078,
    Af1: -3.637978807e-11,
    week: 287
  },
  {
    ID: 23,
    Health: 0,
    Eccentricity: 0.004778385162,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9811808504,
    RateOfRightAscen: -7.531742299e-9,
    SqrtA: 5153.573242,
    RightAscenAtWeek: 0.6618894905,
    ArgumentOfPerigee: -2.938941657,
    MeanAnomaly: -0.6640503961,
    Af0: 0.003366470337,
    Af1: 7.275957614e-11,
    week: 287
  },
  {
    ID: 24,
    Health: 0,
    Eccentricity: 0.01607322693,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9343345153,
    RateOfRightAscen: -8.057478483e-9,
    SqrtA: 5153.633789,
    RightAscenAtWeek: 2.684435669,
    ArgumentOfPerigee: 1.016209092,
    MeanAnomaly: 0.5929940541,
    Af0: -0.004854202271,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 25,
    Health: 0,
    Eccentricity: 0.0118522644,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9498301181,
    RateOfRightAscen: -7.817468486e-9,
    SqrtA: 5153.677246,
    RightAscenAtWeek: -2.471912668,
    ArgumentOfPerigee: 1.09335342,
    MeanAnomaly: -1.199506688,
    Af0: 0.004997253418,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 26,
    Health: 0,
    Eccentricity: 0.009325504303,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9306373819,
    RateOfRightAscen: -7.954617056e-9,
    SqrtA: 5153.65625,
    RightAscenAtWeek: -2.536885143,
    ArgumentOfPerigee: 0.560245287,
    MeanAnomaly: -1.943929289,
    Af0: 0.0006103515625,
    Af1: -1.091393642e-10,
    week: 287
  },
  {
    ID: 27,
    Health: 0,
    Eccentricity: 0.01267242432,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9598669064,
    RateOfRightAscen: -8.103194673e-9,
    SqrtA: 5153.632812,
    RightAscenAtWeek: -1.414163631,
    ArgumentOfPerigee: 0.797909694,
    MeanAnomaly: 2.540622723,
    Af0: -0.0003433227539,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 28,
    Health: 0,
    Eccentricity: 0.000431060791,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9617124771,
    RateOfRightAscen: -7.783181344e-9,
    SqrtA: 5153.675293,
    RightAscenAtWeek: 2.752217322,
    ArgumentOfPerigee: 1.399021188,
    MeanAnomaly: -1.476758361,
    Af0: -0.004377365112,
    Af1: -1.455191523e-10,
    week: 287
  },
  {
    ID: 29,
    Health: 0,
    Eccentricity: 0.002892017365,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9691007517,
    RateOfRightAscen: -8.011762293e-9,
    SqrtA: 5153.713379,
    RightAscenAtWeek: -1.329584964,
    ArgumentOfPerigee: 2.680556151,
    MeanAnomaly: 2.387489046,
    Af0: -0.005731582642,
    Af1: 3.637978807e-11,
    week: 287
  },
  {
    ID: 30,
    Health: 0,
    Eccentricity: 0.007171154022,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.935814567,
    RateOfRightAscen: -8.057478483e-9,
    SqrtA: 5153.509766,
    RightAscenAtWeek: 2.782385735,
    ArgumentOfPerigee: -2.449757207,
    MeanAnomaly: -0.4569461369,
    Af0: -0.003070831299,
    Af1: 7.275957614e-11,
    week: 287
  },
  {
    ID: 31,
    Health: 0,
    Eccentricity: 0.01064968109,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.9546118238,
    RateOfRightAscen: -7.817468486e-9,
    SqrtA: 5153.522461,
    RightAscenAtWeek: 2.805835868,
    ArgumentOfPerigee: 0.74702842,
    MeanAnomaly: -1.380629148,
    Af0: -0.002241134644,
    Af1: 0.0,
    week: 287
  },
  {
    ID: 32,
    Health: 0,
    Eccentricity: 0.007905006409,
    TimeOfApplicability: 147456.0,
    OrbitalInclination: 0.962563357,
    RateOfRightAscen: -7.851755629e-9,
    SqrtA: 5153.677734,
    RightAscenAtWeek: 1.726180042,
    ArgumentOfPerigee: -2.136102327,
    MeanAnomaly: -3.099587196,
    Af0: -0.005893707275,
    Af1: 3.637978807e-11,
    week: 287
  }
]);

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
              checked={checked.py}
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
              checked={checked.m}
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
  const [serialData, setSerialData] = useState(''); // Serial data to display
  const [isPortOpen, setIsPortOpen] = useState(false); // Track if port is open

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
        await selectedPort.open({ baudRate: 9600 }); // Open the port with a baud rate of 9600 (or as required)
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
            setSerialData((prevData) => prevData + value); // Append new data to the displayed data
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
          {ports.map((port, index) => (
            <MenuItem key={index} value={port}>
              Port {index + 1} {/* You can customize this to show actual port info */}
            </MenuItem>
          ))}
          <MenuItem value="">
            <em>Select a COM port</em>
          </MenuItem>
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
    </Container>
  );
}

export default App;
