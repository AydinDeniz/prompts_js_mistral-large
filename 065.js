// Virtual Classroom with Interactive Whiteboard

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { fabric } from 'fabric';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for classrooms and whiteboards
const classrooms = {};

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinClassroom', ({ classroomId, userId }) => {
    socket.join(classroomId);
    console.log(`User ${userId} joined classroom ${classroomId}`);
  });

  socket.on('sendMessage', ({ classroomId, userId, message }) => {
    io.to(classroomId).emit('receiveMessage', { userId, message });
  });

  socket.on('draw', ({ classroomId, path }) => {
    if (!classrooms[classroomId]) {
      classrooms[classroomId] = { paths: [] };
    }
    classrooms[classroomId].paths.push(path);
    io.to(classroomId).emit('updateWhiteboard', { paths: classrooms[classroomId].paths });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createClassroom', (req, res) => {
  const { userId } = req.body;
  const classroomId = uuidv4();
  classrooms[classroomId] = { paths: [] };
  res.status(200).json({ classroomId });
});

app.get('/api/classrooms', (req, res) => {
  res.status(200).json(classrooms);
});

app.get('/api/classroom/:classroomId', (req, res) => {
  const { classroomId } = req.params;
  if (classrooms[classroomId]) {
    res.status(200).json(classrooms[classroomId]);
  } else {
    res.status(404).json({ error: 'Classroom not found' });
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { fabric } from 'fabric';

function App() {
  const [classroomId, setClassroomId] = useState('');
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState([]);
  const [paths, setPaths] = useState([]);
  const [socket, setSocket] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('receiveMessage', ({ userId, message }) => {
      setMessages((prevMessages) => [...prevMessages, { userId, message }]);
    });

    newSocket.on('updateWhiteboard', ({ paths }) => {
      setPaths(paths);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths.forEach((path) => {
          ctx.beginPath();
          path.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
    }
  }, []);

  const handleCreateClassroom = async () => {
    const response = await axios.post('/api/createClassroom', { userId });
    setClassroomId(response.data.classroomId);
    socket.emit('joinClassroom', { classroomId: response.data.classroomId, userId });
  };

  const handleSendMessage = () => {
    const message = prompt('Enter your message:');
    socket.emit('sendMessage', { classroomId, userId, message });
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    const path = [[e.nativeEvent.offsetX, e.nativeEvent.offsetY]];
    socket.emit('draw', { classroomId, path });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    const path = [[e.nativeEvent.offsetX, e.nativeEvent.offsetY]];
    socket.emit('draw', { classroomId, path });
  };

  return (
    <div>
      <h1>Virtual Classroom with Interactive Whiteboard</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={handleCreateClassroom}>Create Classroom</button>
      </div>
      <div>
        <h2>Chat</h2>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              {message.userId}: {message.message}
            </li>
          ))}
        </ul>
        <button onClick={handleSendMessage}>Send Message</button>
      </div>
      <div>
        <h2>Whiteboard</h2>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ border: '1px solid black' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />
      </div>
    </div>
  );
}

export default App;