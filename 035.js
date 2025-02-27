// Self-Learning Chatbot

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Nano } from 'nano';
import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';
import natural from 'natural';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize CouchDB connection
const nano = Nano('http://localhost:5984');
const db = nano.db.use('chatbot');

// Load TensorFlow.js model
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/model.json');
  return model;
}

// NLP setup
const classifier = new natural.BayesClassifier();

// Function to train the NLP model
function trainNLPModel(text, label) {
  classifier.addDocument(text, label);
  classifier.train();
}

// Function to classify text using the NLP model
function classifyText(text) {
  return classifier.classify(text);
}

// Function to generate a response based on user input
async function generateResponse(userInput) {
  const model = await loadModel();
  const input = tf.tensor([userInput]);
  const prediction = model.predict(input);
  const responseData = prediction.dataSync();

  // Example logic to map predictions to responses
  const response = responseData[0] > 0.5 ? 'Positive response' : 'Negative response';

  return response;
}

// API routes
app.post('/api/train', (req, res) => {
  const { text, label } = req.body;
  trainNLPModel(text, label);
  res.status(200).json({ message: 'Model trained successfully' });
});

app.post('/api/chat', async (req, res) => {
  const { userId, message } = req.body;
  const response = await generateResponse(message);

  // Save conversation data to CouchDB
  const conversation = {
    _id: uuidv4(),
    userId,
    message,
    response,
    timestamp: new Date().toISOString(),
  };
  await db.insert(conversation);

  res.status(200).json({ response });
});

app.get('/api/conversations/:userId', async (req, res) => {
  const { userId } = req.params;
  const conversations = await db.find({
    selector: { userId },
    sort: [{ timestamp: 'asc' }],
  });
  res.status(200).json(conversations.docs);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, [userId]);

  const fetchConversations = async () => {
    const response = await axios.get(`/api/conversations/${userId}`);
    setConversations(response.data);
  };

  const handleSendMessage = async () => {
    const response = await axios.post('/api/chat', { userId, message });
    setResponse(response.data.response);
    fetchConversations();
  };

  const handleTrainModel = async () => {
    const text = 'sample text';
    const label = 'sample label';
    await axios.post('/api/train', { text, label });
    alert('Model trained successfully');
  };

  return (
    <div>
      <h1>Self-Learning Chatbot</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send Message</button>
        <button onClick={handleTrainModel}>Train Model</button>
      </div>
      <div>
        <h2>Response</h2>
        <p>{response}</p>
      </div>
      <div>
        <h2>Conversations</h2>
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation._id}>
              <strong>User:</strong> {conversation.message}
              <br />
              <strong>Bot:</strong> {conversation.response}
              <br />
              <strong>Timestamp:</strong> {conversation.timestamp}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;