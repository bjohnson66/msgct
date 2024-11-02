import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox } from '@mui/material';

function GPSSatelliteTable({ tableSatellites, selectedSatellites, setSelectedSatellites }) {
  const handleToggle = (satID) => {
    setSelectedSatellites((prevSelected) => ({
      ...prevSelected,
      [satID]: !prevSelected[satID], // Toggle the selected state for this satellite
    }));
  };

  return (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
      <Table sx={{ tableLayout: "auto" }} size="small" aria-label="GPS Satellite table">
        <TableHead>
          <TableRow>
            <TableCell>Plot</TableCell>
            <TableCell>PRN</TableCell>
            <TableCell align="right">Elevation (°)</TableCell>
            <TableCell align="right">Azimuth (°)</TableCell>
            <TableCell align="right">SNR (dB)</TableCell>
            <TableCell align="right">Health</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableSatellites.map((satellite) => (
            <TableRow key={satellite.ID}>
              <TableCell>
                <Checkbox
                  checked={selectedSatellites[satellite.ID] || false}
                  onChange={() => handleToggle(satellite.ID)}
                  inputProps={{ 'aria-label': `Plot satellite ${satellite.ID}` }}
                />
              </TableCell>
              <TableCell component="th" scope="row">{satellite.ID}</TableCell>
              <TableCell align="right">{satellite.elevation.toFixed(2)}</TableCell>
              <TableCell align="right">{satellite.azimuth.toFixed(2)}</TableCell>
              <TableCell align="right">{satellite.snr.toFixed(2)}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default GPSSatelliteTable;
