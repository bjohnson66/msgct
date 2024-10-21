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
    <table>
    <thead>
      <tr>
        <th>Plot</th>
        <th>PRN</th>
        <th align="right">Elevation (°)</th>
        <th align="right">Azimuth (°)</th>
        <th align="right">SNR (dB)</th>
        <th align="right">Health</th>
      </tr>
    </thead>
    <tbody>
      {tableSatellites.map((satellite) => (
        <tr key={satellite.ID}>
          <td>
            <input type="checkbox" aria-label={`Plot satellite ${satellite.ID}`} />
          </td>
          <th scope="row">{satellite.ID}</th>
          <td align="right">{satellite.elevation}</td>
          <td align="right">{satellite.azimuth}</td>
          <td align="right">{satellite.snr}</td>
          <td align="right">{satellite.health}</td>
        </tr>
      ))}
    </tbody>
  </table>
  );
}

export default GPSSatelliteTable;
