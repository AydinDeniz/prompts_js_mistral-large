// Fitness and Nutrition Tracker

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

// In-memory data store for fitness and nutrition data
const fitnessData = {};
const nutritionData = {};

// Function to log workouts
function logWorkout(userId, workout) {
  if (!fitnessData[userId]) {
    fitnessData[userId] = [];
  }
  fitnessData[userId].push(workout);
}

// Function to log meals
function logMeal(userId, meal) {
  if (!nutritionData[userId]) {
    nutritionData[userId] = [];
  }
  nutritionData[userId].push(meal);
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('logWorkout', ({ userId, workout }) => {
    logWorkout(userId, workout);
    io.emit('workoutLogged', { userId, workout });
  });

  socket.on('logMeal', ({ userId, meal }) => {
    logMeal(userId, meal);
    io.emit('mealLogged', { userId, meal });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/logWorkout', (req, res) => {
  const { userId, workout } = req.body;
  logWorkout(userId, workout);
  res.status(200).json({ message: 'Workout logged successfully' });
});

app.post('/api/logMeal', (req, res) => {
  const { userId, meal } = req.body;
  logMeal(userId, meal);
  res.status(200).json({ message: 'Meal logged successfully' });
});

app.get('/api/fitnessData/:userId', (req, res) => {
  const { userId } = req.params;
  if (fitnessData[userId]) {
    res.status(200).json(fitnessData[userId]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/nutritionData/:userId', (req, res) => {
  const { userId } = req.params;
  if (nutritionData[userId]) {
    res.status(200).json(nutritionData[userId]);
  } else {
    res.status(404).json({ error: 'User not found' });
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
  const [userId, setUserId] = useState('');
  const [fitnessData, setFitnessData] = useState([]);
  const [nutritionData, setNutritionData] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('workoutLogged', ({ userId, workout }) => {
      if (userId === userId) {
        setFitnessData((prevData) => [...prevData, workout]);
      }
    });

    newSocket.on('mealLogged', ({ userId, meal }) => {
      if (userId === userId) {
        setNutritionData((prevData) => [...prevData, meal]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    fetchFitnessData();
    fetchNutritionData();
  }, [userId]);

  const fetchFitnessData = async () => {
    const response = await axios.get(`/api/fitnessData/${userId}`);
    setFitnessData(response.data);
  };

  const fetchNutritionData = async () => {
    const response = await axios.get(`/api/nutritionData/${userId}`);
    setNutritionData(response.data);
  };

  const handleLogWorkout = async (workout) => {
    await axios.post('/api/logWorkout', { userId, workout });
  };

  const handleLogMeal = async (meal) => {
    await axios.post('/api/logMeal', { userId, meal });
  };

  return (
    <div>
      <h1>Fitness and Nutrition Tracker</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <h2>Log Workout</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const workout = {
              type: e.target.type.value,
              duration: e.target.duration.value,
              date: e.target.date.value,
            };
            handleLogWorkout(workout);
            e.target.reset();
          }}
        >
          <input type="text" name="type" placeholder="Workout Type" required />
          <input type="number" name="duration" placeholder="Duration (minutes)" required />
          <input type="date" name="date" required />
          <button type="submit">Log Workout</button>
        </form>
      </div>
      <div>
        <h2>Log Meal</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const meal = {
              type: e.target.type.value,
              calories: e.target.calories.value,
              date: e.target.date.value,
            };
            handleLogMeal(meal);
            e.target.reset();
          }}
        >
          <input type="text" name="type" placeholder="Meal Type" required />
          <input type="number" name="calories" placeholder="Calories" required />
          <input type="date" name="date" required />
          <button type="submit">Log Meal</button>
        </form>
      </div>
      <div>
        <h2>Fitness Data</h2>
        <ul>
          {fitnessData.map((workout, index) => (
            <li key={index}>
              {workout.type} - {workout.duration} minutes - {workout.date}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Nutrition Data</h2>
        <ul>
          {nutritionData.map((meal, index) => (
            <li key={index}>
              {meal.type} - {meal.calories} calories - {meal.date}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;