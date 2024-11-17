import React from 'react';
import { FormGroup, FormControlLabel, Checkbox, Box } from '@mui/material';
import { pink } from '@mui/material/colors';


function SelectSVsOfInterest({ onSelectionChange }) {
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
      const newChecked = {
        ...checked,
        gps: event.target.checked,
        ca: event.target.checked,
        p: event.target.checked,
        other: event.target.checked,
      };
      setChecked(newChecked);
      onSelectionChange(newChecked); // Notify parent
    };
  
    // Handle changes for individual child checkboxes (GPS Code Types)
    const handleChangeCodeType = (event) => {
      const newChecked = {
        ...checked,
        [event.target.name]: event.target.checked,
      };
      setChecked(newChecked);
      onSelectionChange(newChecked); // Notify parent
    };
  
    // Handle changes for individual constellations (other than GPS)
    const handleChangeConstellation = (event) => {
      const newChecked = {
        ...checked,
        [event.target.name]: event.target.checked,
      };
      setChecked(newChecked);
      onSelectionChange(newChecked); // Notify parent
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


  export default SelectSVsOfInterest;