// Task Management System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for tasks
const tasks = {};

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createTask', (task) => {
    const taskId = uuidv4();
    tasks[taskId] = { ...task, id: taskId, status: 'open' };
    io.emit('taskCreated', tasks[taskId]);
  });

  socket.on('updateTask', (updatedTask) => {
    if (tasks[updatedTask.id]) {
      tasks[updatedTask.id] = { ...tasks[updatedTask.id], ...updatedTask };
      io.emit('taskUpdated', tasks[updatedTask.id]);
    }
  });

  socket.on('deleteTask', (taskId) => {
    if (tasks[taskId]) {
      delete tasks[taskId];
      io.emit('taskDeleted', taskId);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createTask', (req, res) => {
  const task = req.body;
  const taskId = uuidv4();
  tasks[taskId] = { ...task, id: taskId, status: 'open' };
  res.status(200).json(tasks[taskId]);
});

app.put('/api/updateTask', (req, res) => {
  const updatedTask = req.body;
  if (tasks[updatedTask.id]) {
    tasks[updatedTask.id] = { ...tasks[updatedTask.id], ...updatedTask };
    res.status(200).json(tasks[updatedTask.id]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/deleteTask', (req, res) => {
  const { taskId } = req.body;
  if (tasks[taskId]) {
    delete tasks[taskId];
    res.status(200).json({ message: 'Task deleted successfully' });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.get('/api/tasks', (req, res) => {
  res.status(200).json(tasks);
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
  const [tasks, setTasks] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('taskCreated', (task) => {
      setTasks((prevTasks) => ({ ...prevTasks, [task.id]: task }));
    });

    newSocket.on('taskUpdated', (task) => {
      setTasks((prevTasks) => ({ ...prevTasks, [task.id]: task }));
    });

    newSocket.on('taskDeleted', (taskId) => {
      setTasks((prevTasks) => {
        const { [taskId]: _, ...rest } = prevTasks;
        return rest;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const response = await axios.get('/api/tasks');
    setTasks(response.data);
  };

  const handleCreateTask = async (task) => {
    await axios.post('/api/createTask', task);
  };

  const handleUpdateTask = async (task) => {
    await axios.put('/api/updateTask', task);
  };

  const handleDeleteTask = async (taskId) => {
    await axios.delete('/api/deleteTask', { data: { taskId } });
  };

  return (
    <div>
      <h1>Task Management System</h1>
      <div>
        <h2>Create Task</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const task = {
              title: e.target.title.value,
              description: e.target.description.value,
              deadline: e.target.deadline.value,
              priority: e.target.priority.value,
            };
            handleCreateTask(task);
            e.target.reset();
          }}
        >
          <input type="text" name="title" placeholder="Title" required />
          <input type="text" name="description" placeholder="Description" required />
          <input type="date" name="deadline" required />
          <select name="priority" required>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit">Create Task</button>
        </form>
      </div>
      <div>
        <h2>Tasks</h2>
        <ul>
          {Object.values(tasks).map((task) => (
            <li key={task.id}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <p>Deadline: {task.deadline}</p>
              <p>Priority: {task.priority}</p>
              <button onClick={() => handleUpdateTask({ ...task, status: 'completed' })}>Mark as Completed</button>
              <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;