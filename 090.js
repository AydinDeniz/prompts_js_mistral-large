// JavaScript Function to Display User-Generated Text with Rich Formatting

// Function to sanitize and display user-generated text
function displayUserText(userText) {
  // Create a container element for the user text
  const container = document.createElement('div');
  container.className = 'user-text-container';

  // Sanitize the user input to prevent unintended behavior
  const sanitizedText = sanitizeInput(userText);

  // Create a paragraph element for the sanitized text
  const paragraph = document.createElement('p');
  paragraph.innerHTML = sanitizedText;

  // Append the paragraph to the container
  container.appendChild(paragraph);

  // Append the container to the body or a specific element on the webpage
  document.body.appendChild(container);
}

// Function to sanitize user input
function sanitizeInput(input) {
  // Create a temporary element to sanitize the input
  const tempElement = document.createElement('div');
  tempElement.textContent = input;

  // Return the sanitized input
  return tempElement.innerHTML;
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  // Get the user input element
  const userInput = document.getElementById('user-input');

  // Get the display button element
  const displayButton = document.getElementById('display-button');

  // Add event listener to the display button
  displayButton.addEventListener('click', () => {
    // Get the user-generated text
    const userText = userInput.value;

    // Display the user-generated text with rich formatting
    displayUserText(userText);
  });
});

// Example HTML structure
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Display User Text</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .user-text-container {
      border: 1px solid #ccc;
      padding: 10px;
      margin-top: 20px;
      background-color: #f9f9f9;
    }
    .user-text-container p {
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Display User Text</h1>
  <div>
    <textarea id="user-input" rows="4" cols="50" placeholder="Enter your text here..."></textarea>
    <button id="display-button">Display Text</button>
  </div>
  <script src="displayUserText.js"></script>
</body>
</html>
*/