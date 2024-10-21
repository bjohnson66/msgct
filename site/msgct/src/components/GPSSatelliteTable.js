import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

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
            <TableCell align="right">Health</TableCell> {/* New column for health */}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableSatellites.map((satellite) => (
            <TableRow key={satellite.ID}>
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
             </TableCell> {/* Colored Health status */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default GPSSatelliteTable;
