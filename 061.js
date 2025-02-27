// Augmented Reality Shopping Experience

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/uploadModel', (req, res) => {
  const { modelUrl } = req.body;
  // Handle model upload logic here
  res.status(200).json({ message: 'Model uploaded successfully' });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React and Three.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

extend({ ARButton });

function App() {
  const [modelUrl, setModelUrl] = useState('');
  const [socket, setSocket] = useState(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleUploadModel = async () => {
    await axios.post('/api/uploadModel', { modelUrl });
  };

  useFrame(() => {
    if (sceneRef.current) {
      // Update scene logic here
    }
  });

  return (
    <div>
      <h1>Augmented Reality Shopping Experience</h1>
      <input
        type="text"
        placeholder="Model URL"
        value={modelUrl}
        onChange={(e) => setModelUrl(e.target.value)}
      />
      <button onClick={handleUploadModel}>Upload Model</button>
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <arButton />
        <mesh ref={sceneRef}>
          {/* Load and display 3D model here */}
        </mesh>
      </Canvas>
    </div>
  );
}

export default App;