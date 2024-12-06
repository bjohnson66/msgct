import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
} from '@mui/material';
import Maps from './Maps';

function PositionSourceSelector({
  positionSource,
  onPositionSourceChange,
  manualPosition,
  setManualPosition,
  receiverPosition,
}) {
  // Handle changes to the manual position inputs
  const handleManualPositionChange = (field) => (event) => {
    const value = event.target.value;

    // Allow empty input temporarily
    if (value === '') {
      setManualPosition({
        ...manualPosition,
        [field]: '',
      });
      return;
    }

    // Validate and parse the number
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      setManualPosition({
        ...manualPosition,
        [field]: parsedValue,
      });
    }
  };

  return (
    <Box>
      <FormControl component="fieldset">
        <FormLabel component="legend">Select Position Source</FormLabel>
        <RadioGroup value={positionSource} onChange={onPositionSourceChange}>
          <FormControlLabel value="device" control={<Radio />} label="Use Device Position" />
          <FormControlLabel value="receiver" control={<Radio />} label="Use Connected Receiver Position" />
          {positionSource === 'receiver' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">Current Receiver Position:</Typography>
              <TextField
                label="Latitude"
                type="number"
                value={receiverPosition.lat || ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mr: 2 }}
              />
              <TextField
                label="Longitude"
                type="number"
                value={receiverPosition.lon || ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mr: 2 }}
              />
              <TextField
                label="Altitude"
                type="number"
                value={receiverPosition.alt || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Box>
          )}
          <FormControlLabel value="manual" control={<Radio />} label="Manually Enter Position" />
        </RadioGroup>
      </FormControl>
      {positionSource === 'manual' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Enter your position manually:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Latitude"
              type="number"
              value={manualPosition.lat === '' ? '' : manualPosition.lat}
              onChange={handleManualPositionChange('lat')}
              onBlur={() => {
                // Reset to a default or previous valid value on blur if empty
                if (manualPosition.lat === '') {
                  setManualPosition({ ...manualPosition, lat: 45.0 });
                }
              }}
              error={manualPosition.lat < -90 || manualPosition.lat > 90}
              helperText={
                manualPosition.lat < -90 || manualPosition.lat > 90
                  ? 'Latitude must be between -90 and 90'
                  : ''
              }
            />
            <TextField
              label="Longitude"
              type="number"
              value={manualPosition.lon === '' ? '' : manualPosition.lon}
              onChange={handleManualPositionChange('lon')}
              onBlur={() => {
                if (manualPosition.lon === '') {
                  setManualPosition({ ...manualPosition, lon: -93.0 });
                }
              }}
              error={manualPosition.lon < -180 || manualPosition.lon > 180}
              helperText={
                manualPosition.lon < -180 || manualPosition.lon > 180
                  ? 'Longitude must be between -180 and 180'
                  : ''
              }
            />
            <TextField
              label="Altitude"
              type="number"
              value={manualPosition.alt || ''}
              onChange={handleManualPositionChange('alt')}
              onBlur={() => {
                // Ensure altitude doesn't remain empty
                if (manualPosition.alt === '') {
                  setManualPosition({ ...manualPosition, alt: 0 });
                }
              }}
            />
          </Box>
        </Box>
      )}
      {/* Integrate the Maps component */}
      <Maps
        positionSource={positionSource}
        manualPosition={manualPosition}
        setManualPosition={setManualPosition} // Allow Maps.js to update manualPosition
        receiverPosition={receiverPosition}
      />
    </Box>
  );
}

export default PositionSourceSelector;