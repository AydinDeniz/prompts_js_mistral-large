// Personalized News Aggregator with AI

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { Server } from 'socket.io';
import http from 'http';
import { SentimentAnalyzer, PorterStemmer, AFINN } from 'natural';
import { tf } from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize SentimentAnalyzer
const analyzer = new SentimentAnalyzer('English', PorterStemmer, AFINN);

// In-memory data store for user preferences and news articles
const userPreferences = {};
const newsArticles = {};

// Function to fetch news articles from an API
async function fetchNewsArticles(apiUrl) {
  const response = await axios.get(apiUrl);
  return response.data;
}

// Function to analyze sentiment of text
function analyzeSentiment(text) {
  const analysis = analyzer.getSentiment(text);
  return analysis;
}

// Function to categorize articles using NLP
function categorizeArticle(article) {
  const { title, content } = article;
  const keywords = title.split(' ').concat(content.split(' '));
  const categories = {};
  keywords.forEach((keyword) => {
    if (categories[keyword]) {
      categories[keyword]++;
    } else {
      categories[keyword] = 1;
    }
  });
  return categories;
}

// Function to summarize articles using NLP
function summarizeArticle(article) {
  const { content } = article;
  const sentences = content.split('.');
  const summary = sentences.slice(0, 3).join('.');
  return summary;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('setPreferences', ({ userId, preferences }) => {
    userPreferences[userId] = preferences;
    socket.emit('preferencesSet', { userId, preferences });
  });

  socket.on('fetchNews', async (apiUrl) => {
    const articles = await fetchNewsArticles(apiUrl);
    socket.emit('newsFetched', articles);
  });

  socket.on('analyzeArticle', (article) => {
    const sentiment = analyzeSentiment(article.content);
    const categories = categorizeArticle(article);
    const summary = summarizeArticle(article);
    socket.emit('articleAnalyzed', { article, sentiment, categories, summary });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/setPreferences', (req, res) => {
  const { userId, preferences } = req.body;
  userPreferences[userId] = preferences;
  res.status(200).json({ message: 'Preferences set successfully' });
});

app.get('/api/fetchNews', async (req, res) => {
  const { apiUrl } = req.query;
  const articles = await fetchNewsArticles(apiUrl);
  res.status(200).json(articles);
});

app.post('/api/analyzeArticle', (req, res) => {
  const { article } = req.body;
  const sentiment = analyzeSentiment(article.content);
  const categories = categorizeArticle(article);
  const summary = summarizeArticle(article);
  res.status(200).json({ sentiment, categories, summary });
});

app.get('/api/userPreferences/:userId', (req, res) => {
  const { userId } = req.params;
  if (userPreferences[userId]) {
    res.status(200).json(userPreferences[userId]);
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
  const [preferences, setPreferences] = useState({});
  const [articles, setArticles] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('preferencesSet', ({ userId, preferences }) => {
      if (userId === userId) {
        setPreferences(preferences);
      }
    });

    newSocket.on('newsFetched', (articles) => {
      setArticles(articles);
    });

    newSocket.on('articleAnalyzed', ({ article, sentiment, categories, summary }) => {
      setArticles((prevArticles) =>
        prevArticles.map((a) => (a.id === article.id ? { ...a, sentiment, categories, summary } : a))
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const handleSetPreferences = (preferences) => {
    socket.emit('setPreferences', { userId, preferences });
  };

  const handleFetchNews = (apiUrl) => {
    socket.emit('fetchNews', apiUrl);
  };

  const handleAnalyzeArticle = (article) => {
    socket.emit('analyzeArticle', article);
  };

  return (
    <div>
      <h1>Personalized News Aggregator with AI</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <h2>Set Preferences</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const preferences = {
              categories: e.target.categories.value.split(','),
              sentiment: e.target.sentiment.value,
            };
            handleSetPreferences(preferences);
            e.target.reset();
          }}
        >
          <input type="text" name="categories" placeholder="Categories (comma-separated)" required />
          <input type="text" name="sentiment" placeholder="Sentiment" required />
          <button type="submit">Set Preferences</button>
        </form>
      </div>
      <div>
        <h2>Fetch News</h2>
        <input
          type="text"
          placeholder="API URL"
          onChange={(e) => handleFetchNews(e.target.value)}
        />
      </div>
      <div>
        <h2>Articles</h2>
        <ul>
          {articles.map((article) => (
            <li key={article.id}>
              <h3>{article.title}</h3>
              <p>{article.content}</p>
              <button onClick={() => handleAnalyzeArticle(article)}>Analyze Article</button>
              {article.sentiment && (
                <div>
                  <p>Sentiment: {article.sentiment.score}</p>
                  <p>Categories: {JSON.stringify(article.categories)}</p>
                  <p>Summary: {article.summary}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;