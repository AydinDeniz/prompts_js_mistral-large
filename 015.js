const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/video_upload', { useNewUrlParser: true, useUnifiedTopology: true });

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  filePath: String,
  uploadDate: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('video'), async (req, res) => {
  const { title, description, category } = req.body;
  const filePath = req.file.path;

  if (!title || !description || !category) {
    fs.unlinkSync(filePath); // Delete the file if validation fails
    return res.status(400).send('Title, description, and category are required');
  }

  const newVideo = new Video({ title, description, category, filePath });
  await newVideo.save();

  res.status(201).send('Video uploaded successfully');
});

app.get('/videos', async (req, res) => {
  const videos = await Video.find();
  res.json(videos);
});

app.get('/videos/:id', async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (video) {
    res.json(video);
  } else {
    res.status(404).send('Video not found');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});