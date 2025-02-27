// Disaster Response Coordination System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for disaster events and resources
const disasterEvents = {};
const resources = {};

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinEvent', ({ eventId }) => {
    socket.join(eventId);
    console.log(`User ${socket.id} joined event ${eventId}`);
  });

  socket.on('updateEvent', (event) => {
    disasterEvents[event.id] = event;
    io.to(event.id).emit('eventUpdate', event);
  });

  socket.on('allocateResource', (resource) => {
    resources[resource.id] = resource;
    io.emit('resourceUpdate', resources);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createEvent', (req, res) => {
  const { id, name, location, status } = req.body;
  const event = { id, name, location, status };
  disasterEvents[id] = event;
  res.status(200).json(event);
});

app.get('/api/events', (req, res) => {
  res.status(200).json(disasterEvents);
});

app.post('/api/allocateResource', (req, res) => {
  const { id, type, quantity, location } = req.body;
  const resource = { id, type, quantity, location };
  resources[id] = resource;
  res.status(200).json(resource);
});

app.get('/api/resources', (req, res) => {
  res.status(200).json(resources);
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
  const [events, setEvents] = useState({});
  const [resources, setResources] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('eventUpdate', (event) => {
      setEvents((prevEvents) => ({ ...prevEvents, [event.id]: event }));
    });

    newSocket.on('resourceUpdate', (updatedResources) => {
      setResources(updatedResources);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCreateEvent = async () => {
    const event = {
      id: Date.now().toString(),
      name: 'Sample Event',
      location: 'Sample Location',
      status: 'Active',
    };
    await axios.post('/api/createEvent', event);
    socket.emit('joinEvent', { eventId: event.id });
  };

  const handleAllocateResource = async () => {
    const resource = {
      id: Date.now().toString(),
      type: 'Water',
      quantity: 100,
      location: 'Sample Location',
    };
    await axios.post('/api/allocateResource', resource);
  };

  return (
    <div>
      <h1>Disaster Response Coordination System</h1>
      <div>
        <button onClick={handleCreateEvent}>Create Event</button>
        <button onClick={handleAllocateResource}>Allocate Resource</button>
      </div>
      <div>
        <h2>Events</h2>
        <ul>
          {Object.values(events).map((event) => (
            <li key={event.id}>
              {event.name} - {event.location} - {event.status}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Resources</h2>
        <ul>
          {Object.values(resources).map((resource) => (
            <li key={resource.id}>
              {resource.type} - {resource.quantity} - {resource.location}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;