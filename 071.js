// Idle Detection and Auto Logout

// Function to detect user idle time and display warning modal
function detectIdleAndLogout(idleTime, warningTime) {
  let idleTimeout;
  let warningTimeout;
  let lastActivityTime = Date.now();

  // Function to reset idle timer
  function resetIdleTimer() {
    clearTimeout(idleTimeout);
    clearTimeout(warningTimeout);
    lastActivityTime = Date.now();
    idleTimeout = setTimeout(showWarningModal, idleTime);
  }

  // Function to show warning modal
  function showWarningModal() {
    const modal = document.createElement('div');
    modal.className = 'warning-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Warning</h2>
        <p>You will be logged out due to inactivity.</p>
        <button id="stay-logged-in">Stay Logged In</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('stay-logged-in').addEventListener('click', () => {
      document.body.removeChild(modal);
      resetIdleTimer();
    });

    warningTimeout = setTimeout(logoutUser, warningTime);
  }

  // Function to log out the user
  function logoutUser() {
    alert('You have been logged out due to inactivity.');
    // Add your logout logic here, e.g., redirect to login page
    window.location.href = '/login';
  }

  // Event listeners for mouse movement and keypresses
  document.addEventListener('mousemove', resetIdleTimer);
  document.addEventListener('keypress', resetIdleTimer);
  document.addEventListener('click', resetIdleTimer);

  // Start the idle timer
  resetIdleTimer();
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  detectIdleAndLogout(30000, 10000); // 30 seconds idle time, 10 seconds warning time
});

// CSS for the warning modal
const style = document.createElement('style');
style.innerHTML = `
  .warning-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border: 1px solid #ccc;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
  .modal-content {
    text-align: center;
  }
  .modal-content h2 {
    margin-bottom: 10px;
  }
  .modal-content button {
    margin-top: 10px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
  }
`;
document.head.appendChild(style);