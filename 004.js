document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('registrationForm');

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    if (validateForm(name, email, phone)) {
      const data = { name, email, phone };

      fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          alert('Registration successful!');
        } else {
          alert('Registration failed. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      });
    }
  });

  function validateForm(name, email, phone) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!name || !email || !phone) {
      alert('All fields are required.');
      return false;
    }

    if (!emailRegex.test(email)) {
      alert('Invalid email format.');
      return false;
    }

    if (!phoneRegex.test(phone)) {
      alert('Invalid phone number format.');
      return false;
    }

    return true;
  }
});