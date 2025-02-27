// Language Learning Platform

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

// In-memory data store for flashcards and quiz data
const flashcards = {};
const quizzes = {};

// Function to fetch pronunciation data from an API
async function fetchPronunciation(word) {
  const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
  return response.data[0].phonetics[0].audio;
}

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createFlashcard', (flashcard) => {
    const flashcardId = uuidv4();
    flashcards[flashcardId] = { ...flashcard, id: flashcardId };
    io.emit('flashcardCreated', flashcards[flashcardId]);
  });

  socket.on('createQuiz', (quiz) => {
    const quizId = uuidv4();
    quizzes[quizId] = { ...quiz, id: quizId };
    io.emit('quizCreated', quizzes[quizId]);
  });

  socket.on('fetchPronunciation', async (word) => {
    const pronunciation = await fetchPronunciation(word);
    socket.emit('pronunciationFetched', pronunciation);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createFlashcard', (req, res) => {
  const flashcard = req.body;
  const flashcardId = uuidv4();
  flashcards[flashcardId] = { ...flashcard, id: flashcardId };
  res.status(200).json(flashcards[flashcardId]);
});

app.post('/api/createQuiz', (req, res) => {
  const quiz = req.body;
  const quizId = uuidv4();
  quizzes[quizId] = { ...quiz, id: quizId };
  res.status(200).json(quizzes[quizId]);
});

app.get('/api/flashcards', (req, res) => {
  res.status(200).json(flashcards);
});

app.get('/api/quizzes', (req, res) => {
  res.status(200).json(quizzes);
});

app.post('/api/fetchPronunciation', async (req, res) => {
  const { word } = req.body;
  const pronunciation = await fetchPronunciation(word);
  res.status(200).json({ pronunciation });
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
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [pronunciation, setPronunciation] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('flashcardCreated', (flashcard) => {
      setFlashcards((prevFlashcards) => [...prevFlashcards, flashcard]);
    });

    newSocket.on('quizCreated', (quiz) => {
      setQuizzes((prevQuizzes) => [...prevQuizzes, quiz]);
    });

    newSocket.on('pronunciationFetched', (pronunciation) => {
      setPronunciation(pronunciation);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchFlashcards();
    fetchQuizzes();
  }, []);

  const fetchFlashcards = async () => {
    const response = await axios.get('/api/flashcards');
    setFlashcards(response.data);
  };

  const fetchQuizzes = async () => {
    const response = await axios.get('/api/quizzes');
    setQuizzes(response.data);
  };

  const handleCreateFlashcard = async (flashcard) => {
    await axios.post('/api/createFlashcard', flashcard);
  };

  const handleCreateQuiz = async (quiz) => {
    await axios.post('/api/createQuiz', quiz);
  };

  const handleFetchPronunciation = async (word) => {
    await axios.post('/api/fetchPronunciation', { word });
  };

  return (
    <div>
      <h1>Language Learning Platform</h1>
      <div>
        <h2>Create Flashcard</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const flashcard = {
              word: e.target.word.value,
              translation: e.target.translation.value,
            };
            handleCreateFlashcard(flashcard);
            e.target.reset();
          }}
        >
          <input type="text" name="word" placeholder="Word" required />
          <input type="text" name="translation" placeholder="Translation" required />
          <button type="submit">Create Flashcard</button>
        </form>
      </div>
      <div>
        <h2>Create Quiz</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const quiz = {
              question: e.target.question.value,
              options: [
                e.target.option1.value,
                e.target.option2.value,
                e.target.option3.value,
                e.target.option4.value,
              ],
              answer: e.target.answer.value,
            };
            handleCreateQuiz(quiz);
            e.target.reset();
          }}
        >
          <input type="text" name="question" placeholder="Question" required />
          <input type="text" name="option1" placeholder="Option 1" required />
          <input type="text" name="option2" placeholder="Option 2" required />
          <input type="text" name="option3" placeholder="Option 3" required />
          <input type="text" name="option4" placeholder="Option 4" required />
          <input type="text" name="answer" placeholder="Answer" required />
          <button type="submit">Create Quiz</button>
        </form>
      </div>
      <div>
        <h2>Flashcards</h2>
        <ul>
          {flashcards.map((flashcard) => (
            <li key={flashcard.id}>
              {flashcard.word} - {flashcard.translation}
              <button onClick={() => handleFetchPronunciation(flashcard.word)}>Pronunciation</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Quizzes</h2>
        <ul>
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <p>{quiz.question}</p>
              <ul>
                {quiz.options.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
              <p>Answer: {quiz.answer}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Pronunciation</h2>
        {pronunciation && (
          <audio controls>
            <source src={pronunciation} type="audio/mpeg" />
          </audio>
        )}
      </div>
    </div>
  );
}

export default App;