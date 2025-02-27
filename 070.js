// Grocery List Optimizer with Route Planning

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

// In-memory data store for grocery lists and store layouts
const groceryLists = {};
const storeLayouts = {};

// Function to optimize grocery list based on store layout
function optimizeGroceryList(groceryList, storeLayout) {
  const optimizedList = groceryList.sort((a, b) => {
    const aisleA = storeLayout[a.item];
    const aisleB = storeLayout[b.item];
    return aisleA - aisleB;
  });
  return optimizedList;
}

// Function to plan the most efficient route through the store
function planRoute(groceryList, storeLayout) {
  const route = [];
  groceryList.forEach((item) => {
    const aisle = storeLayout[item.item];
    route.push({ item: item.item, aisle });
  });
  return route;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createGroceryList', ({ userId, items }) => {
    const listId = uuidv4();
    groceryLists[listId] = { userId, items };
    socket.emit('groceryListCreated', { listId });
  });

  socket.on('optimizeGroceryList', ({ listId, storeId }) => {
    const groceryList = groceryLists[listId];
    const storeLayout = storeLayouts[storeId];
    const optimizedList = optimizeGroceryList(groceryList.items, storeLayout);
    groceryLists[listId].items = optimizedList;
    const route = planRoute(optimizedList, storeLayout);
    socket.emit('groceryListOptimized', { listId, optimizedList, route });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createGroceryList', (req, res) => {
  const { userId, items } = req.body;
  const listId = uuidv4();
  groceryLists[listId] = { userId, items };
  res.status(200).json({ listId });
});

app.post('/api/optimizeGroceryList', (req, res) => {
  const { listId, storeId } = req.body;
  const groceryList = groceryLists[listId];
  const storeLayout = storeLayouts[storeId];
  const optimizedList = optimizeGroceryList(groceryList.items, storeLayout);
  groceryLists[listId].items = optimizedList;
  const route = planRoute(optimizedList, storeLayout);
  res.status(200).json({ optimizedList, route });
});

app.get('/api/groceryLists/:userId', (req, res) => {
  const { userId } = req.params;
  const userLists = Object.values(groceryLists).filter((list) => list.userId === userId);
  res.status(200).json(userLists);
});

app.get('/api/storeLayouts', (req, res) => {
  res.status(200).json(storeLayouts);
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
  const [groceryLists, setGroceryLists] = useState([]);
  const [storeLayouts, setStoreLayouts] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('groceryListCreated', ({ listId }) => {
      fetchGroceryLists();
    });

    newSocket.on('groceryListOptimized', ({ listId, optimizedList, route }) => {
      setGroceryLists((prevLists) =>
        prevLists.map((list) => (list.listId === listId ? { ...list, items: optimizedList, route } : list))
      );
    });

    fetchStoreLayouts();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchGroceryLists();
  }, [userId]);

  const fetchGroceryLists = async () => {
    const response = await axios.get(`/api/groceryLists/${userId}`);
    setGroceryLists(response.data);
  };

  const fetchStoreLayouts = async () => {
    const response = await axios.get('/api/storeLayouts');
    setStoreLayouts(response.data);
  };

  const handleCreateGroceryList = async (items) => {
    await axios.post('/api/createGroceryList', { userId, items });
  };

  const handleOptimizeGroceryList = async (listId, storeId) => {
    await axios.post('/api/optimizeGroceryList', { listId, storeId });
  };

  return (
    <div>
      <h1>Grocery List Optimizer with Route Planning</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <h2>Create Grocery List</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const items = e.target.items.value.split(',').map((item) => ({ item: item.trim() }));
            handleCreateGroceryList(items);
            e.target.reset();
          }}
        >
          <input type="text" name="items" placeholder="Items (comma-separated)" required />
          <button type="submit">Create List</button>
        </form>
      </div>
      <div>
        <h2>Grocery Lists</h2>
        <ul>
          {groceryLists.map((list) => (
            <li key={list.listId}>
              <h3>List ID: {list.listId}</h3>
              <ul>
                {list.items.map((item, index) => (
                  <li key={index}>{item.item}</li>
                ))}
              </ul>
              <select
                onChange={(e) => handleOptimizeGroceryList(list.listId, e.target.value)}
              >
                <option value="">Select Store</option>
                {Object.keys(storeLayouts).map((storeId) => (
                  <option key={storeId} value={storeId}>
                    Store {storeId}
                  </option>
                ))}
              </select>
              {list.route && (
                <div>
                  <h4>Optimized Route</h4>
                  <ul>
                    {list.route.map((step, index) => (
                      <li key={index}>
                        {step.item} - Aisle {step.aisle}
                      </li>
                    ))}
                  </ul>
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