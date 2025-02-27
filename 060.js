// Collaborative Document Editing

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
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

// In-memory data store for documents
const documents = {};

// WebSocket server setup for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinDocument', ({ documentId, userId }) => {
    socket.join(documentId);
    console.log(`User ${userId} joined document ${documentId}`);
  });

  socket.on('editDocument', ({ documentId, content, userId }) => {
    if (!documents[documentId]) {
      documents[documentId] = { content: '', history: [] };
    }
    documents[documentId].content = content;
    documents[documentId].history.push({ userId, content });
    io.to(documentId).emit('documentUpdated', { content, userId });
  });

  socket.on('addComment', ({ documentId, comment, userId }) => {
    if (!documents[documentId]) {
      documents[documentId] = { content: '', history: [], comments: [] };
    }
    documents[documentId].comments.push({ userId, comment });
    io.to(documentId).emit('commentAdded', { comment, userId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes
app.post('/api/createDocument', (req, res) => {
  const { userId } = req.body;
  const documentId = uuidv4();
  documents[documentId] = { content: '', history: [], comments: [] };
  res.status(200).json({ documentId });
});

app.get('/api/documents', (req, res) => {
  res.status(200).json(documents);
});

app.get('/api/document/:documentId', (req, res) => {
  const { documentId } = req.params;
  if (documents[documentId]) {
    res.status(200).json(documents[documentId]);
  } else {
    res.status(404).json({ error: 'Document not found' });
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
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [content, setContent] = useState('');
  const [comments, setComments] = useState([]);
  const [userId, setUserId] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('documentUpdated', ({ content, userId }) => {
      setContent(content);
      setComments((prevComments) => [...prevComments, { userId, content }]);
    });

    newSocket.on('commentAdded', ({ comment, userId }) => {
      setComments((prevComments) => [...prevComments, { userId, comment }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const response = await axios.get('/api/documents');
    setDocuments(response.data);
  };

  const handleCreateDocument = async () => {
    const response = await axios.post('/api/createDocument', { userId });
    setCurrentDocument(response.data.documentId);
    socket.emit('joinDocument', { documentId: response.data.documentId, userId });
  };

  const handleEditDocument = (content) => {
    socket.emit('editDocument', { documentId: currentDocument, content, userId });
  };

  const handleAddComment = (comment) => {
    socket.emit('addComment', { documentId: currentDocument, comment, userId });
  };

  return (
    <div>
      <h1>Collaborative Document Editing</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={handleCreateDocument}>Create Document</button>
      </div>
      <div>
        <select onChange={(e) => setCurrentDocument(e.target.value)}>
          <option value="">Select a document</option>
          {Object.keys(documents).map((documentId) => (
            <option key={documentId} value={documentId}>
              Document {documentId}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h2>Document Content</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => handleEditDocument(content)}
        />
      </div>
      <div>
        <h2>Comments</h2>
        <ul>
          {comments.map((comment, index) => (
            <li key={index}>
              {comment.userId}: {comment.comment}
            </li>
          ))}
        </ul>
        <input
          type="text"
          placeholder="Add a comment"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddComment(e.target.value);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;