// Stock Market Data Visualization Tool

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for stock data
const stockData = {};

// Function to fetch stock data from an API
async function fetchStockData(apiUrl) {
  const response = await axios.get(apiUrl);
  return response.data;
}

// Function to process stock data for visualization
function processStockData(data) {
  // Example processing: Extract historical data
  const historicalData = data.map(item => ({
    date: new Date(item.date),
    price: item.close,
  }));
  return historicalData;
}

// Function to generate predictive analytics
function generatePredictiveAnalytics(data) {
  // Example analytics: Moving average
  const movingAverage = data.map((item, index, array) => {
    const windowSize = 5;
    const window = array.slice(Math.max(index - windowSize + 1, 0), index + 1);
    const average = window.reduce((acc, curr) => acc + curr.price, 0) / window.length;
    return { date: item.date, price: average };
  });
  return movingAverage;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('fetchStockData', async (apiUrl) => {
    const data = await fetchStockData(apiUrl);
    const historicalData = processStockData(data);
    const predictiveData = generatePredictiveAnalytics(historicalData);
    socket.emit('stockDataFetched', { historicalData, predictiveData });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/fetchStockData', async (req, res) => {
  const { apiUrl } = req.body;
  const data = await fetchStockData(apiUrl);
  const historicalData = processStockData(data);
  const predictiveData = generatePredictiveAnalytics(historicalData);
  res.status(200).json({ historicalData, predictiveData });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React and D3.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import * as d3 from 'd3';

function App() {
  const [stockData, setStockData] = useState({ historicalData: [], predictiveData: [] });
  const [socket, setSocket] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('stockDataFetched', ({ historicalData, predictiveData }) => {
      setStockData({ historicalData, predictiveData });
      drawChart(historicalData, predictiveData);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleFetchStockData = (apiUrl) => {
    socket.emit('fetchStockData', apiUrl);
  };

  const drawChart = (historicalData, predictiveData) => {
    const chart = d3.select(chartRef.current);
    chart.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const x = d3
      .scaleTime()
      .domain(d3.extent(historicalData, d => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(historicalData, d => d.price),
        d3.max(historicalData, d => d.price),
      ])
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line()
      .x(d => x(d.date))
      .y(d => y(d.price));

    chart
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .append('path')
      .datum(historicalData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    chart
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .append('path')
      .datum(predictiveData)
      .attr('fill', 'none')
      .attr('stroke', 'orange')
      .attr('stroke-width', 1.5)
      .attr('d', line);
  };

  return (
    <div>
      <h1>Stock Market Data Visualization Tool</h1>
      <div>
        <input
          type="text"
          placeholder="API URL"
          onChange={(e) => handleFetchStockData(e.target.value)}
        />
      </div>
      <div>
        <h2>Stock Chart</h2>
        <svg ref={chartRef} width={800} height={400}></svg>
      </div>
    </div>
  );
}

export default App;