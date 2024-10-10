import React from 'react';
import { Box, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, TextField } from '@mui/material';


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

  export default PositionSourceSelector;