import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { COLORS, getColor } from '../utils/colors';


function SkyPlot({ mgnssRelativePositions, selectedConstellations, selectedSatellites, satelliteHistories, darkMode, showLabels}) {
    const svgRef = useRef(null);
    const containerRef = useRef(null); // Reference for the container
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); // Track container size


    // Helper function to generate the abbreviated satellite label
    const getAbbreviatedSatelliteLabel = (satellite, constellation) => {
      if (satellite.ID) {
        // For GPS and QZSS, satellite.ID is likely already suitable
        if (constellation === 'gps' || constellation === 'qzss') {
          return satellite.ID;
        }

        // For other constellations, extract from parentheses
        const match = satellite.ID.match(/\(([^)]+)\)/);
        if (match && match[1]) {
          let label = match[1];

          if (constellation === 'galileo') {
            // For Galileo, prefix with 'G' and extract number
            const numberMatch = label.match(/GALILEO\s+(\d+)/i);
            if (numberMatch && numberMatch[1]) {
              return `G${numberMatch[1]}`;
            } else {
              // If not matching 'GALILEO <number>', use the label as is
              return label;
            }
          } else {
            // For other constellations, use the label as is
            return label;
          }
        } else {
          // If no parentheses, use the ID as is
          return satellite.ID;
        }
      }

      // If no ID, return 'Unknown'
      return 'Unknown';
    };

    useEffect(() => {
      // Use ResizeObserver to monitor container size changes
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          let { width, height } = entry.contentRect;
          height = width; //make it a square
          setDimensions({ width, height });
        }
      });
  
      const currentContainer = containerRef.current; // Store the current ref value

      if (currentContainer) {
        observer.observe(currentContainer);
      }

      return () => {
        if (currentContainer) {
          observer.unobserve(currentContainer);
        }
      };
    }, [containerRef]);
  
    useEffect(() => {
      // Define colors based on darkMode
      const circleColor = darkMode ? '#ffffff' : '#000000'; // White in dark mode, black in light mode
      const lineColor = darkMode ? '#aaaaaa' : '#666666';   // Light gray in dark mode, darker in light mode
      const textColor = darkMode ? '#ffffff' : '#000000';   // White in dark mode, black in light mode
  
      // Function to get the color for a satellite for each constellation
      const getSatelliteColor = (constellation) => {
        switch (constellation) {
          case 'gps': return getColor(COLORS.limeGreen, darkMode);
          case 'qzss': return getColor(COLORS.purple, darkMode);
          case 'galileo': return getColor(COLORS.cyan, darkMode);
          case 'glonass': return getColor(COLORS.pink, darkMode);
          case 'beidou': return getColor(COLORS.yellow, darkMode);
          default: return getColor(COLORS.gray, darkMode); // Default color for undefined constellations
        }
      };
      
      // Function to draw the sky plot with updated satellite data
      const drawSkyPlot = () => {
        // Dimensions
        const { width, height } = dimensions;
        const margin = 40;
        const radius = Math.min(width, height) / 2 - margin;
  
        // Remove existing SVG if any
        d3.select(svgRef.current).selectAll('*').remove();
  
        // Create SVG
        const svg = d3
          .select(svgRef.current)
          .attr('width', width)
          .attr('height', height);
  
        // Create a group and move it to the center
        const g = svg
          .append('g')
          .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
        // Draw concentric circles for elevation lines
        const elevations = [0, 30, 60, 90]; // Elevation angles
        const elevationScale = d3
          .scaleLinear()
          .domain([0, 90]) // Elevation from 0° (horizon) to 90° (zenith)
          .range([radius, 0]); // Map to radial distance
  
        elevations.forEach((elev) => {
          g.append('circle')
            .attr('r', elevationScale(elev))
            .attr('fill', 'none')
            .attr('stroke', circleColor);
          g.append('text')
            .attr('x', 0)
            .attr('y', -elevationScale(elev))
            .attr('dy', '-0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', textColor)
            .text(`${elev}°`);
        });
  
        // Draw azimuth lines and labels
        const azimuths = d3.range(0, 360, 30); // Every 30°
        azimuths.forEach((az) => {
          const angle = (az - 90) * (Math.PI / 180); // Offset by -90° to align north at top
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
  
          // Draw line
          g.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', x)
            .attr('y2', y)
            .attr('stroke', lineColor);
  
          // Add label
          const labelX = Math.cos(angle) * (radius + 15);
          const labelY = Math.sin(angle) * (radius + 15);
          if (az !== 0){
            g.append('text')
              .attr('x', labelX)
              .attr('y', labelY)
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'middle')
              .attr('fill', textColor)
              .text(`${az}°`);
          }
        });
  
        // Plot satellites and their tails
        Object.keys(mgnssRelativePositions).forEach((constellation) => {
          // Skip if constellation is not selected
          if (!selectedConstellations[constellation]) {
            return;
          }
  
          const satellites = mgnssRelativePositions[constellation];
  
          satellites.forEach((sat) => {
            // Skip if satellite is not selected
            if (selectedSatellites[constellation]?.[sat.ID] === false) {
              return;
            }
  
            const { azimuth, elevation, ID, health } = sat;
  
            // Convert azimuth and elevation to position
            const azRad = (azimuth - 90) * (Math.PI / 180); // Offset by -90° to align north at top
            const elevRad = elevationScale(elevation);
  
            const x = Math.cos(azRad) * elevRad;
            const y = Math.sin(azRad) * elevRad;
  
            // Get the color for the constellation
            const satelliteColor = getSatelliteColor(constellation);
  
            // Draw tail if history exists
            const history = satelliteHistories[constellation]?.[ID];
            if (history && history.length > 1) {
              const lineGenerator = d3.line()
                .x(d => {
                  const az = (d.azimuth - 90) * (Math.PI / 180);
                  const r = elevationScale(d.elevation);
                  return Math.cos(az) * r;
                })
                .y(d => {
                  const az = (d.azimuth - 90) * (Math.PI / 180);
                  const r = elevationScale(d.elevation);
                  return Math.sin(az) * r;
                })
                .curve(d3.curveCatmullRom.alpha(0.5));
  
              // Create a group for the tail
              const tailGroup = g.append('g');
  
              // For each segment between points, draw a line with decreasing opacity
              for (let i = 1; i < history.length; i++) {
                const segment = [history[i - 1], history[i]];
                const age = i / history.length; // Older segments have smaller age values
                const opacity = age; // Adjust this to control fading effect
  
                tailGroup.append('path')
                  .datum(segment)
                  .attr('d', lineGenerator)
                  .attr('fill', 'none')
                  .attr('stroke', satelliteColor)
                  .attr('stroke-width', 1)
                  .attr('stroke-opacity', opacity);
              }
            }
  
            // Draw satellite point or symbol
            if (constellation !== "gps" || health === "000" || health === 0) {  // Check if satellite is healthy allegedly only GPS has health data in almanac?
              g.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 5)
                .attr('fill', satelliteColor);
            } else {
              // Draw an "X" for unhealthy satellites
              const size = 5;
              g.append('line')
                .attr('x1', x - size).attr('y1', y - size)
                .attr('x2', x + size).attr('y2', y + size)
                .attr('stroke', satelliteColor).attr('stroke-width', 2);
              g.append('line')
                .attr('x1', x - size).attr('y1', y + size)
                .attr('x2', x + size).attr('y2', y - size)
                .attr('stroke', satelliteColor).attr('stroke-width', 2);
            }
  
            if (showLabels) {
              const abbrivatedLabel = getAbbreviatedSatelliteLabel(sat, constellation);
              // Add label
              g.append('text')
                .attr('x', x)
                .attr('y', y - 10)
                .attr('text-anchor', 'middle')
                .attr('fill', textColor)
                .text(abbrivatedLabel);
            }
          });
        });
      };
  
      // Draw the sky plot initially
      if (dimensions.width && dimensions.height) {
        drawSkyPlot();
      }
  
      // Update the sky plot whenever satellites data, histories, or darkMode change
    }, [mgnssRelativePositions, selectedConstellations, selectedSatellites, satelliteHistories, darkMode, showLabels, dimensions]); //redraw if data changes
  
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <svg ref={svgRef}></svg>
      </div>
    );
  }

  export default SkyPlot;