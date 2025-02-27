// E-commerce Product Recommendation System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
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

// Mock data for products and user interactions
const products = [
  { id: 1, name: 'Product 1', category: 'Electronics', price: 100 },
  { id: 2, name: 'Product 2', category: 'Clothing', price: 50 },
  { id: 3, name: 'Product 3', category: 'Electronics', price: 200 },
  { id: 4, name: 'Product 4', category: 'Clothing', price: 75 },
  // Add more products as needed
];

const userInteractions = {};

// Function to generate product recommendations using collaborative filtering
function generateRecommendations(userId) {
  const interactions = userInteractions[userId] || [];
  const categoryPreferences = interactions.reduce((acc, interaction) => {
    if (acc[interaction.category]) {
      acc[interaction.category] += interaction.rating;
    } else {
      acc[interaction.category] = interaction.rating;
    }
    return acc;
  }, {});

  const recommendedProducts = products.filter((product) => {
    return categoryPreferences[product.category] > 0;
  });

  return recommendedProducts;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('recordInteraction', ({ userId, productId, rating }) => {
    if (!userInteractions[userId]) {
      userInteractions[userId] = [];
    }
    const product = products.find((p) => p.id === productId);
    if (product) {
      userInteractions[userId].push({ productId, category: product.category, rating });
      const recommendations = generateRecommendations(userId);
      socket.emit('recommendations', recommendations);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.get('/api/products', (req, res) => {
  res.status(200).json(products);
});

app.post('/api/recordInteraction', (req, res) => {
  const { userId, productId, rating } = req.body;
  if (!userInteractions[userId]) {
    userInteractions[userId] = [];
  }
  const product = products.find((p) => p.id === productId);
  if (product) {
    userInteractions[userId].push({ productId, category: product.category, rating });
    const recommendations = generateRecommendations(userId);
    res.status(200).json(recommendations);
  } else {
    res.status(404).json({ error: 'Product not found' });
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
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('recommendations', (recommendations) => {
      setRecommendations(recommendations);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await axios.get('/api/products');
    setProducts(response.data);
  };

  const handleRecordInteraction = async (productId, rating) => {
    await axios.post('/api/recordInteraction', { userId, productId, rating });
    socket.emit('recordInteraction', { userId, productId, rating });
  };

  return (
    <div>
      <h1>E-commerce Product Recommendation System</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <h2>Products</h2>
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              {product.name} - ${product.price}
              <button onClick={() => handleRecordInteraction(product.id, 5)}>Like</button>
              <button onClick={() => handleRecordInteraction(product.id, 1)}>Dislike</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Recommendations</h2>
        <ul>
          {recommendations.map((product) => (
            <li key={product.id}>
              {product.name} - ${product.price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;