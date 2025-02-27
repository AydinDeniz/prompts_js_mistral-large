// Interactive Stock Trading Simulator

// Import necessary libraries
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Mock stock market API endpoint (replace with actual API endpoint)
const STOCK_API_URL = 'https://api.mockstockmarket.com/data';

// In-memory data store for user portfolios
const portfolios = {};

// Function to fetch real-time stock market data
async function fetchStockData() {
  try {
    const response = await axios.get(STOCK_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

// Function to update portfolio performance
function updatePortfolioPerformance(userId, stockData) {
  const portfolio = portfolios[userId];
  if (portfolio) {
    portfolio.stocks.forEach((stock) => {
      const marketData = stockData.find((data) => data.symbol === stock.symbol);
      if (marketData) {
        stock.currentPrice = marketData.price;
        stock.performance = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100;
      }
    });
  }
}

// WebSocket server setup for real-time data streaming
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ userId }) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createPortfolio', (req, res) => {
  const { userId, initialFunds } = req.body;
  const portfolio = {
    userId,
    funds: initialFunds,
    stocks: [],
  };
  portfolios[userId] = portfolio;
  res.status(200).json(portfolio);
});

app.post('/api/buyStock', (req, res) => {
  const { userId, symbol, quantity, purchasePrice } = req.body;
  const portfolio = portfolios[userId];
  if (portfolio) {
    const totalCost = quantity * purchasePrice;
    if (portfolio.funds >= totalCost) {
      portfolio.funds -= totalCost;
      portfolio.stocks.push({
        symbol,
        quantity,
        purchasePrice,
        currentPrice: purchasePrice,
        performance: 0,
      });
      res.status(200).json(portfolio);
    } else {
      res.status(400).json({ error: 'Insufficient funds' });
    }
  } else {
    res.status(404).json({ error: 'Portfolio not found' });
  }
});

app.post('/api/sellStock', (req, res) => {
  const { userId, symbol, quantity } = req.body;
  const portfolio = portfolios[userId];
  if (portfolio) {
    const stock = portfolio.stocks.find((stock) => stock.symbol === symbol);
    if (stock && stock.quantity >= quantity) {
      stock.quantity -= quantity;
      portfolio.funds += quantity * stock.currentPrice;
      if (stock.quantity === 0) {
        portfolio.stocks = portfolio.stocks.filter((s) => s.symbol !== symbol);
      }
      res.status(200).json(portfolio);
    } else {
      res.status(400).json({ error: 'Insufficient stock quantity' });
    }
  } else {
    res.status(404).json({ error: 'Portfolio not found' });
  }
});

app.get('/api/portfolio/:userId', (req, res) => {
  const { userId } = req.params;
  const portfolio = portfolios[userId];
  if (portfolio) {
    res.status(200).json(portfolio);
  } else {
    res.status(404).json({ error: 'Portfolio not found' });
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);

  // Fetch and stream real-time stock data
  setInterval(async () => {
    const stockData = await fetchStockData();
    if (stockData) {
      Object.keys(portfolios).forEach((userId) => {
        updatePortfolioPerformance(userId, stockData);
        io.to(userId).emit('portfolioUpdate', portfolios[userId]);
      });
    }
  }, 5000); // Update every 5 seconds
});

// Example frontend code using React and D3.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import * as d3 from 'd3';

function App() {
  const [userId, setUserId] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('portfolioUpdate', (updatedPortfolio) => {
      setPortfolio(updatedPortfolio);
      updateChart(updatedPortfolio.stocks);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (userId) {
      socket.emit('join', { userId });
      fetchPortfolio(userId);
    }
  }, [userId, socket]);

  const fetchPortfolio = async (userId) => {
    const response = await axios.get(`/api/portfolio/${userId}`);
    setPortfolio(response.data);
    updateChart(response.data.stocks);
  };

  const handleCreatePortfolio = async () => {
    const response = await axios.post('/api/createPortfolio', { userId, initialFunds: 10000 });
    setPortfolio(response.data);
  };

  const handleBuyStock = async () => {
    const response = await axios.post('/api/buyStock', { userId, symbol: 'AAPL', quantity: 10, purchasePrice: 150 });
    setPortfolio(response.data);
  };

  const handleSellStock = async () => {
    const response = await axios.post('/api/sellStock', { userId, symbol: 'AAPL', quantity: 5 });
    setPortfolio(response.data);
  };

  const updateChart = (stocks) => {
    const data = stocks.map((stock) => ({
      symbol: stock.symbol,
      performance: stock.performance,
    }));

    const svg = d3.select('svg');
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.symbol))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.performance)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xAxis = (g) =>
      g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0));

    const yAxis = (g) =>
      g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call((g) => g.select('.domain').remove());

    svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.symbol))
      .attr('y', (d) => y(d.performance))
      .attr('width', x.bandwidth())
      .attr('height', (d) => y(0) - y(d.performance))
      .attr('fill', 'steelblue');

    svg.append('g').call(xAxis);

    svg.append('g').call(yAxis);
  };

  return (
    <div>
      <h1>Interactive Stock Trading Simulator</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={handleCreatePortfolio}>Create Portfolio</button>
        <button onClick={handleBuyStock}>Buy Stock</button>
        <button onClick={handleSellStock}>Sell Stock</button>
      </div>
      <div>
        <h2>Portfolio</h2>
        {portfolio && (
          <div>
            <p>Funds: ${portfolio.funds}</p>
            <ul>
              {portfolio.stocks.map((stock) => (
                <li key={stock.symbol}>
                  {stock.symbol} - Quantity: {stock.quantity} - Performance: {stock.performance.toFixed(2)}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <h2>Portfolio Performance</h2>
        <svg width="800" height="400"></svg>
      </div>
    </div>
  );
}

export default App;