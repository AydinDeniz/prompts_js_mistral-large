// JavaScript Feature to Record and Replay User Interactions

// Function to record user interactions
function recordInteractions() {
  const interactions = [];
  let recording = false;

  function startRecording() {
    recording = true;
    interactions.length = 0; // Clear previous interactions
    document.addEventListener('click', recordClick);
    document.addEventListener('scroll', recordScroll);
    document.addEventListener('input', recordInput);
  }

  function stopRecording() {
    recording = false;
    document.removeEventListener('click', recordClick);
    document.removeEventListener('scroll', recordScroll);
    document.removeEventListener('input', recordInput);
  }

  function recordClick(event) {
    if (recording) {
      interactions.push({
        type: 'click',
        target: event.target,
        timestamp: Date.now()
      });
    }
  }

  function recordScroll(event) {
    if (recording) {
      interactions.push({
        type: 'scroll',
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        timestamp: Date.now()
      });
    }
  }

  function recordInput(event) {
    if (recording) {
      interactions.push({
        type: 'input',
        target: event.target,
        value: event.target.value,
        timestamp: Date.now()
      });
    }
  }

  return {
    startRecording,
    stopRecording,
    getInteractions: () => interactions
  };
}

// Function to replay user interactions
function replayInteractions(interactions) {
  let index = 0;

  function playNextInteraction() {
    if (index < interactions.length) {
      const interaction = interactions[index];
      const delay = interaction.timestamp - (index > 0 ? interactions[index - 1].timestamp : Date.now());

      setTimeout(() => {
        if (interaction.type === 'click') {
          interaction.target.click();
        } else if (interaction.type === 'scroll') {
          window.scrollTo(interaction.scrollX, interaction.scrollY);
        } else if (interaction.type === 'input') {
          interaction.target.value = interaction.value;
          const event = new Event('input', { bubbles: true });
          interaction.target.dispatchEvent(event);
        }
        index++;
        playNextInteraction();
      }, delay);
    }
  }

  playNextInteraction();
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const recorder = recordInteractions();
  const startButton = document.getElementById('start-recording');
  const stopButton = document.getElementById('stop-recording');
  const replayButton = document.getElementById('replay-recording');

  startButton.addEventListener('click', () => {
    recorder.startRecording();
  });

  stopButton.addEventListener('click', () => {
    recorder.stopRecording();
  });

  replayButton.addEventListener('click', () => {
    const interactions = recorder.getInteractions();
    replayInteractions(interactions);
  });
});

// CSS for buttons styling
const style = document.createElement('style');
style.innerHTML = `
  body {
    font-family: Arial, sans-serif;
    margin: 20px;
  }
  button {
    padding: 10px 20px;
    margin: 5px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;
document.head.appendChild(style);