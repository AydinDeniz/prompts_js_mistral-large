const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_db_user',
  password: 'your_db_password',
  database: 'your_db_name'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

app.post('/book', (req, res) => {
  const { name, email, phone, car, startDate, endDate, payment } = req.body;

  const sql = 'INSERT INTO bookings (name, email, phone, car, startDate, endDate, payment) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [name, email, phone, car, startDate, endDate, payment];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error booking the car' });
    }
    res.json({ message: 'Car booked successfully' });
  });
});

app.get('/search', (req, res) => {
  const { carType, startDate, endDate } = req.query;

  const sql = 'SELECT * FROM cars WHERE carType = ? AND startDate >= ? AND endDate <= ?';
  const values = [carType, startDate, endDate];

  db.query(sql, values, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error searching for cars' });
    }
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Car Rental Booking Form</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    form {
      max-width: 600px;
      margin: auto;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
    }
    .form-group button {
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
    }
    .form-group button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <h1>Car Rental Booking Form</h1>
  <form id="bookingForm">
    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div class="form-group">
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
      <label for="phone">Phone:</label>
      <input type="tel" id="phone" name="phone" required>
    </div>
    <div class="form-group">
      <label for="car">Select Car:</label>
      <select id="car" name="car" required>
        <option value="sedan">Sedan</option>
        <option value="suv">SUV</option>
        <option value="compact">Compact</option>
      </select>
    </div>
    <div class="form-group">
      <label for="startDate">Rental Start Date:</label>
      <input type="date" id="startDate" name="startDate" required>
    </div>
    <div class="form-group">
      <label for="endDate">Rental End Date:</label>
      <input type="date" id="endDate" name="endDate" required>
    </div>
    <div class="form-group">
      <label for="payment">Payment Information:</label>
      <input type="text" id="payment" name="payment" required>
    </div>
    <div class="form-group">
      <button type="submit">Book Now</button>
    </div>
  </form>

  <h2>Search Available Cars</h2>
  <form id="searchForm">
    <div class="form-group">
      <label for="searchCar">Car Type:</label>
      <select id="searchCar" name="searchCar">
        <option value="sedan">Sedan</option>
        <option value="suv">SUV</option>
        <option value="compact">Compact</option>
      </select>
    </div>
    <div class="form-group">
      <label for="searchStartDate">Start Date:</label>
      <input type="date" id="searchStartDate" name="searchStartDate">
    </div>
    <div class="form-group">
      <label for="searchEndDate">End Date:</label>
      <input type="date" id="searchEndDate" name="searchEndDate">
    </div>
    <div class="form-group">
      <button type="submit">Search</button>
    </div>
  </form>

  <div id="results"></div>

  <script>
    document.getElementById('bookingForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const car = document.getElementById('car').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      const payment = document.getElementById('payment').value;

      const response = await fetch('/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, car, startDate, endDate, payment })
      });

      const result = await response.json();
      alert(result.message);
    });

    document.getElementById('searchForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const carType = document.getElementById('searchCar').value;
      const startDate = document.getElementById('searchStartDate').value;
      const endDate = document.getElementById('searchEndDate').value;

      const response = await fetch(`/search?carType=${carType}&startDate=${startDate}&endDate=${endDate}`);
      const results = await response.json();

      const resultsDiv = document.getElementById('results');
      resultsDiv.innerHTML = '<h3>Available Cars:</h3>';
      results.forEach(result => {
        resultsDiv.innerHTML += `<p>${result.carType} available from ${result.startDate} to ${result.endDate}</p>`;
      });
    });
  </script>
</body>
</html>