const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());

const API_KEY = 'your_weather_api_key';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

app.get('/weather', async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).send('City parameter is required');
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric'
      }
    });

    const weatherData = {
      city: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed
    };

    res.json(weatherData);
  } catch (error) {
    res.status(500).send('Error fetching weather data');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});