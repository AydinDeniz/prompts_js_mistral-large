// Sustainable Energy Management System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import * as tf from '@tensorflow/tfjs';
import axios from 'axios';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for energy data
const energyData = {};

// Function to load TensorFlow.js model for predictive analytics
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/energy_model.json');
  return model;
}

// Function to analyze energy data and provide predictions
async function analyzeEnergyData(data) {
  const model = await loadModel();
  const input = tf.tensor(data);
  const prediction = model.predict(input);
  const result = prediction.dataSync();
  return result;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('updateEnergyData', (data) => {
    energyData[socket.id] = data;
    io.emit('energyDataUpdate', energyData);
  });

  socket.on('requestPrediction', async (data) => {
    const result = await analyzeEnergyData(data);
    socket.emit('predictionResult', result);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete energyData[socket.id];
  });
});

// API routes
app.post('/api/updateEnergyData', (req, res) => {
  const { data } = req.body;
  energyData[req.socket.id] = data;
  res.status(200).json({ message: 'Energy data updated successfully' });
});

app.post('/api/requestPrediction', async (req, res) => {
  const { data } = req.body;
  const result = await analyzeEnergyData(data);
  res.status(200).json({ result });
});

app.get('/api/energyData', (req, res) => {
  res.status(200).json(energyData);
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
  const [energyData, setEnergyData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('energyDataUpdate', (updatedData) => {
      setEnergyData(updatedData);
    });

    newSocket.on('predictionResult', (result) => {
      setPrediction(result);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleUpdateEnergyData = async (data) => {
    await axios.post('/api/updateEnergyData', { data });
    socket.emit('updateEnergyData', data);
  };

  const handleRequestPrediction = async (data) => {
    socket.emit('requestPrediction', data);
  };

  const chartData = {
    labels: Object.keys(energyData),
    datasets: [
      {
        label: 'Energy Consumption',
        data: Object.values(energyData).map((data) => data.consumption),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Sustainable Energy Management System</h1>
      <div>
        <button onClick={() => handleUpdateEnergyData({ consumption: Math.random() * 100 })}>
          Update Energy Data
        </button>
        <button onClick={() => handleRequestPrediction(energyData)}>Request Prediction</button>
      </div>
      <div>
        <h2>Energy Data</h2>
        <Line data={chartData} />
      </div>
      <div>
        <h2>Prediction Result</h2>
        {prediction && (
          <div>
            <p>Predicted Energy Load: {prediction[0]}</p>
            <p>Predicted Energy Storage: {prediction[1]}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;