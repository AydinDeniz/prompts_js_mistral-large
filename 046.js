// Automated Legal Document Analysis Tool

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { NLP } from 'compromise';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Function to extract key terms from legal documents
function extractKeyTerms(text) {
  const doc = NLP(text);
  const terms = doc.nouns().out('array');
  return terms;
}

// Function to extract clauses from legal documents
function extractClauses(text) {
  const clauses = text.split(/(?=\n\n|\n\r\n)/).filter(Boolean);
  return clauses;
}

// Function to generate summaries of legal documents
function generateSummary(text) {
  const doc = NLP(text);
  const sentences = doc.sentences().out('array');
  const summary = sentences.slice(0, 5).join(' '); // Simple summary by taking the first 5 sentences
  return summary;
}

// API routes
app.post('/api/analyzeDocument', (req, res) => {
  const { text } = req.body;
  const keyTerms = extractKeyTerms(text);
  const clauses = extractClauses(text);
  const summary = generateSummary(text);
  res.status(200).json({ keyTerms, clauses, summary });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [documentText, setDocumentText] = useState('');
  const [keyTerms, setKeyTerms] = useState([]);
  const [clauses, setClauses] = useState([]);
  const [summary, setSummary] = useState('');

  const handleAnalyzeDocument = async () => {
    const response = await axios.post('/api/analyzeDocument', { text: documentText });
    setKeyTerms(response.data.keyTerms);
    setClauses(response.data.clauses);
    setSummary(response.data.summary);
  };

  return (
    <div>
      <h1>Automated Legal Document Analysis Tool</h1>
      <textarea
        value={documentText}
        onChange={(e) => setDocumentText(e.target.value)}
        placeholder="Enter legal document text here..."
        rows="20"
        cols="80"
      />
      <button onClick={handleAnalyzeDocument}>Analyze Document</button>
      <div>
        <h2>Key Terms</h2>
        <ul>
          {keyTerms.map((term, index) => (
            <li key={index}>{term}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Clauses</h2>
        <ol>
          {clauses.map((clause, index) => (
            <li key={index}>{clause}</li>
          ))}
        </ol>
      </div>
      <div>
        <h2>Summary</h2>
        <p>{summary}</p>
      </div>
    </div>
  );
}

export default App;