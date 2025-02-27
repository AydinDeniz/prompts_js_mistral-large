// Recipe Finder with Meal Planning

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

// Function to fetch recipes from a public API
async function fetchRecipes(ingredients) {
  const apiKey = 'your_api_key'; // Replace with your actual API key
  const response = await axios.get(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients.join(',')}&apiKey=${apiKey}`);
  return response.data;
}

// Function to get recipe details
async function getRecipeDetails(id) {
  const apiKey = 'your_api_key'; // Replace with your actual API key
  const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`);
  return response.data;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('fetchRecipes', async (ingredients) => {
    const recipes = await fetchRecipes(ingredients);
    socket.emit('recipesData', recipes);
  });

  socket.on('getRecipeDetails', async (id) => {
    const details = await getRecipeDetails(id);
    socket.emit('recipeDetails', details);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/fetchRecipes', async (req, res) => {
  const { ingredients } = req.body;
  const recipes = await fetchRecipes(ingredients);
  res.status(200).json(recipes);
});

app.post('/api/getRecipeDetails', async (req, res) => {
  const { id } = req.body;
  const details = await getRecipeDetails(id);
  res.status(200).json(details);
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
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('recipesData', (data) => {
      setRecipes(data);
    });

    newSocket.on('recipeDetails', (details) => {
      setRecipeDetails(details);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleFetchRecipes = () => {
    const ingredientList = ingredients.split(',').map((ingredient) => ingredient.trim());
    socket.emit('fetchRecipes', ingredientList);
  };

  const handleGetRecipeDetails = (id) => {
    socket.emit('getRecipeDetails', id);
  };

  return (
    <div>
      <h1>Recipe Finder with Meal Planning</h1>
      <div>
        <input
          type="text"
          placeholder="Enter ingredients separated by commas"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
        <button onClick={handleFetchRecipes}>Find Recipes</button>
      </div>
      <div>
        <h2>Recipes</h2>
        <ul>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              {recipe.title} - <button onClick={() => handleGetRecipeDetails(recipe.id)}>Details</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Recipe Details</h2>
        {recipeDetails && (
          <div>
            <h3>{recipeDetails.title}</h3>
            <p>Summary: {recipeDetails.summary}</p>
            <p>Instructions: {recipeDetails.instructions}</p>
            <p>Nutrition: {recipeDetails.nutrition.nutrients.map((nutrient) => (
              <span key={nutrient.name}>{nutrient.name}: {nutrient.amount} {nutrient.unit} </span>
            ))}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;