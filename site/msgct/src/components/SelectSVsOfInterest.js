import React from 'react';
import { FormGroup, FormControlLabel, Checkbox, Box, useTheme } from '@mui/material';
import { COLORS, getColor } from '../utils/colors';


function SelectSVsOfInterest({ onSelectionChange, onBlockTypeChange }) {
    const theme = useTheme(); // Get the current theme
    const isDarkMode = theme.palette.mode === 'dark'; // Check if dark mode is active

    const [checked, setChecked] = React.useState({
      gps: true,
      iir: true,
      iirm: true,
      iif: true,
      iii: true,
      other: true,
      qzss: true,
      galileo: true,
      glonass: true,
      beidou: true,
    });
  
    // Handle changes for the GPS parent checkbox
    const handleChangeGPS = (event) => {
      const isChecked = event.target.checked;

      const newChecked = {
        ...checked,
        gps: isChecked,
        iir: isChecked,
        iirm: isChecked,
        iif: isChecked,
        iii: isChecked,
        other: isChecked,
      };

      setChecked(newChecked);
      onSelectionChange(newChecked);
      onBlockTypeChange({
        iir: isChecked,
        iirm: isChecked,
        iif: isChecked,
        iii: isChecked,
        other: isChecked,
      });
    };
    
  
    // Handle changes for individual child checkboxes (GPS Code Types)
    const handleChangeCodeType = (event) => {
      const newChecked = {
        ...checked,
        [event.target.name]: event.target.checked,
      };
    
      // Do NOT update `gps` directly here
      setChecked(newChecked);
      onBlockTypeChange({
        iir: newChecked.iir,
        iirm: newChecked.iirm,
        iif: newChecked.iif,
        iii: newChecked.iii,
        other: newChecked.other,
      });
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
    const isIndeterminate =
    !(
      checked.iir && checked.iirm && checked.iif && checked.iii && checked.other
    ) && (
      checked.iir || checked.iirm || checked.iif || checked.iii || checked.other
    );  
  
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
              sx={{
                color: getColor(COLORS.gray, isDarkMode),
                '&.Mui-checked': {
                  color: getColor(COLORS.gray, isDarkMode),
                },
              }}
            />
          }
        />
  
        {/* Child Checkboxes (IIR, IIR-M, IIF, III) */}
  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
    <FormControlLabel
      label="IIR"
      control={
        <Checkbox
          checked={checked.iir}
          onChange={handleChangeCodeType}
          name="iir"
          sx={{
            color: getColor(COLORS.red, isDarkMode),
            '&.Mui-checked': {
              color: getColor(COLORS.red, isDarkMode),
            },
          }}
        />
      }
    />
    <FormControlLabel
      label="IIR-M"
      control={
        <Checkbox
          checked={checked.iirm}
          onChange={handleChangeCodeType}
          name="iirm"
          sx={{
            color: getColor(COLORS.blue, isDarkMode),
            '&.Mui-checked': {
              color: getColor(COLORS.blue, isDarkMode),
            },
          }}
        />
      }
    />
    <FormControlLabel
      label="IIF"
      control={
        <Checkbox
          checked={checked.iif}
          onChange={handleChangeCodeType}
          name="iif"
          sx={{
            color: getColor(COLORS.limeGreen, isDarkMode),
            '&.Mui-checked': {
              color: getColor(COLORS.limeGreen, isDarkMode),
            },
          }}
        />
      }
    />
    <FormControlLabel
      label="III"
      control={
        <Checkbox
          checked={checked.iii}
          onChange={handleChangeCodeType}
          name="iii"
          sx={{
            color: getColor(COLORS.purple, isDarkMode),
            '&.Mui-checked': {
              color: getColor(COLORS.purple, isDarkMode),
            },
          }}
        />
      }
    />
    <FormControlLabel
      label="other"
      control={
        <Checkbox
          checked={checked.other}
          onChange={handleChangeCodeType}
          name="other"
          sx={{
            color: getColor(COLORS.yellow, isDarkMode),
            '&.Mui-checked': {
              color: getColor(COLORS.yellow, isDarkMode),
            },
          }}
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
              sx={{
                color: getColor(COLORS.purple, isDarkMode),
                '&.Mui-checked': {
                  color: getColor(COLORS.purple, isDarkMode),
                },
              }}
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
              sx={{
                color: getColor(COLORS.cyan, isDarkMode),
                '&.Mui-checked': {
                  color: getColor(COLORS.cyan, isDarkMode),
                },
              }}
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
                color: getColor(COLORS.pink, isDarkMode),
                '&.Mui-checked': {
                  color: getColor(COLORS.pink, isDarkMode),
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
              sx={{
                color: getColor(COLORS.yellow, isDarkMode),
                '&.Mui-checked': {
                  color: getColor(COLORS.yellow, isDarkMode),
                },
              }}
            />
          }
        />
      </FormGroup>
    );
  }


  export default SelectSVsOfInterest;