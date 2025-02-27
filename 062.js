// Cryptocurrency Trading Bot

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
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

// In-memory data store for user strategies and transactions
const userStrategies = {};
const transactions = {};

// Function to fetch real-time cryptocurrency data from an API
async function fetchCryptoData(apiUrl) {
  const response = await axios.get(apiUrl);
  return response.data;
}

// Function to process trading strategies
function processStrategy(strategy, data) {
  // Example strategy: Buy if price is below a certain threshold
  if (strategy.action === 'buy' && data.price < strategy.threshold) {
    return { action: 'buy', amount: strategy.amount };
  }
  // Example strategy: Sell if price is above a certain threshold
  if (strategy.action === 'sell' && data.price > strategy.threshold) {
    return { action: 'sell', amount: strategy.amount };
  }
  return null;
}

// Function to log transactions
function logTransaction(userId, transaction) {
  if (!transactions[userId]) {
    transactions[userId] = [];
  }
  transactions[userId].push(transaction);
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('setStrategy', ({ userId, strategy }) => {
    userStrategies[userId] = strategy;
    socket.emit('strategySet', { userId, strategy });
  });

  socket.on('fetchData', async (apiUrl) => {
    const data = await fetchCryptoData(apiUrl);
    socket.emit('dataFetched', data);
  });

  socket.on('processStrategy', async ({ userId, apiUrl }) => {
    const data = await fetchCryptoData(apiUrl);
    const strategy = userStrategies[userId];
    const transaction = processStrategy(strategy, data);
    if (transaction) {
      logTransaction(userId, transaction);
      socket.emit('transactionLogged', { userId, transaction });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/setStrategy', (req, res) => {
  const { userId, strategy } = req.body;
  userStrategies[userId] = strategy;
  res.status(200).json({ message: 'Strategy set successfully' });
});

app.get('/api/fetchData', async (req, res) => {
  const { apiUrl } = req.query;
  const data = await fetchCryptoData(apiUrl);
  res.status(200).json(data);
});

app.post('/api/processStrategy', async (req, res) => {
  const { userId, apiUrl } = req.body;
  const data = await fetchCryptoData(apiUrl);
  const strategy = userStrategies[userId];
  const transaction = processStrategy(strategy, data);
  if (transaction) {
    logTransaction(userId, transaction);
    res.status(200).json({ transaction });
  } else {
    res.status(200).json({ message: 'No transaction needed' });
  }
});

app.get('/api/transactions/:userId', (req, res) => {
  const { userId } = req.params;
  if (transactions[userId]) {
    res.status(200).json(transactions[userId]);
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
  const [strategy, setStrategy] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('strategySet', ({ userId, strategy }) => {
      if (userId === userId) {
        setStrategy(strategy);
      }
    });

    newSocket.on('dataFetched', (data) => {
      console.log('Data fetched:', data);
    });

    newSocket.on('transactionLogged', ({ userId, transaction }) => {
      if (userId === userId) {
        setTransactions((prevTransactions) => [...prevTransactions, transaction]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const handleSetStrategy = (strategy) => {
    socket.emit('setStrategy', { userId, strategy });
  };

  const handleFetchData = (apiUrl) => {
    socket.emit('fetchData', apiUrl);
  };

  const handleProcessStrategy = (apiUrl) => {
    socket.emit('processStrategy', { userId, apiUrl });
  };

  return (
    <div>
      <h1>Cryptocurrency Trading Bot</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <h2>Set Strategy</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const strategy = {
              action: e.target.action.value,
              threshold: parseFloat(e.target.threshold.value),
              amount: parseFloat(e.target.amount.value),
            };
            handleSetStrategy(strategy);
            e.target.reset();
          }}
        >
          <select name="action" required>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <input type="number" name="threshold" placeholder="Threshold" required />
          <input type="number" name="amount" placeholder="Amount" required />
          <button type="submit">Set Strategy</button>
        </form>
      </div>
      <div>
        <h2>Fetch Data</h2>
        <input
          type="text"
          placeholder="API URL"
          onChange={(e) => handleFetchData(e.target.value)}
        />
      </div>
      <div>
        <h2>Process Strategy</h2>
        <input
          type="text"
          placeholder="API URL"
          onChange={(e) => handleProcessStrategy(e.target.value)}
        />
      </div>
      <div>
        <h2>Transactions</h2>
        <ul>
          {transactions.map((transaction, index) => (
            <li key={index}>
              {transaction.action}: {transaction.amount}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;