// Virtual Reality Tour Creator

// HTML Structure
document.body.innerHTML = `
  <div id="app">
    <h1>Virtual Reality Tour Creator</h1>
    <div id="uploadSection">
      <h2>Upload 360-degree Image</h2>
      <input type="file" id="imageUpload" accept="image/*">
      <button id="uploadButton">Upload</button>
    </div>
    <div id="hotspotSection">
      <h2>Add Hotspot</h2>
      <input type="text" id="hotspotDescription" placeholder="Description">
      <button id="addHotspotButton">Add Hotspot</button>
    </div>
    <div id="tourSection">
      <h2>Tour Preview</h2>
      <div id="tourContainer"></div>
    </div>
  </div>
`;

// Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('tourContainer').appendChild(renderer.domElement);

// Load 360-degree image
function loadImage(url) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(url);
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
}

// Upload image and save to MongoDB
document.getElementById('uploadButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('imageUpload');
  const file = fileInput.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    loadImage(result.url);
  }
});

// Add hotspot
document.getElementById('addHotspotButton').addEventListener('click', () => {
  const description = document.getElementById('hotspotDescription').value;
  if (description) {
    const hotspot = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    hotspot.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, -300);
    hotspot.description = description;
    scene.add(hotspot);

    // Save hotspot to MongoDB
    fetch('/addHotspot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ description, position: hotspot.position })
    });
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Node.js Server (Example)
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/vr_tour', { useNewUrlParser: true, useUnifiedTopology: true });

const tourSchema = new mongoose.Schema({
  imageUrl: String,
  hotspots: [{
    description: String,
    position: {
      x: Number,
      y: Number,
      z: Number
    }
  }]
});

const Tour = mongoose.model('Tour', tourSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;
  const newTour = new Tour({ imageUrl: filePath });
  await newTour.save();
  res.json({ url: filePath });
});

app.post('/addHotspot', async (req, res) => {
  const { description, position } = req.body;
  const tour = await Tour.findOne();
  if (tour) {
    tour.hotspots.push({ description, position });
    await tour.save();
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});