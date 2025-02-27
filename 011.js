const express = require('express');
const mongoose = require('mongoose');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/event_registration', { useNewUrlParser: true, useUnifiedTopology: true });

const eventSchema = new mongoose.Schema({
  name: String,
  email: String,
  event: String,
  dietaryPreferences: String,
  qrCode: String
});

const Event = mongoose.model('Event', eventSchema);

app.post('/register', async (req, res) => {
  const { name, email, event, dietaryPreferences } = req.body;

  if (!name || !email || !event) {
    return res.status(400).send('Name, email, and event are required');
  }

  const qrCode = await qrcode.toDataURL(JSON.stringify({ name, email, event, dietaryPreferences }));

  const newEvent = new Event({ name, email, event, dietaryPreferences, qrCode });
  await newEvent.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password'
    }
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Event Registration Confirmation',
    text: 'Thank you for registering!',
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrCode.split(',')[1],
        encoding: 'base64'
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error sending email');
    }
    res.status(200).send('Registration successful!');
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});