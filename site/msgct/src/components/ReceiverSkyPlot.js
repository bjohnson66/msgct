import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const RECEIVER_COLORS = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF"  // Cyan
];

function ReceiverSkyPlot({ receiversSatelliteData, darkMode, showLabels }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const circleColor = darkMode ? '#ffffff' : '#000000';
    const lineColor = darkMode ? '#aaaaaa' : '#666666';
    const textColor = darkMode ? '#ffffff' : '#000000';

    const width = 550;
    const height = 550;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width/2}, ${height/2})`);

    const elevations = [0, 30, 60, 90];
    const elevationScale = d3.scaleLinear()
      .domain([0,90])
      .range([radius,0]);

    elevations.forEach((elev) => {
      g.append('circle')
        .attr('r', elevationScale(elev))
        .attr('fill','none')
        .attr('stroke', circleColor);
      g.append('text')
        .attr('x',0)
        .attr('y', -elevationScale(elev))
        .attr('dy','-0.35em')
        .attr('text-anchor','middle')
        .attr('fill', textColor)
        .text(`${elev}°`);
    });

    const azimuths = d3.range(0,360,30);
    azimuths.forEach((az) => {
      const angle = (az - 90)*(Math.PI/180);
      const x = Math.cos(angle)*radius;
      const y = Math.sin(angle)*radius;

      g.append('line')
        .attr('x1',0)
        .attr('y1',0)
        .attr('x2',x)
        .attr('y2',y)
        .attr('stroke', lineColor);

      const labelX = Math.cos(angle)*(radius+15);
      const labelY = Math.sin(angle)*(radius+15);

      if (az !== 0) {
        g.append('text')
          .attr('x',labelX)
          .attr('y',labelY)
          .attr('text-anchor','middle')
          .attr('alignment-baseline','middle')
          .attr('fill', textColor)
          .text(`${az}°`);
      }
    });

    const receiverNames = Object.keys(receiversSatelliteData);
    receiverNames.forEach((receiverName, index) => {
      const receiverColor = RECEIVER_COLORS[index % RECEIVER_COLORS.length];
      const satellites = receiversSatelliteData[receiverName];

      satellites.forEach((sat) => {
        const { azimuth, elevation, health } = sat;

        const azRad = (azimuth - 90)*(Math.PI/180);
        const elevRad = elevationScale(elevation);
        const x = Math.cos(azRad)*elevRad;
        const y = Math.sin(azRad)*elevRad;

        if (health === "000" || health === 0) {
          g.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r',5)
            .attr('fill', receiverColor);
        } else {
          const size = 5;
          g.append('line')
            .attr('x1', x - size).attr('y1', y - size)
            .attr('x2', x + size).attr('y2', y + size)
            .attr('stroke', receiverColor).attr('stroke-width',2);
          g.append('line')
            .attr('x1', x - size).attr('y1', y + size)
            .attr('x2', x + size).attr('y2', y - size)
            .attr('stroke', receiverColor).attr('stroke-width',2);
        }

        if (showLabels) {
          g.append('text')
            .attr('x', x)
            .attr('y', y -10)
            .attr('text-anchor','middle')
            .attr('fill', textColor)
            .text(sat.ID);
        }
      });
    });
  }, [receiversSatelliteData, darkMode, showLabels]);

  return <svg ref={svgRef}></svg>;
}

export default ReceiverSkyPlot;
