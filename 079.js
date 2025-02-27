// JavaScript Function to Monitor Typing Speed and Accuracy

// Function to calculate words per minute (WPM)
function calculateWPM(text, time) {
  const words = text.trim().split(/\s+/).length;
  const minutes = time / 60000;
  return Math.round(words / minutes);
}

// Function to calculate accuracy
function calculateAccuracy(originalText, typedText) {
  const originalWords = originalText.trim().split(/\s+/);
  const typedWords = typedText.trim().split(/\s+/);
  let correctWords = 0;

  for (let i = 0; i < typedWords.length; i++) {
    if (typedWords[i] === originalWords[i]) {
      correctWords++;
    }
  }

  return Math.round((correctWords / originalWords.length) * 100);
}

// Function to update the progress bar
function updateProgressBar(wpm, targetWPM) {
  const progressBar = document.getElementById('progress-bar');
  const progress = (wpm / targetWPM) * 100;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
  progressBar.textContent = `${Math.min(progress, 100)}%`;
}

// Function to monitor typing speed and accuracy
function monitorTypingSpeed(originalText, targetWPM) {
  const textArea = document.getElementById('typing-area');
  let startTime = null;
  let intervalId = null;

  textArea.addEventListener('input', () => {
    if (!startTime) {
      startTime = Date.now();
      intervalId = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const typedText = textArea.value;
        const wpm = calculateWPM(typedText, elapsedTime);
        const accuracy = calculateAccuracy(originalText, typedText);

        document.getElementById('wpm').textContent = `WPM: ${wpm}`;
        document.getElementById('accuracy').textContent = `Accuracy: ${accuracy}%`;
        updateProgressBar(wpm, targetWPM);
      }, 1000);
    }
  });

  textArea.addEventListener('blur', () => {
    if (intervalId) {
      clearInterval(intervalId);
      startTime = null;
    }
  });
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const originalText = "The quick brown fox jumps over the lazy dog.";
  const targetWPM = 50; // Target words per minute

  monitorTypingSpeed(originalText, targetWPM);
});

// CSS for progress bar and styling
const style = document.createElement('style');
style.innerHTML = `
  body {
    font-family: Arial, sans-serif;
    margin: 20px;
  }
  #typing-area {
    width: 100%;
    height: 150px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  }
  #progress-bar-container {
    width: 100%;
    background-color: #e0e0e0;
    border-radius: 4px;
    margin-top: 20px;
    height: 20px;
    overflow: hidden;
  }
  #progress-bar {
    height: 100%;
    background-color: #007bff;
    text-align: center;
    color: white;
    line-height: 20px;
  }
`;
document.head.appendChild(style);