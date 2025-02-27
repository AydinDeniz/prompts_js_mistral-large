// Real-Time Language Translator with Speech Recognition

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Function to transcribe speech using Web Speech API
function transcribeSpeech(recognition, language) {
  recognition.lang = language;
  recognition.start();
}

// Function to translate text using an external translation service
async function translateText(text, targetLanguage) {
  const apiKey = 'your_translation_api_key'; // Replace with your actual API key
  const response = await axios.post('https://api.example.com/translate', {
    text,
    targetLanguage,
    apiKey,
  });
  return response.data.translatedText;
}

// Function to synthesize speech using Web Speech API
function synthesizeSpeech(text, language) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  window.speechSynthesis.speak(utterance);
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('startTranscription', ({ language }) => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      socket.emit('transcription', { transcript, language });
    };
    transcribeSpeech(recognition, language);
  });

  socket.on('translateText', async ({ text, targetLanguage }) => {
    const translatedText = await translateText(text, targetLanguage);
    socket.emit('translation', { translatedText, targetLanguage });
  });

  socket.on('synthesizeSpeech', ({ text, language }) => {
    synthesizeSpeech(text, language);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/translateText', async (req, res) => {
  const { text, targetLanguage } = req.body;
  const translatedText = await translateText(text, targetLanguage);
  res.status(200).json({ translatedText });
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
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [targetLanguage, setTargetLanguage] = useState('es-ES');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('transcription', ({ transcript, language }) => {
      setTranscript(transcript);
      setLanguage(language);
    });

    newSocket.on('translation', ({ translatedText, targetLanguage }) => {
      setTranslation(translatedText);
      setTargetLanguage(targetLanguage);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleStartTranscription = () => {
    socket.emit('startTranscription', { language });
  };

  const handleTranslateText = async () => {
    const response = await axios.post('/api/translateText', { text: transcript, targetLanguage });
    setTranslation(response.data.translatedText);
  };

  const handleSynthesizeSpeech = () => {
    socket.emit('synthesizeSpeech', { text: translation, language: targetLanguage });
  };

  return (
    <div>
      <h1>Real-Time Language Translator with Speech Recognition</h1>
      <div>
        <button onClick={handleStartTranscription}>Start Transcription</button>
      </div>
      <div>
        <h2>Transcript</h2>
        <p>{transcript}</p>
      </div>
      <div>
        <button onClick={handleTranslateText}>Translate Text</button>
      </div>
      <div>
        <h2>Translation</h2>
        <p>{translation}</p>
      </div>
      <div>
        <button onClick={handleSynthesizeSpeech}>Synthesize Speech</button>
      </div>
    </div>
  );
}

export default App;