const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
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

AWS.config.update({
  accessKeyId: 'your_access_key_id',
  secretAccessKey: 'your_secret_access_key',
  region: 'your_region'
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'your_bucket_name',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + path.extname(file.originalname));
    }
  })
});

app.post('/upload', upload.single('video'), async (req, res) => {
  const { title, description, category } = req.body;
  const filePath = req.file.location;

  if (!title || !description || !category) {
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

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Upload Platform</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    form {
      max-width: 600px;
      margin: auto;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
    }
    .form-group button {
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
    }
    .form-group button:hover {
      background-color: #45a049;
    }
    #videoPreview {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Upload a Video</h1>
  <form id="uploadForm" enctype="multipart/form-data">
    <div class="form-group">
      <label for="title">Title:</label>
      <input type="text" id="title" name="title" required>
    </div>
    <div class="form-group">
      <label for="description">Description:</label>
      <textarea id="description" name="description" required></textarea>
    </div>
    <div class="form-group">
      <label for="category">Category:</label>
      <select id="category" name="category" required>
        <option value="education">Education</option>
        <option value="entertainment">Entertainment</option>
        <option value="sports">Sports</option>
      </select>
    </div>
    <div class="form-group">
      <label for="video">Video:</label>
      <input type="file" id="video" name="video" accept="video/*" required>
    </div>
    <div class="form-group">
      <button type="submit">Upload Video</button>
    </div>
  </form>
  <div id="videoPreview"></div>
  <div id="feedback"></div>

  <script>
    document.getElementById('uploadForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const feedback = document.getElementById('feedback');

      feedback.innerHTML = 'Uploading...';

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.text();
      feedback.innerHTML = result;
    });

    document.getElementById('video').addEventListener('change', (event) => {
      const file = event.target.files[0];
      const videoPreview = document.getElementById('videoPreview');
      videoPreview.innerHTML = '';

      if (file) {
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(file);
        videoElement.controls = true;
        videoPreview.appendChild(videoElement);
      }
    });
  </script>
</body>
</html>