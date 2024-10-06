// App.test.js
import { render, screen, fireEvent, act} from '@testing-library/react';
import {App, GPSSatelliteTable, SelectSVsOfInterest, SerialPortComponent} from './App'; // Adjust the import path
import React from 'react';

//-------------------------------------
//Testing App Component
//-------------------------------------
test('renders the app with title and logo', () => {
  render(<App />);
  const titleElement = screen.getByText(/Multi-Source GNSS Constellation Tracker/i);
  expect(titleElement).toBeInTheDocument();

  const logoElement = screen.getByAltText('MSGCT Logo');
  expect(logoElement).toBeInTheDocument();
});

//---------------------------------------
// Testing GPS Table Component
//---------------------------------------
const mockData = [
  {
    prn: 'G01',
    azimuth: 120.5,
    elevation: 45.2,
    signalStrength: 50,
    health: 'Healthy',
    blockType: 'IIR-M',
  },
  {
    prn: 'G02',
    azimuth: 210.0,
    elevation: 30.0,
    signalStrength: 45,
    health: 'Unhealthy',
    blockType: 'IIF',
  },
];

test('renders satellite data in table', () => {
  render(<GPSSatelliteTable tableSatellites={mockData} />);

  // Check that table headers are rendered
  expect(screen.getByText(/PRN/i)).toBeInTheDocument();
  expect(screen.getByText(/Azimuth/i)).toBeInTheDocument();

  // Check that satellite data is rendered
  expect(screen.getByText('G01')).toBeInTheDocument();
  expect(screen.getByText('G02')).toBeInTheDocument();
  expect(screen.getByText('120.5')).toBeInTheDocument();
  expect(screen.getByText('Unhealthy')).toBeInTheDocument();
});



//--------------------------------
// Constellations of Intrest Checkbox Test
//--------------------------------
test('toggles GPS checkboxes correctly', () => {
  render(<SelectSVsOfInterest />);

  const gpsCheckbox = screen.getByLabelText('GPS');
  const caCheckbox = screen.getByLabelText('C/A');
  const pCheckbox = screen.getByLabelText('P');
  const otherCheckbox = screen.getByLabelText('Other');

  // Initially, all are checked
  expect(gpsCheckbox).toBeChecked();
  expect(caCheckbox).toBeChecked();
  expect(pCheckbox).toBeChecked();
  expect(otherCheckbox).toBeChecked();

  // Uncheck GPS checkbox
  fireEvent.click(gpsCheckbox);

  // Now, GPS and all child checkboxes should be unchecked
  expect(gpsCheckbox).not.toBeChecked();
  expect(caCheckbox).not.toBeChecked();
  expect(pCheckbox).not.toBeChecked();
  expect(otherCheckbox).not.toBeChecked();
});


//----------------------------
// Serial Port Component
//----------------------------

