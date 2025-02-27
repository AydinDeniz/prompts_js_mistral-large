//JavaScript Function for Infinite Scrolling with Debounce Mechanism

// Debounce function to limit the rate at which a function can fire
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Function to check if the user has scrolled to the bottom of the page
function isBottomOfPage() {
  return window.innerHeight + window.scrollY >= document.body.offsetHeight;
}

// Function to fetch and append new content
async function fetchAndAppendContent() {
  // Simulate an API call to fetch new content
  const response = await fetch('https://api.example.com/new-content');
  const data = await response.json();

  // Append new content to the page
  const contentContainer = document.getElementById('content-container');
  data.forEach(item => {
    const newItem = document.createElement('div');
    newItem.className = 'content-item';
    newItem.textContent = item.content;
    contentContainer.appendChild(newItem);
  });
}

// Function to handle scroll event
function handleScroll() {
  if (isBottomOfPage()) {
    fetchAndAppendContent();
  }
}

// Debounce the scroll event handler
const debouncedHandleScroll = debounce(handleScroll, 300);

// Add event listener for scroll event
window.addEventListener('scroll', debouncedHandleScroll);

// Example HTML structure
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Infinite Scrolling</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    #content-container {
      padding: 20px;
    }
    .content-item {
      background-color: #f9f9f9;
      margin-bottom: 20px;
      padding: 20px;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div id="content-container">
    <!-- Initial content will be loaded here -->
  </div>
  <script src="infiniteScroll.js"></script>
</body>
</html>
*/

// Initial load of content
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndAppendContent();
});