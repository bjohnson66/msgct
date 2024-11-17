import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox } from '@mui/material';
import { pink } from '@mui/material/colors';

function GPSSatelliteTable({ mgnssRelativePositions, selectedConstellations, selectedSatellites, setSelectedSatellites }) {
  const handleToggle = (constellation, satID) => {
    setSelectedSatellites((prevSelected) => ({
      ...prevSelected,
      [constellation]: {
        ...prevSelected[constellation],
        [satID]: !prevSelected[constellation][satID],
      },
    }));
  };

  const getRowColor = (constellation) => {
    switch (constellation) {
      case 'gps':
        return ''; // default
      case 'qzss':
        return '#e3f2fd'; // light blue
      case 'galileo':
        return '#e1f5fe'; // very light blue
      case 'glonass':
        return pink[50];
      case 'beidou':
        return '#ffebee'; // very light red
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
            return satellites.map((satellite) => (
              <TableRow key={`${constellation}_${satellite.ID}`} sx={{ backgroundColor: getRowColor(constellation) }}>
                <TableCell>
                  <Checkbox
                    checked={selectedSatellites[constellation]?.[satellite.ID] || false}
                    onChange={() => handleToggle(constellation, satellite.ID)}
                    inputProps={{ 'aria-label': `Plot satellite ${satellite.ID}` }}
                  />
                </TableCell>
                <TableCell component="th" scope="row">{satellite.ID}</TableCell>
                <TableCell align="right">{constellation.toUpperCase()}</TableCell>
                <TableCell align="right">{satellite.elevation.toFixed(2)}</TableCell>
                <TableCell align="right">{satellite.azimuth.toFixed(2)}</TableCell>
                <TableCell align="right">{satellite.snr ? satellite.snr.toFixed(2) : 'N/A'}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: satellite.health === "000" ? 'green' : 'red',
                    fontWeight: 'bold',
                  }}
                >
                  {satellite.health === "000" ? "Healthy" : "Unhealthy"}
                </TableCell>
              </TableRow>
            ));
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default GPSSatelliteTable;
