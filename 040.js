// Neural Network Model Training Interface

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import * as tf from '@tensorflow/tfjs';
import { io } from 'socket.io-client';
import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js';
import 'chartjs-adapter-date-fns';
import 'chartjs-plugin-annotation';

// Initialize Express app
const app = express();
const port = 3000;
const server = require('http').createServer(app);
const ioServer = require('socket.io')(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for simplicity (replace with a database in production)
const models = {};

// Function to create a neural network model
function createModel(layers) {
  const model = tf.sequential();
  layers.forEach((layer) => {
    model.add(tf.layers[layer.type](layer.config));
  });
  return model;
}

// Function to train the neural network model
async function trainModel(model, data, labels, epochs, callback) {
  const history = await model.fit(data, labels, {
    epochs: epochs,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        callback(logs);
      },
    },
  });
  return history;
}

// WebSocket server setup for real-time communication
ioServer.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createModel', ({ modelId, layers }) => {
    const model = createModel(layers);
    models[modelId] = model;
    socket.emit('modelCreated', { modelId });
  });

  socket.on('trainModel', ({ modelId, data, labels, epochs }) => {
    const model = models[modelId];
    if (model) {
      trainModel(model, data, labels, epochs, (logs) => {
        socket.emit('trainingLogs', { modelId, logs });
      });
    } else {
      socket.emit('error', { message: 'Model not found' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createModel', (req, res) => {
  const { modelId, layers } = req.body;
  const model = createModel(layers);
  models[modelId] = model;
  res.status(200).json({ modelId });
});

app.post('/api/trainModel', async (req, res) => {
  const { modelId, data, labels, epochs } = req.body;
  const model = models[modelId];
  if (model) {
    const history = await trainModel(model, data, labels, epochs, (logs) => {
      res.write(`data: ${JSON.stringify(logs)}\n\n`);
    });
    res.status(200).json(history);
  } else {
    res.status(404).json({ error: 'Model not found' });
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
function App() {
  const [modelId, setModelId] = useState('');
  const [layers, setLayers] = useState([]);
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);
  const [epochs, setEpochs] = useState(10);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('modelCreated', ({ modelId }) => {
      console.log('Model created:', modelId);
    });

    newSocket.on('trainingLogs', ({ modelId, logs }) => {
      setTrainingLogs((prevLogs) => [...prevLogs, logs]);
      updateChart(logs);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Error:', message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCreateModel = () => {
    socket.emit('createModel', { modelId, layers });
  };

  const handleTrainModel = () => {
    socket.emit('trainModel', { modelId, data, labels, epochs });
  };

  const handleAddLayer = (layer) => {
    setLayers((prevLayers) => [...prevLayers, layer]);
  };

  const handleUploadData = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = JSON.parse(e.target.result);
      setData(result.data);
      setLabels(result.labels);
    };
    reader.readAsText(file);
  };

  const updateChart = (logs) => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.labels.push(logs.epoch);
      chart.data.datasets[0].data.push(logs.loss);
      chart.update();
    }
  };

  useEffect(() => {
    const ctx = document.getElementById('trainingChart').getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Loss',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
          },
        },
      },
    });
  }, []);

  return (
    <div>
      <h1>Neural Network Model Training Interface</h1>
      <div>
        <input
          type="text"
          placeholder="Model ID"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
        />
        <button onClick={handleCreateModel}>Create Model</button>
      </div>
      <div>
        <h2>Add Layers</h2>
        <button onClick={() => handleAddLayer({ type: 'dense', config: { units: 10, activation: 'relu' } })}>
          Add Dense Layer
        </button>
        <button onClick={() => handleAddLayer({ type: 'conv2d', config: { filters: 32, kernelSize: 3, activation: 'relu' } })}>
          Add Conv2D Layer
        </button>
        <button onClick={() => handleAddLayer({ type: 'flatten', config: {} })}>
          Add Flatten Layer
        </button>
      </div>
      <div>
        <h2>Upload Data</h2>
        <input type="file" accept=".json" onChange={handleUploadData} />
      </div>
      <div>
        <h2>Training Parameters</h2>
        <input
          type="number"
          placeholder="Epochs"
          value={epochs}
          onChange={(e) => setEpochs(parseInt(e.target.value))}
        />
        <button onClick={handleTrainModel}>Train Model</button>
      </div>
      <div>
        <h2>Training Logs</h2>
        <canvas id="trainingChart" width="800" height="400"></canvas>
      </div>
    </div>
  );
}

export default App;