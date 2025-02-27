const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  user: 'your_db_user',
  host: 'your_db_host',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

app.post('/createPoll', async (req, res) => {
  const { question, options } = req.body;

  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO polls (question) VALUES ($1) RETURNING id',
      [question]
    );
    const pollId = result.rows[0].id;

    for (let option of options) {
      await client.query(
        'INSERT INTO options (poll_id, option_text) VALUES ($1, $2)',
        [pollId, option]
      );
    }

    client.release();
    res.status(201).send({ pollId });
  } catch (err) {
    res.status(500).send('Error creating poll');
  }
});

app.post('/vote', async (req, res) => {
  const { pollId, optionId } = req.body;

  try {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO votes (poll_id, option_id) VALUES ($1, $2)',
      [pollId, optionId]
    );
    client.release();
    res.status(201).send('Vote recorded');
  } catch (err) {
    res.status(500).send('Error recording vote');
  }
});

app.get('/pollResults/:id', async (req, res) => {
  const pollId = req.params.id;

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT o.option_text, COUNT(v.id) as vote_count
       FROM options o
       LEFT JOIN votes v ON o.id = v.option_id
       WHERE o.poll_id = $1
       GROUP BY o.id`,
      [pollId]
    );
    client.release();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching poll results');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});