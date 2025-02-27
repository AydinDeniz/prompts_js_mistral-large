// Smart Urban Transportation Scheduler

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for transportation data
const transportationData = {};

// Function to load TensorFlow.js model for delay prediction
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/delay_prediction_model.json');
  return model;
}

// Function to fetch real-time transportation data from an API
async function fetchTransportationData(apiUrl) {
  const response = await axios.get(apiUrl);
  return response.data;
}

// Function to predict delays using machine learning
async function predictDelays(data) {
  const model = await loadModel();
  const input = tf.tensor(data);
  const prediction = model.predict(input);
  const result = prediction.dataSync();
  return result;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('fetchData', async (apiUrl) => {
    const data = await fetchTransportationData(apiUrl);
    transportationData[socket.id] = data;
    io.emit('dataUpdate', transportationData);
  });

  socket.on('predictDelays', async (data) => {
    const delays = await predictDelays(data);
    socket.emit('delayPrediction', delays);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete transportationData[socket.id];
  });
});

// API routes
app.post('/api/fetchData', async (req, res) => {
  const { apiUrl } = req.body;
  const data = await fetchTransportationData(apiUrl);
  res.status(200).json(data);
});

app.post('/api/predictDelays', async (req, res) => {
  const { data } = req.body;
  const delays = await predictDelays(data);
  res.status(200).json({ delays });
});

app.get('/api/transportationData', (req, res) => {
  res.status(200).json(transportationData);
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
  const [transportationData, setTransportationData] = useState({});
  const [delays, setDelays] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('dataUpdate', (updatedData) => {
      setTransportationData(updatedData);
    });

    newSocket.on('delayPrediction', (delays) => {
      setDelays(delays);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleFetchData = async (apiUrl) => {
    await axios.post('/api/fetchData', { apiUrl });
    socket.emit('fetchData', apiUrl);
  };

  const handlePredictDelays = async (data) => {
    socket.emit('predictDelays', data);
  };

  const chartData = {
    labels: Object.keys(transportationData),
    datasets: [
      {
        label: 'Transportation Data',
        data: Object.values(transportationData).map((data) => data.value),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Smart Urban Transportation Scheduler</h1>
      <div>
        <button onClick={() => handleFetchData('https://api.example.com/transportation')}>
          Fetch Transportation Data
        </button>
        <button onClick={() => handlePredictDelays(transportationData)}>
          Predict Delays
        </button>
      </div>
      <div>
        <h2>Transportation Data</h2>
        <Line data={chartData} />
      </div>
      <div>
        <h2>Delay Prediction</h2>
        {delays && (
          <div>
            <p>Predicted Delays: {delays.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;