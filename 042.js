// Smart Agriculture Monitoring System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for sensor data
const sensorData = {
  soilMoisture: [],
  temperature: [],
  cropHealth: [],
};

// Function to collect sensor data
function collectSensorData(type, value) {
  if (sensorData[type]) {
    sensorData[type].push({ timestamp: new Date().toISOString(), value });
  }
}

// WebSocket server setup for real-time data streaming
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('sensorData', (data) => {
    collectSensorData(data.type, data.value);
    io.emit('sensorDataUpdate', sensorData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Load TensorFlow.js model for predictive analytics
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/model.json');
  return model;
}

// Function to perform predictive analytics
async function performPredictiveAnalytics(data) {
  const model = await loadModel();
  const input = tf.tensor(data);
  const prediction = model.predict(input);
  const result = prediction.dataSync();
  return result;
}

// API routes
app.post('/api/collectSensorData', (req, res) => {
  const { type, value } = req.body;
  collectSensorData(type, value);
  res.status(200).json({ message: 'Sensor data collected successfully' });
});

app.get('/api/sensorData', (req, res) => {
  res.status(200).json(sensorData);
});

app.post('/api/predictiveAnalytics', async (req, res) => {
  const { data } = req.body;
  const result = await performPredictiveAnalytics(data);
  res.status(200).json({ result });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Line } from 'react-chartjs-2';

function App() {
  const [sensorData, setSensorData] = useState({ soilMoisture: [], temperature: [], cropHealth: [] });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('sensorDataUpdate', (data) => {
      setSensorData(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCollectSensorData = async (type, value) => {
    await axios.post('/api/collectSensorData', { type, value });
  };

  const handlePredictiveAnalytics = async () => {
    const data = [/* sensor data for prediction */];
    const response = await axios.post('/api/predictiveAnalytics', { data });
    console.log('Predictive analytics result:', response.data.result);
  };

  const chartData = {
    labels: sensorData.soilMoisture.map((data) => data.timestamp),
    datasets: [
      {
        label: 'Soil Moisture',
        data: sensorData.soilMoisture.map((data) => data.value),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
      {
        label: 'Temperature',
        data: sensorData.temperature.map((data) => data.value),
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
      },
      {
        label: 'Crop Health',
        data: sensorData.cropHealth.map((data) => data.value),
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Smart Agriculture Monitoring System</h1>
      <div>
        <button onClick={() => handleCollectSensorData('soilMoisture', Math.random() * 100)}>
          Collect Soil Moisture Data
        </button>
        <button onClick={() => handleCollectSensorData('temperature', Math.random() * 50)}>
          Collect Temperature Data
        </button>
        <button onClick={() => handleCollectSensorData('cropHealth', Math.random() * 100)}>
          Collect Crop Health Data
        </button>
        <button onClick={handlePredictiveAnalytics}>Perform Predictive Analytics</button>
      </div>
      <div>
        <h2>Sensor Data</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default App;