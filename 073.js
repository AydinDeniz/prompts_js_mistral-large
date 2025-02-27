// JavaScript Function to Detect Internet Connection Status

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for cached form inputs
const cachedInputs = {};

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('cacheInput', ({ userId, formData }) => {
    if (!cachedInputs[userId]) {
      cachedInputs[userId] = [];
    }
    cachedInputs[userId].push(formData);
  });

  socket.on('syncInputs', ({ userId }) => {
    if (cachedInputs[userId]) {
      cachedInputs[userId].forEach((formData) => {
        // Replace with actual API call to sync with backend
        axios.post('/api/syncInputs', formData)
          .then((response) => {
            console.log('Input synced:', response.data);
          })
          .catch((error) => {
            console.error('Error syncing input:', error);
          });
      });
      cachedInputs[userId] = [];
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/syncInputs', (req, res) => {
  const { userId, formData } = req.body;
  // Replace with actual logic to sync inputs with backend
  console.log('Syncing input:', formData);
  res.status(200).json({ message: 'Input synced successfully' });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function App() {
  const [userId, setUserId] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    const handleOnline = () => {
      setIsOnline(true);
      if (socket) {
        socket.emit('syncInputs', { userId });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      newSocket.disconnect();
    };
  }, [userId, socket]);

  const handleCacheInput = (formData) => {
    if (socket) {
      socket.emit('cacheInput', { userId, formData });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    if (isOnline) {
      axios.post('/api/submitForm', data)
        .then((response) => {
          console.log('Form submitted:', response.data);
        })
        .catch((error) => {
          console.error('Error submitting form:', error);
        });
    } else {
      handleCacheInput(data);
    }
  };

  return (
    <div>
      <h1>Internet Connection Status</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <h2>Form</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Name" required />
          <input type="email" name="email" placeholder="Email" required />
          <button type="submit">Submit</button>
        </form>
      </div>
      <div>
        <h2>Connection Status</h2>
        <p>{isOnline ? 'Online' : 'Offline'}</p>
      </div>
    </div>
  );
}

export default App;