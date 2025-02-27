// AI-based Music Recommendation System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Spotify API credentials (replace with your actual credentials)
const SPOTIFY_CLIENT_ID = 'your-spotify-client-id';
const SPOTIFY_CLIENT_SECRET = 'your-spotify-client-secret';
const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/callback';
const SPOTIFY_SCOPES = 'user-read-private user-read-email user-library-read streaming';

// Function to get Spotify access token
async function getSpotifyAccessToken() {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
      },
    }
  );
  return response.data.access_token;
}

// Load TensorFlow.js model
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/model.json');
  return model;
}

// Function to generate music recommendations
async function getMusicRecommendations(userData) {
  const model = await loadModel();
  const input = tf.tensor(userData);
  const prediction = model.predict(input);
  const recommendations = prediction.dataSync();

  // Example logic to map predictions to music recommendations
  const recommendedTracks = recommendations.map((score, index) => ({
    trackId: index,
    score,
  }));

  return recommendedTracks;
}

// API routes
app.get('/api/spotify/login', (req, res) => {
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}`;
  res.redirect(url);
});

app.get('/api/spotify/callback', async (req, res) => {
  const { code } = req.query;
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
      },
    }
  );

  const accessToken = response.data.access_token;
  res.redirect(`/?access_token=${accessToken}`);
});

app.get('/api/spotify/me', async (req, res) => {
  const { access_token } = req.query;
  const response = await axios.get('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  res.json(response.data);
});

app.get('/api/spotify/playlists', async (req, res) => {
  const { access_token } = req.query;
  const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  res.json(response.data);
});

app.post('/api/recommendations', async (req, res) => {
  const { userData } = req.body;
  const recommendations = await getMusicRecommendations(userData);
  res.json(recommendations);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [accessToken, setAccessToken] = useState('');
  const [userData, setUserData] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    if (token) {
      setAccessToken(token);
      fetchUserData(token);
      fetchPlaylists(token);
    }
  }, []);

  const fetchUserData = async (token) => {
    const response = await axios.get('/api/spotify/me', {
      params: { access_token: token },
    });
    setUserData(response.data);
  };

  const fetchPlaylists = async (token) => {
    const response = await axios.get('/api/spotify/playlists', {
      params: { access_token: token },
    });
    setPlaylists(response.data.items);
  };

  const handleGetRecommendations = async () => {
    const response = await axios.post('/api/recommendations', {
      userData: [/* user listening history data */],
    });
    setRecommendations(response.data);
  };

  const handleLogin = () => {
    window.location.href = '/api/spotify/login';
  };

  return (
    <div>
      <h1>AI-based Music Recommendation System</h1>
      {!accessToken ? (
        <button onClick={handleLogin}>Login with Spotify</button>
      ) : (
        <div>
          <h2>User Data</h2>
          <pre>{JSON.stringify(userData, null, 2)}</pre>
          <h2>Playlists</h2>
          <ul>
            {playlists.map((playlist) => (
              <li key={playlist.id}>{playlist.name}</li>
            ))}
          </ul>
          <button onClick={handleGetRecommendations}>Get Recommendations</button>
          <h2>Recommendations</h2>
          <ul>
            {recommendations.map((recommendation) => (
              <li key={recommendation.trackId}>Track ID: {recommendation.trackId}, Score: {recommendation.score}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;