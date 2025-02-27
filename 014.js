const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const firebase = require('firebase');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinRoom', ({ room, username }) => {
    socket.join(room);
    socket.room = room;
    socket.username = username;

    db.collection('documents').doc(room).get().then(doc => {
      if (doc.exists) {
        socket.emit('initialContent', doc.data().content);
      } else {
        db.collection('documents').doc(room).set({ content: '', versions: [] });
        socket.emit('initialContent', '');
      }
    });

    socket.on('editContent', ({ content }) => {
      db.collection('documents').doc(room).update({
        content: content,
        versions: firebase.firestore.FieldValue.arrayUnion({
          content: content,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          user: username
        })
      });

      io.to(room).emit('contentChanged', { content, user: username });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});