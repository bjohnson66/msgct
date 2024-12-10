import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, useTheme } from '@mui/material';
import { COLORS, getColor } from '../utils/colors';

function GPSSatelliteTable({ mgnssRelativePositions, selectedConstellations, selectedSatellites, setSelectedSatellites }) {
  const theme = useTheme(); // Get the current theme
  const isDarkMode = !(theme.palette.mode === 'dark'); // Check if dark mode is active (flipped for table readability)

  const handleToggle = (constellation, satID) => {
    setSelectedSatellites((prevSelected) => {
      const currentVal = prevSelected[constellation]?.[satID];
      const effectiveVal = currentVal === undefined ? true : currentVal;
      const newVal = !effectiveVal; // Flip from true->false, or false->true

      return {
        ...prevSelected,
        [constellation]: {
          ...prevSelected[constellation],
          [satID]: newVal,
        },
      };
    });
  };

  const getRowColor = (constellation) => {
    switch (constellation) {
      case 'gps':
        return getColor(COLORS.limeGreen, isDarkMode); // GPS is lime green
      case 'qzss':
        return getColor(COLORS.purple, isDarkMode);    // QZSS is purple
      case 'galileo':
        return getColor(COLORS.cyan, isDarkMode);      // Galileo is cyan
      case 'glonass':
        return getColor(COLORS.pink, isDarkMode);      // GLONASS is pink
      case 'beidou':
        return getColor(COLORS.yellow, isDarkMode);    // BeiDou is yellow
      default:
        return '';
    }
  };

  return (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
      <Table sx={{ tableLayout: "auto" }} size="small" aria-label="GNSS Satellite table">
        <TableHead>
          <TableRow>
            <TableCell>Plot</TableCell>
            <TableCell>PRN</TableCell>
            <TableCell align="right">Constellation</TableCell>
            <TableCell align="right">Elevation (°)</TableCell>
            <TableCell align="right">Azimuth (°)</TableCell>
            <TableCell align="right">SNR (dB)</TableCell>
            <TableCell align="right">Health</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(mgnssRelativePositions).map((constellation) => {
            if (selectedConstellations && !selectedConstellations[constellation]) {
              return null;
            }

            const satellites = mgnssRelativePositions[constellation];
            return satellites.map((satellite) => {
              // Determine health status based on satellite.health
              // '000' is Healthy, 'Unhealthy' if SNR was N/A, else N/A for non-GPS
              let healthStatus;
              let healthColor = 'inherit';

              if (constellation === 'gps') {
                if (satellite.health === '000') {
                  healthStatus = "Healthy";
                  healthColor = 'green';
                } else if (satellite.health === 'Unhealthy') {
                  healthStatus = "Unhealthy";
                  healthColor = 'red';
                } else {
                  // If somehow not '000' or 'Unhealthy', default to N/A
                  healthStatus = "N/A";
                }
              } else {
                // For other constellations not currently checked in parser,
                // just show what we have. If parser sets health to Unhealthy, show that.
                if (satellite.health === 'Unhealthy') {
                  healthStatus = "Unhealthy";
                  healthColor = 'red';
                } else if (satellite.health === '000') {
                  healthStatus = "Healthy";
                  healthColor = 'green';
                } else {
                  healthStatus = "N/A";
                }
              }

              return (
                <TableRow key={`${constellation}_${satellite.ID}`}
                  sx={{
                    backgroundColor: getRowColor(constellation),
                    '&:hover': {
                      backgroundColor: `${getRowColor(constellation)}CC`, // Slightly darker on hover
                    },
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedSatellites[constellation]?.[satellite.ID] ?? true}
                      onChange={() => handleToggle(constellation, satellite.ID)}
                      inputProps={{ 'aria-label': `Plot satellite ${satellite.ID}` }}
                    />
                  </TableCell>
                  <TableCell component="th" scope="row">{satellite.ID}</TableCell>
                  <TableCell align="right">{constellation.toUpperCase()}</TableCell>
                  <TableCell align="right">{satellite.elevation.toFixed(2)}</TableCell>
                  <TableCell align="right">{satellite.azimuth.toFixed(2)}</TableCell>
                  <TableCell align="right">{(satellite.snr !== undefined && !isNaN(satellite.snr)) ? satellite.snr.toFixed(2) : 'N/A'}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: healthColor,
                      fontWeight: 'bold',
                    }}
                  >
                    {healthStatus}
                  </TableCell>
                </TableRow>
              );
            });
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default GPSSatelliteTable;
