// App.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import GPSSatelliteTable from './components/GPSSatelliteTable';
import SelectSVsOfInterest from './components/SelectSVsOfInterest';
import React from 'react';

// Mock function for setSelectedSatellites
const mockSetSelectedSatellites = jest.fn();

const mockData = [
  {
    ID: 'G01',
    azimuth: 120.5,
    elevation: 45.2,
    snr: 50,
    health: '000',
  },
  {
    ID: 'G02',
    azimuth: 210.0,
    elevation: 30.0,
    snr: 45,
    health: '000',
  },
];

// Mock selected satellites (none selected initially)
const mockSelectedSatellites = [];

test('renders satellite data in table', () => {
  render(
    <GPSSatelliteTable 
      tableSatellites={mockData}
      selectedSatellites={mockSelectedSatellites}
      setSelectedSatellites={mockSetSelectedSatellites}
    />
  );

  // Check that table headers are rendered
  expect(screen.getByText(/PRN/i)).toBeInTheDocument();
  expect(screen.getByText(/Azimuth/i)).toBeInTheDocument();
  expect(screen.getByText(/Elevation/i)).toBeInTheDocument();
  expect(screen.getByText(/SNR/i)).toBeInTheDocument();
  expect(screen.getByText(/Health/i)).toBeInTheDocument();  // New Health column

  // Check if satellite data is rendered
  expect(screen.getByText('G01')).toBeInTheDocument();
  expect(screen.getByText('120.5')).toBeInTheDocument();
  expect(screen.getByText('45.2')).toBeInTheDocument();
  expect(screen.getByText('50')).toBeInTheDocument();
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

