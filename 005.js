const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
app.use(express.json());

const users = [];

function createToken(user) {
  return jwt.sign(user, 'secret_key', { expiresIn: '1h' });
}

function verifyToken(token) {
  return jwt.verify(token, 'secret_key');
}

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    const token = createToken({ username: user.username });
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).send('Invalid token');
    }
  } else {
    res.status(401).send('No token provided');
  }
}

app.get('/protected', authMiddleware, (req, res) => {
  res.send('This is a protected route');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});