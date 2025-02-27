// Weather Forecast Dashboard

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { Server } from 'socket.io';
import http from 'http';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Function to fetch weather data from a public API
async function fetchWeatherData(location) {
  const apiKey = 'your_api_key'; // Replace with your actual API key
  const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`);
  return response.data;
}

// Function to fetch hourly weather data from a public API
async function fetchHourlyWeatherData(location) {
  const apiKey = 'your_api_key'; // Replace with your actual API key
  const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}`);
  return response.data;
}

// Function to fetch weekly weather data from a public API
async function fetchWeeklyWeatherData(location) {
  const apiKey = 'your_api_key'; // Replace with your actual API key
  const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}`);
  return response.data;
}

// Function to fetch historical weather data from a public API
async function fetchHistoricalWeatherData(location, date) {
  const apiKey = 'your_api_key'; // Replace with your actual API key
  const response = await axios.get(`https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${location.lat}&lon=${location.lon}&dt=${date}&appid=${apiKey}`);
  return response.data;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('fetchWeather', async (location) => {
    const data = await fetchWeatherData(location);
    socket.emit('weatherData', data);
  });

  socket.on('fetchHourlyWeather', async (location) => {
    const data = await fetchHourlyWeatherData(location);
    socket.emit('hourlyWeatherData', data);
  });

  socket.on('fetchWeeklyWeather', async (location) => {
    const data = await fetchWeeklyWeatherData(location);
    socket.emit('weeklyWeatherData', data);
  });

  socket.on('fetchHistoricalWeather', async (location, date) => {
    const data = await fetchHistoricalWeatherData(location, date);
    socket.emit('historicalWeatherData', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/fetchWeather', async (req, res) => {
  const { location } = req.body;
  const data = await fetchWeatherData(location);
  res.status(200).json(data);
});

app.post('/api/fetchHourlyWeather', async (req, res) => {
  const { location } = req.body;
  const data = await fetchHourlyWeatherData(location);
  res.status(200).json(data);
});

app.post('/api/fetchWeeklyWeather', async (req, res) => {
  const { location } = req.body;
  const data = await fetchWeeklyWeatherData(location);
  res.status(200).json(data);
});

app.post('/api/fetchHistoricalWeather', async (req, res) => {
  const { location, date } = req.body;
  const data = await fetchHistoricalWeatherData(location, date);
  res.status(200).json(data);
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
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyWeatherData, setHourlyWeatherData] = useState(null);
  const [weeklyWeatherData, setWeeklyWeatherData] = useState(null);
  const [historicalWeatherData, setHistoricalWeatherData] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('weatherData', (data) => {
      setWeatherData(data);
    });

    newSocket.on('hourlyWeatherData', (data) => {
      setHourlyWeatherData(data);
    });

    newSocket.on('weeklyWeatherData', (data) => {
      setWeeklyWeatherData(data);
    });

    newSocket.on('historicalWeatherData', (data) => {
      setHistoricalWeatherData(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleFetchWeather = async () => {
    socket.emit('fetchWeather', location);
  };

  const handleFetchHourlyWeather = async () => {
    socket.emit('fetchHourlyWeather', location);
  };

  const handleFetchWeeklyWeather = async () => {
    socket.emit('fetchWeeklyWeather', location);
  };

  const handleFetchHistoricalWeather = async () => {
    const date = new Date().toISOString();
    socket.emit('fetchHistoricalWeather', { lat: location.lat, lon: location.lon }, date);
  };

  const chartData = {
    labels: hourlyWeatherData ? hourlyWeatherData.list.map((item) => item.dt_txt) : [],
    datasets: [
      {
        label: 'Temperature',
        data: hourlyWeatherData ? hourlyWeatherData.list.map((item) => item.main.temp) : [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Weather Forecast Dashboard</h1>
      <div>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button onClick={handleFetchWeather}>Fetch Weather</button>
        <button onClick={handleFetchHourlyWeather}>Fetch Hourly Weather</button>
        <button onClick={handleFetchWeeklyWeather}>Fetch Weekly Weather</button>
        <button onClick={handleFetchHistoricalWeather}>Fetch Historical Weather</button>
      </div>
      <div>
        <h2>Current Weather</h2>
        {weatherData && (
          <div>
            <p>Temperature: {weatherData.main.temp}°C</p>
            <p>Weather: {weatherData.weather[0].description}</p>
            <p>Humidity: {weatherData.main.humidity}%</p>
          </div>
        )}
      </div>
      <div>
        <h2>Hourly Weather</h2>
        {hourlyWeatherData && (
          <div>
            <Line data={chartData} />
          </div>
        )}
      </div>
      <div>
        <h2>Weekly Weather</h2>
        {weeklyWeatherData && (
          <div>
            {weeklyWeatherData.list.map((item, index) => (
              <p key={index}>
                {item.dt_txt}: {item.main.temp}°C
              </p>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2>Historical Weather</h2>
        {historicalWeatherData && (
          <div>
            {historicalWeatherData.hourly.map((item, index) => (
              <p key={index}>
                {item.dt}: {item.temp}°C
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;