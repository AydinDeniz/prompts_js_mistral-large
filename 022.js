// Smart Home Dashboard

// HTML Structure
document.body.innerHTML = `
  <div id="app">
    <h1>Smart Home Dashboard</h1>
    <div id="temperatureChart"></div>
    <div id="humidityChart"></div>
    <div id="energyChart"></div>
    <div id="deviceControls">
      <h2>Device Controls</h2>
      <button id="toggleLight">Toggle Light</button>
      <button id="toggleAC">Toggle AC</button>
    </div>
  </div>
`;

// D3.js Visualization
const d3 = require('d3');

function createChart(elementId, data, xLabel, yLabel) {
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(`#${elementId}`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height, 0]);

  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%H:%M')));

  svg.append('g')
    .call(d3.axisLeft(y));

  svg.append('text')
    .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
    .style('text-anchor', 'middle')
    .text(xLabel);

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text(yLabel);

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value))
    );
}

// Sample data for visualization
const temperatureData = [
  { date: new Date('2023-10-01T08:00:00'), value: 22 },
  { date: new Date('2023-10-01T09:00:00'), value: 23 },
  { date: new Date('2023-10-01T10:00:00'), value: 24 },
  { date: new Date('2023-10-01T11:00:00'), value: 25 },
  { date: new Date('2023-10-01T12:00:00'), value: 26 }
];

const humidityData = [
  { date: new Date('2023-10-01T08:00:00'), value: 40 },
  { date: new Date('2023-10-01T09:00:00'), value: 42 },
  { date: new Date('2023-10-01T10:00:00'), value: 44 },
  { date: new Date('2023-10-01T11:00:00'), value: 46 },
  { date: new Date('2023-10-01T12:00:00'), value: 48 }
];

const energyData = [
  { date: new Date('2023-10-01T08:00:00'), value: 100 },
  { date: new Date('2023-10-01T09:00:00'), value: 120 },
  { date: new Date('2023-10-01T10:00:00'), value: 140 },
  { date: new Date('2023-10-01T11:00:00'), value: 160 },
  { date: new Date('2023-10-01T12:00:00'), value: 180 }
];

createChart('temperatureChart', temperatureData, 'Time', 'Temperature (°C)');
createChart('humidityChart', humidityData, 'Time', 'Humidity (%)');
createChart('energyChart', energyData, 'Time', 'Energy Consumption (kWh)');

// WebSocket for Device Control
const socket = io();

document.getElementById('toggleLight').addEventListener('click', () => {
  socket.emit('toggleDevice', { device: 'light' });
});

document.getElementById('toggleAC').addEventListener('click', () => {
  socket.emit('toggleDevice', { device: 'ac' });
});

socket.on('deviceStatus', (status) => {
  console.log('Device Status:', status);
});

// Node.js Server (Example)
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('toggleDevice', (data) => {
    console.log(`Toggle ${data.device}`);
    // Logic to toggle the device
    socket.emit('deviceStatus', { device: data.device, status: 'toggled' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});