// JavaScript Function to Implement File Upload Feature for Admin Dashboard

// Function to handle file upload
function handleFileUpload(event) {
  const fileInput = event.target;
  const files = fileInput.files;
  const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.ms-excel'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  for (const file of files) {
    if (!allowedFileTypes.includes(file.type)) {
      alert(`Invalid file type: ${file.name}`);
      continue;
    }

    if (file.size > maxFileSize) {
      alert(`File size exceeds the limit: ${file.name}`);
      continue;
    }

    // Process the file (e.g., upload to server)
    uploadFile(file);
  }
}

// Function to upload file to server
function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(`File uploaded successfully: ${file.name}`);
    } else {
      alert(`Failed to upload file: ${file.name}`);
    }
  })
  .catch(error => {
    console.error('Error uploading file:', error);
    alert(`Error uploading file: ${file.name}`);
  });
}

// Event listener for file input
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
  }
});

// Example HTML structure
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .upload-container {
      margin-bottom: 20px;
    }
    .upload-container input[type="file"] {
      display: block;
      margin-bottom: 10px;
    }
    .upload-container button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Admin Dashboard</h1>
  <div class="upload-container">
    <input type="file" id="file-input" multiple>
    <button onclick="document.getElementById('file-input').click()">Upload Files</button>
  </div>
  <script src="fileUpload.js"></script>
</body>
</html>
*/