const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
  user: 'your_db_user',
  host: 'your_db_host',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

app.post('/bookAppointment', async (req, res) => {
  const { name, email, phone, date, time } = req.body;

  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO appointments (name, email, phone, date, time) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone, date, time]
    );
    client.release();
    res.status(201).send({ message: 'Appointment booked successfully', id: result.rows[0].id });
  } catch (err) {
    res.status(500).send('Error booking appointment');
  }
});

app.get('/getAppointments', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM appointments');
    client.release();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching appointments');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthcare Appointment Scheduler</title>
  <link href='https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.css' rel='stylesheet' />
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
    #calendar {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Book an Appointment</h1>
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
      <label for="date">Date:</label>
      <input type="date" id="date" name="date" required>
    </div>
    <div class="form-group">
      <label for="time">Time:</label>
      <input type="time" id="time" name="time" required>
    </div>
    <div class="form-group">
      <button type="submit">Book Appointment</button>
    </div>
  </form>

  <div id="calendar"></div>

  <script src='https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.js'></script>
  <script>
    document.getElementById('bookingForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;

      const response = await fetch('http://localhost:3000/bookAppointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, date, time })
      });

      const result = await response.json();
      alert(result.message);
      loadCalendar();
    });

    async function loadCalendar() {
      const response = await fetch('http://localhost:3000/getAppointments');
      const appointments = await response.json();

      const calendarEl = document.getElementById('calendar');
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: appointments.map(appointment => ({
          title: `${appointment.name} - ${appointment.time}`,
          start: appointment.date
        }))
      });
      calendar.render();
    }

    loadCalendar();
  </script>
</body>
</html>