// JavaScript-based Dark Mode Toggle

// Function to set the dark mode theme
function setDarkMode(isDarkMode) {
  const root = document.documentElement;
  if (isDarkMode) {
    root.classList.add('dark-mode');
    root.classList.remove('light-mode');
  } else {
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
  }
}

// Function to toggle dark mode
function toggleDarkMode() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  const newDarkModeState = !isDarkMode;
  localStorage.setItem('darkMode', newDarkModeState);
  setDarkMode(newDarkModeState);
}

// Function to initialize the theme based on user preference
function initializeTheme() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  setDarkMode(isDarkMode);
}

// Event listener for the toggle button
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('dark-mode-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleDarkMode);
  }

  // Initialize the theme based on user preference
  initializeTheme();
});

// CSS for dark mode and light mode
const style = document.createElement('style');
style.innerHTML = `
  body.dark-mode {
    background-color: #121212;
    color: #ffffff;
  }
  body.dark-mode a {
    color: #bb86fc;
  }
  body.light-mode {
    background-color: #ffffff;
    color: #000000;
  }
  body.light-mode a {
    color: #007bff;
  }
`;
document.head.appendChild(style);