// JavaScript-based Auto-Save Feature for a Web Form with Additional Functionalities

// Function to save form data to local storage
function saveFormData(formId) {
  const form = document.getElementById(formId);
  const formData = {};
  const formElements = form.elements;

  for (let i = 0; i < formElements.length; i++) {
    const element = formElements[i];
    if (element.name) {
      formData[element.name] = element.type === 'checkbox' ? element.checked : element.value;
    }
  }

  localStorage.setItem(formId, JSON.stringify(formData));
}

// Function to restore form data from local storage
function restoreFormData(formId) {
  const savedData = localStorage.getItem(formId);
  if (savedData) {
    const formData = JSON.parse(savedData);
    const form = document.getElementById(formId);
    const formElements = form.elements;

    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      if (element.name && formData[element.name] !== undefined) {
        if (element.type === 'checkbox') {
          element.checked = formData[element.name];
        } else {
          element.value = formData[element.name];
        }
      }
    }

    // Display a message confirming restoration
    alert('Form data restored successfully.');
  }
}

// Function to periodically save form data
function setupAutoSave(formId, interval = 5000) {
  setInterval(() => {
    saveFormData(formId);
  }, interval);

  // Restore form data on page load
  restoreFormData(formId);
}

// Function to validate form inputs
function validateForm(formId) {
  const form = document.getElementById(formId);
  const formElements = form.elements;
  let isValid = true;

  for (let i = 0; i < formElements.length; i++) {
    const element = formElements[i];
    if (element.required && !element.value) {
      isValid = false;
      element.classList.add('invalid');
    } else {
      element.classList.remove('invalid');
    }
  }

  return isValid;
}

// Function to handle form submission
function handleSubmit(e) {
  e.preventDefault();
  const formId = e.target.id;
  if (validateForm(formId)) {
    alert('Form submitted successfully!');
    // Add your form submission logic here
  } else {
    alert('Please fill in all required fields.');
  }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const formId = 'autoSaveForm';
  setupAutoSave(formId);

  const form = document.getElementById(formId);
  form.addEventListener('submit', handleSubmit);
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
  .invalid {
    border-color: red;
  }
`;
document.head.appendChild(style);