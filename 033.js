// Collaborative Code Editor

// Import necessary libraries
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import { exec } from 'child_process';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for simplicity (replace with a database in production)
const sessions = {};

// API routes
app.post('/api/createSession', (req, res) => {
  const sessionId = uuidv4();
  sessions[sessionId] = {
    id: sessionId,
    code: '',
    users: [],
  };
  res.status(200).json({ sessionId });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId];
  if (session) {
    res.status(200).json(session);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// WebSocket server setup for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinSession', ({ sessionId, username }) => {
    const session = sessions[sessionId];
    if (session) {
      session.users.push({ id: socket.id, username });
      socket.join(sessionId);
      io.to(sessionId).emit('userJoined', { id: socket.id, username });
      socket.emit('sessionData', session);
    } else {
      socket.emit('error', { message: 'Session not found' });
    }
  });

  socket.on('updateCode', ({ sessionId, code }) => {
    const session = sessions[sessionId];
    if (session) {
      session.code = code;
      io.to(sessionId).emit('codeUpdated', { code });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    Object.keys(sessions).forEach((sessionId) => {
      const session = sessions[sessionId];
      session.users = session.users.filter((user) => user.id !== socket.id);
      io.to(sessionId).emit('userLeft', { id: socket.id });
    });
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const socket = io('http://localhost:3000');

  useEffect(() => {
    socket.on('sessionData', (session) => {
      setCode(session.code);
      setUsers(session.users);
    });

    socket.on('codeUpdated', ({ code }) => {
      setCode(code);
    });

    socket.on('userJoined', (user) => {
      setUsers((prevUsers) => [...prevUsers, user]);
    });

    socket.on('userLeft', ({ id }) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const handleCreateSession = async () => {
    const response = await axios.post('/api/createSession');
    setSessionId(response.data.sessionId);
    socket.emit('joinSession', { sessionId: response.data.sessionId, username });
  };

  const handleJoinSession = async () => {
    const response = await axios.get(`/api/sessions/${sessionId}`);
    if (response.data) {
      socket.emit('joinSession', { sessionId, username });
    } else {
      alert('Session not found');
    }
  };

  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit('updateCode', { sessionId, code: value });
  };

  return (
    <div>
      <h1>Collaborative Code Editor</h1>
      <div>
        <input
          type="text"
          placeholder="Session ID"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={handleCreateSession}>Create Session</button>
        <button onClick={handleJoinSession}>Join Session</button>
      </div>
      <div>
        <h2>Users in Session</h2>
        <ul>
          {users.map((user) => (
            <li key={user.id}>{user.username}</li>
          ))}
        </ul>
      </div>
      <CodeMirror
        value={code}
        height="500px"
        extensions={[javascript({ jsx: true })]}
        onChange={handleCodeChange}
      />
    </div>
  );
}

export default App;