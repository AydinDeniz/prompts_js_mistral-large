// Cybersecurity Threat Detection Dashboard

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
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

// In-memory data store for network logs
const networkLogs = [];

// Function to load TensorFlow.js model for threat detection
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/threat_detection_model.json');
  return model;
}

// Function to analyze network logs for suspicious activity
async function analyzeLogs(logs) {
  const model = await loadModel();
  const input = tf.tensor(logs);
  const prediction = model.predict(input);
  const result = prediction.dataSync();
  return result;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('newLog', (log) => {
    networkLogs.push(log);
    io.emit('logUpdate', networkLogs);
  });

  socket.on('analyzeLogs', async () => {
    const result = await analyzeLogs(networkLogs);
    io.emit('analysisResult', result);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/newLog', (req, res) => {
  const { log } = req.body;
  networkLogs.push(log);
  res.status(200).json({ message: 'Log added successfully' });
});

app.get('/api/logs', (req, res) => {
  res.status(200).json(networkLogs);
});

app.post('/api/analyzeLogs', async (req, res) => {
  const result = await analyzeLogs(networkLogs);
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
  const [logs, setLogs] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('logUpdate', (updatedLogs) => {
      setLogs(updatedLogs);
    });

    newSocket.on('analysisResult', (result) => {
      setAnalysisResult(result);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleAddLog = async (log) => {
    await axios.post('/api/newLog', { log });
  };

  const handleAnalyzeLogs = async () => {
    socket.emit('analyzeLogs');
  };

  const chartData = {
    labels: logs.map((log, index) => `Log ${index + 1}`),
    datasets: [
      {
        label: 'Suspicious Activity',
        data: logs.map((log) => log.suspiciousScore),
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Cybersecurity Threat Detection Dashboard</h1>
      <div>
        <button onClick={() => handleAddLog({ timestamp: new Date().toISOString(), suspiciousScore: Math.random() })}>
          Add Log
        </button>
        <button onClick={handleAnalyzeLogs}>Analyze Logs</button>
      </div>
      <div>
        <h2>Network Logs</h2>
        <ul>
          {logs.map((log, index) => (
            <li key={index}>
              {log.timestamp} - Suspicious Score: {log.suspiciousScore}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Analysis Result</h2>
        {analysisResult && (
          <div>
            <p>Suspicious Activity Detected: {analysisResult}</p>
          </div>
        )}
      </div>
      <div>
        <h2>Suspicious Activity Chart</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default App;