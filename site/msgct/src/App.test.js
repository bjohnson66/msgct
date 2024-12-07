import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { act } from 'react-dom/test-utils';

describe('App Component', () => {
  it('renders the app without crashing', () => {
    render(<App />);
    const titleElement = screen.getByText(/MGNSS\.live/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('toggles dark mode when the switch is clicked', () => {
    render(<App />);
  
    // Get the input element by its id directly
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    expect(darkModeSwitch).toBeInTheDocument();
  
    // Verify the initial state
    expect(darkModeSwitch.checked).toBe(false);
  
    // Toggle dark mode on
    fireEvent.click(darkModeSwitch);
    expect(darkModeSwitch.checked).toBe(true);
  
    // Toggle dark mode off
    fireEvent.click(darkModeSwitch);
    expect(darkModeSwitch.checked).toBe(false);
  });  
  

  it('renders the Live Sky Plot section', () => {
    render(<App />);
    const skyPlotHeading = screen.getByText(/Live Sky Plot/i);
    expect(skyPlotHeading).toBeInTheDocument();
  });

  it('renders the GPS Satellite Data table', () => {
    render(<App />);
    const gpsSatelliteHeading = screen.getByText(/GPS Satellite Data/i);
    expect(gpsSatelliteHeading).toBeInTheDocument();
  });
});
