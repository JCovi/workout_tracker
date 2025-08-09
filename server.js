const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'workout_user',
  password: 'jcovi',
  database: 'workout_tracker'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

// Test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// --- helpers ---
const isInt = (v) => Number.isInteger(v);
const inRange = (v, min, max) => isInt(v) && v >= min && v <= max;

// GET days (optional helper for UI)
app.get('/days', (req, res) => {
  db.query('SELECT * FROM days ORDER BY position', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET exercises for a day: /exercises?day_id=1
app.get('/exercises', (req, res) => {
  const dayId = Number(req.query.day_id);
  if (!isInt(dayId)) return res.status(400).json({ error: 'day_id required (int)' });

  db.execute(
    'SELECT * FROM exercises WHERE day_id = ? ORDER BY position, id',
    [dayId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST create exercise (JSON body)
app.post('/exercises', (req, res) => {
  const { day_id, name, sets, reps, weight_lbs = 0, rest_seconds = 0, position = 0 } = req.body;

  if (!isInt(day_id) || !name || !inRange(sets, 1, 10) || !inRange(reps, 1, 20))
    return res.status(400).json({ error: 'Invalid body: day_id(int), name, sets(1-10), reps(1-20) required' });

  const w = Number(weight_lbs);
  const r = Number(rest_seconds);
  if (!isInt(w) || w < 0 || !isInt(r) || r < 0)
    return res.status(400).json({ error: 'weight_lbs>=0, rest_seconds>=0 (ints)' });

  db.execute(
    `INSERT INTO exercises (day_id, name, sets, reps, weight_lbs, rest_seconds, position)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [day_id, name, sets, reps, w, r, Number(position) || 0],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId });
    }
  );
});

// PUT update exercise by id (partial updates allowed)
app.put('/exercises/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: 'id must be int' });

  const fields = [];
  const values = [];

  const allow = ['name', 'sets', 'reps', 'weight_lbs', 'rest_seconds', 'position', 'day_id'];
  for (const k of allow) {
    if (req.body[k] !== undefined) {
      if (k === 'sets' && !inRange(req.body[k], 1, 10)) return res.status(400).json({ error: 'sets 1-10' });
      if (k === 'reps' && !inRange(req.body[k], 1, 20)) return res.status(400).json({ error: 'reps 1-20' });
      if ((k === 'weight_lbs' || k === 'rest_seconds' || k === 'position' || k === 'day_id')
          && (!isInt(Number(req.body[k])) || Number(req.body[k]) < 0))
        return res.status(400).json({ error: `${k} must be non-negative int` });

      fields.push(`${k} = ?`);
      values.push(req.body[k]);
    }
  }

  if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });

  values.push(id);
  db.execute(`UPDATE exercises SET ${fields.join(', ')} WHERE id = ?`, values, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: r.affectedRows });
  });
});

// DELETE exercise by id
app.delete('/exercises/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: 'id must be int' });

  db.execute('DELETE FROM exercises WHERE id = ?', [id], (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: r.affectedRows });
  });
});

// Test DB route
app.get('/db/test', (req, res) => {
    db.query('SELECT * FROM days ORDER BY position', (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send('Database query failed');
        return;
      }
      res.json(results);
    });
  });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
