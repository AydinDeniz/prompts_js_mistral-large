// Augmented Reality Shopping Experience

// Import necessary libraries
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Product schema and model
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imageUrl: String,
  modelUrl: String, // URL to the 3D model for AR
});

const Product = mongoose.model('Product', productSchema);

// API routes
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.status(201).json(newProduct);
});

// WebXR AR Experience
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controller = renderer.xr.getController(0);
scene.add(controller);

// Load 3D model
const loader = new THREE.GLTFLoader();
loader.load('path/to/model.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);
  model.position.set(0, 0, -2);
});

// Handle WebXR session
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}

animate();

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});