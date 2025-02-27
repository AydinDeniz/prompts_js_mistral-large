// Distributed File Collaboration System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import WebTorrent from 'webtorrent';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for file metadata
const fileMetadata = {};

// Function to create a new file
function createFile(fileId, content) {
  const filePath = path.join(__dirname, 'files', `${fileId}.txt`);
  fs.writeFileSync(filePath, content);
  fileMetadata[fileId] = { content, versions: [content], collaborators: [] };
}

// Function to update a file
function updateFile(fileId, content) {
  const filePath = path.join(__dirname, 'files', `${fileId}.txt`);
  fs.writeFileSync(filePath, content);
  fileMetadata[fileId].content = content;
  fileMetadata[fileId].versions.push(content);
}

// Function to resolve conflicts
function resolveConflict(fileId, content) {
  const filePath = path.join(__dirname, 'files', `${fileId}.txt`);
  fs.writeFileSync(filePath, content);
  fileMetadata[fileId].content = content;
  fileMetadata[fileId].versions.push(content);
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createFile', ({ userId, content }) => {
    const fileId = uuidv4();
    createFile(fileId, content);
    fileMetadata[fileId].collaborators.push(userId);
    io.emit('fileCreated', { fileId, content, userId });
  });

  socket.on('updateFile', ({ fileId, content, userId }) => {
    updateFile(fileId, content);
    io.emit('fileUpdated', { fileId, content, userId });
  });

  socket.on('resolveConflict', ({ fileId, content, userId }) => {
    resolveConflict(fileId, content);
    io.emit('conflictResolved', { fileId, content, userId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createFile', (req, res) => {
  const { userId, content } = req.body;
  const fileId = uuidv4();
  createFile(fileId, content);
  fileMetadata[fileId].collaborators.push(userId);
  res.status(200).json({ fileId });
});

app.post('/api/updateFile', (req, res) => {
  const { fileId, content, userId } = req.body;
  updateFile(fileId, content);
  res.status(200).json({ message: 'File updated successfully' });
});

app.post('/api/resolveConflict', (req, res) => {
  const { fileId, content, userId } = req.body;
  resolveConflict(fileId, content);
  res.status(200).json({ message: 'Conflict resolved successfully' });
});

app.get('/api/fileMetadata/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (fileMetadata[fileId]) {
    res.status(200).json(fileMetadata[fileId]);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
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
  const [files, setFiles] = useState([]);
  const [userId, setUserId] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('fileCreated', ({ fileId, content, userId }) => {
      setFiles((prevFiles) => [...prevFiles, { fileId, content, userId }]);
    });

    newSocket.on('fileUpdated', ({ fileId, content, userId }) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) => (file.fileId === fileId ? { ...file, content, userId } : file))
      );
    });

    newSocket.on('conflictResolved', ({ fileId, content, userId }) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) => (file.fileId === fileId ? { ...file, content, userId } : file))
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCreateFile = async (content) => {
    await axios.post('/api/createFile', { userId, content });
  };

  const handleUpdateFile = async (fileId, content) => {
    await axios.post('/api/updateFile', { fileId, content, userId });
  };

  const handleResolveConflict = async (fileId, content) => {
    await axios.post('/api/resolveConflict', { fileId, content, userId });
  };

  return (
    <div>
      <h1>Distributed File Collaboration System</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <h2>Create File</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const content = e.target.content.value;
            handleCreateFile(content);
            e.target.reset();
          }}
        >
          <textarea name="content" placeholder="File content" required></textarea>
          <button type="submit">Create File</button>
        </form>
      </div>
      <div>
        <h2>Files</h2>
        <ul>
          {files.map((file) => (
            <li key={file.fileId}>
              <h3>{file.fileId}</h3>
              <p>{file.content}</p>
              <button onClick={() => handleUpdateFile(file.fileId, prompt('Update content'))}>Update</button>
              <button onClick={() => handleResolveConflict(file.fileId, prompt('Resolve conflict'))}>Resolve Conflict</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;