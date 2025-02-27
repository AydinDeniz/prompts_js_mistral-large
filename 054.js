// Social Media Feed Analyzer

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { SentimentAnalyzer } from 'natural';
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

// Initialize SentimentAnalyzer
const analyzer = new SentimentAnalyzer('English', 'PorterStemmer', 'AFINN');

// Function to fetch social media data from Twitter API
async function fetchTwitterData(username) {
  const apiKey = 'your_twitter_api_key'; // Replace with your actual Twitter API key
  const response = await axios.get(`https://api.twitter.com/2/users/${username}/tweets`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return response.data;
}

// Function to fetch social media data from Instagram API
async function fetchInstagramData(username) {
  const apiKey = 'your_instagram_api_key'; // Replace with your actual Instagram API key
  const response = await axios.get(`https://graph.instagram.com/${username}/media`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return response.data;
}

// Function to analyze sentiment of text
function analyzeSentiment(text) {
  const analysis = analyzer.getSentiment(text);
  return analysis;
}

// Function to analyze trends and patterns from social media data
function analyzeTrends(data) {
  const trends = {};
  data.forEach((post) => {
    const words = post.text.split(' ');
    words.forEach((word) => {
      if (trends[word]) {
        trends[word]++;
      } else {
        trends[word] = 1;
      }
    });
  });
  return trends;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('fetchTwitterData', async (username) => {
    const data = await fetchTwitterData(username);
    socket.emit('twitterData', data);
  });

  socket.on('fetchInstagramData', async (username) => {
    const data = await fetchInstagramData(username);
    socket.emit('instagramData', data);
  });

  socket.on('analyzeSentiment', (text) => {
    const analysis = analyzeSentiment(text);
    socket.emit('sentimentAnalysis', analysis);
  });

  socket.on('analyzeTrends', (data) => {
    const trends = analyzeTrends(data);
    socket.emit('trendAnalysis', trends);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/fetchTwitterData', async (req, res) => {
  const { username } = req.body;
  const data = await fetchTwitterData(username);
  res.status(200).json(data);
});

app.post('/api/fetchInstagramData', async (req, res) => {
  const { username } = req.body;
  const data = await fetchInstagramData(username);
  res.status(200).json(data);
});

app.post('/api/analyzeSentiment', (req, res) => {
  const { text } = req.body;
  const analysis = analyzeSentiment(text);
  res.status(200).json(analysis);
});

app.post('/api/analyzeTrends', (req, res) => {
  const { data } = req.body;
  const trends = analyzeTrends(data);
  res.status(200).json(trends);
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bar } from 'react-chartjs-2';

function App() {
  const [twitterData, setTwitterData] = useState([]);
  const [instagramData, setInstagramData] = useState([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('twitterData', (data) => {
      setTwitterData(data);
    });

    newSocket.on('instagramData', (data) => {
      setInstagramData(data);
    });

    newSocket.on('sentimentAnalysis', (analysis) => {
      setSentimentAnalysis(analysis);
    });

    newSocket.on('trendAnalysis', (trends) => {
      setTrendAnalysis(trends);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleFetchTwitterData = (username) => {
    socket.emit('fetchTwitterData', username);
  };

  const handleFetchInstagramData = (username) => {
    socket.emit('fetchInstagramData', username);
  };

  const handleAnalyzeSentiment = (text) => {
    socket.emit('analyzeSentiment', text);
  };

  const handleAnalyzeTrends = (data) => {
    socket.emit('analyzeTrends', data);
  };

  const chartData = {
    labels: trendAnalysis ? Object.keys(trendAnalysis) : [],
    datasets: [
      {
        label: 'Trend Analysis',
        data: trendAnalysis ? Object.values(trendAnalysis) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <h1>Social Media Feed Analyzer</h1>
      <div>
        <input
          type="text"
          placeholder="Twitter Username"
          onChange={(e) => handleFetchTwitterData(e.target.value)}
        />
        <button onClick={() => handleFetchTwitterData(prompt('Twitter Username'))}>Fetch Twitter Data</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Instagram Username"
          onChange={(e) => handleFetchInstagramData(e.target.value)}
        />
        <button onClick={() => handleFetchInstagramData(prompt('Instagram Username'))}>Fetch Instagram Data</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Enter text for sentiment analysis"
          onChange={(e) => handleAnalyzeSentiment(e.target.value)}
        />
        <button onClick={() => handleAnalyzeSentiment(prompt('Enter text for sentiment analysis'))}>Analyze Sentiment</button>
      </div>
      <div>
        <button onClick={() => handleAnalyzeTrends(twitterData.concat(instagramData))}>Analyze Trends</button>
      </div>
      <div>
        <h2>Twitter Data</h2>
        <ul>
          {twitterData.map((tweet) => (
            <li key={tweet.id}>{tweet.text}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Instagram Data</h2>
        <ul>
          {instagramData.map((post) => (
            <li key={post.id}>{post.caption}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Sentiment Analysis</h2>
        {sentimentAnalysis && (
          <div>
            <p>Score: {sentimentAnalysis.score}</p>
            <p>Comparison: {sentimentAnalysis.comparative}</p>
          </div>
        )}
      </div>
      <div>
        <h2>Trend Analysis</h2>
        {trendAnalysis && (
          <div>
            <Bar data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;