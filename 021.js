// Online Classroom Platform

// HTML Structure
document.body.innerHTML = `
  <div id="app">
    <h1>Online Classroom Platform</h1>
    <div id="videoStream">
      <h2>Live Video Stream</h2>
      <iframe id="zoomIframe" width="640" height="480" frameborder="0"></iframe>
    </div>
    <div id="chat">
      <h2>Chat</h2>
      <div id="messages"></div>
      <input type="text" id="chatInput" placeholder="Type a message...">
      <button id="sendMessage">Send</button>
    </div>
    <div id="fileSharing">
      <h2>File Sharing</h2>
      <input type="file" id="fileInput">
      <button id="uploadFile">Upload</button>
      <div id="fileList"></div>
    </div>
  </div>
`;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "your_firebase_api_key",
  authDomain: "your_firebase_auth_domain",
  projectId: "your_firebase_project_id",
  storageBucket: "your_firebase_storage_bucket",
  messagingSenderId: "your_firebase_messaging_sender_id",
  appId: "your_firebase_app_id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Zoom API Configuration
const zoomConfig = {
  apiKey: "your_zoom_api_key",
  apiSecret: "your_zoom_api_secret",
  meetingId: "your_zoom_meeting_id",
  passcode: "your_zoom_passcode"
};

// Embed Zoom meeting
const zoomIframe = document.getElementById('zoomIframe');
zoomIframe.src = `https://zoom.us/wc/${zoomConfig.meetingId}/join?pwd=${zoomConfig.passcode}`;

// Chat Functionality
const messages = document.getElementById('messages');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');

sendMessage.addEventListener('click', () => {
  const message = chatInput.value;
  if (message) {
    db.collection('messages').add({
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = '';
  }
});

db.collection('messages').orderBy('timestamp').onSnapshot(snapshot => {
  messages.innerHTML = '';
  snapshot.forEach(doc => {
    const message = doc.data();
    const messageElement = document.createElement('div');
    messageElement.textContent = message.text;
    messages.appendChild(messageElement);
  });
});

// File Sharing Functionality
const fileInput = document.getElementById('fileInput');
const uploadFile = document.getElementById('uploadFile');
const fileList = document.getElementById('fileList');

uploadFile.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (file) {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(file.name);
    fileRef.put(file).then(() => {
      fileRef.getDownloadURL().then(url => {
        db.collection('files').add({
          name: file.name,
          url: url,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    });
  }
});

db.collection('files').orderBy('timestamp').onSnapshot(snapshot => {
  fileList.innerHTML = '';
  snapshot.forEach(doc => {
    const file = doc.data();
    const fileElement = document.createElement('div');
    fileElement.innerHTML = `<a href="${file.url}" target="_blank">${file.name}</a>`;
    fileList.appendChild(fileElement);
  });
});