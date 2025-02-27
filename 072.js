// JavaScript Image Gallery with Upload, Preview, and Drag-and-Drop

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import fs from 'fs';

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/imageGallery', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Image Schema
const imageSchema = new mongoose.Schema({
  filename: String,
  path: String,
});

const Image = mongoose.model('Image', imageSchema);

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// API routes
app.post('/api/upload', upload.array('images', 12), async (req, res) => {
  const files = req.files;
  const images = files.map((file) => ({
    filename: file.filename,
    path: file.path,
  }));

  await Image.insertMany(images);
  res.status(200).json({ message: 'Images uploaded successfully' });
});

app.get('/api/images', async (req, res) => {
  const images = await Image.find();
  res.status(200).json(images);
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React and react-beautiful-dnd for drag-and-drop
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function App() {
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const response = await axios.get('/api/images');
    setImages(response.data);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    Array.from(document.querySelector('input[type="file"]').files).forEach((file) => {
      formData.append('images', file);
    });

    await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    fetchImages();
    setPreviewImages([]);
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const reorderedImages = Array.from(images);
    const [removed] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, removed);

    setImages(reorderedImages);
  };

  return (
    <div>
      <h1>Image Gallery</h1>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <div>
        <h2>Preview Images</h2>
        <div className="preview-images">
          {previewImages.map((preview, index) => (
            <img key={index} src={preview} alt={`Preview ${index}`} />
          ))}
        </div>
      </div>
      <div>
        <h2>Uploaded Images</h2>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="images">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {images.map((image, index) => (
                  <Draggable key={image._id} draggableId={image._id} index={index}>
                    {(provided) => (
                      <div
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                        className="image-item"
                      >
                        <img src={`http://localhost:3000/${image.path}`} alt={image.filename} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;

// CSS for the image gallery
const style = document.createElement('style');
style.innerHTML = `
  .preview-images img {
    width: 100px;
    height: 100px;
    margin: 5px;
  }
  .image-item {
    display: inline-block;
    margin: 5px;
  }
  .image-item img {
    width: 100px;
    height: 100px;
  }
`;
document.head.appendChild(style);