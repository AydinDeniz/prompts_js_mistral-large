// JavaScript Function to Detect and Prevent Special Characters in Input Field

// Function to detect and prevent special characters in input field
function detectAndPreventSpecialCharacters(event) {
  const input = event.target;
  const value = input.value;
  const pattern = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

  if (pattern.test(value)) {
    input.value = value.replace(pattern, '');
    showFeedback('Invalid character detected and removed.');
  } else {
    hideFeedback();
  }
}

// Function to show real-time feedback on invalid characters
function showFeedback(message) {
  const feedbackElement = document.getElementById('feedback');
  feedbackElement.textContent = message;
  feedbackElement.style.display = 'block';
}

// Function to hide real-time feedback
function hideFeedback() {
  const feedbackElement = document.getElementById('feedback');
  feedbackElement.style.display = 'none';
}

// Event listener for input field
document.addEventListener('DOMContentLoaded', () => {
  const inputField = document.getElementById('user-input');
  if (inputField) {
    inputField.addEventListener('input', detectAndPreventSpecialCharacters);
  }
});

// Example HTML structure
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Character Prevention</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    #feedback {
      display: none;
      color: red;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>Special Character Prevention</h1>
  <div>
    <label for="user-input">Enter text:</label>
    <input type="text" id="user-input" name="user-input">
    <div id="feedback"></div>
  </div>
  <script src="specialCharacterPrevention.js"></script>
</body>
</html>
*/

// Additional functionalities and explanations

// Function to handle form submission
function handleSubmit(event) {
  event.preventDefault();
  const inputField = document.getElementById('user-input');
  const value = inputField.value;
  const pattern = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

  if (pattern.test(value)) {
    showFeedback('Invalid character detected and removed.');
    inputField.value = value.replace(pattern, '');
  } else {
    hideFeedback();
    alert('Form submitted successfully!');
    // Add your form submission logic here
  }
}

// Event listener for form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('user-form');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
});

// CSS for form validation and styling
const style = document.createElement('style');
style.innerHTML = `
  body {
    font-family: Arial, sans-serif;
    margin: 20px;
  }
  form {
    display: flex;
    flex-direction: column;
  }
  label {
    margin-bottom: 5px;
  }
  input, textarea {
    margin-bottom: 15px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  #feedback {
    display: none;
    color: red;
    margin-top: 10px;
  }
`;
document.head.appendChild(style);