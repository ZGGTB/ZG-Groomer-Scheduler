// Server/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Secret key for JWT signing (store securely in production)
const secretKey = 'your-secret-key';

// Open (or create) the SQLite database file named ZG-Grooming-Scheduler.db
const dbPath = path.resolve(__dirname, 'ZG-Grooming-Scheduler.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create events table
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TEXT
      )
    `, (err) => { if (err) console.error(err.message); });
    
    // Create event_history table (if not exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS event_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT,
        action TEXT,
        title TEXT,
        date TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => { if (err) console.error(err.message); });
    
    // --- Alter event_history table to add new columns if missing ---
    db.all("PRAGMA table_info(event_history)", [], (err, columns) => {
      if (err) {
        console.error("Error checking event_history columns:", err.message);
      } else {
        const colNames = columns.map(col => col.name);
        if (!colNames.includes("cell_id")) {
          db.run("ALTER TABLE event_history ADD COLUMN cell_id TEXT", [], (err) => {
            if (err) console.error("Error adding cell_id column:", err.message);
            else console.log("Added cell_id column to event_history table.");
          });
        }
        if (!colNames.includes("name")) {
          db.run("ALTER TABLE event_history ADD COLUMN name TEXT", [], (err) => {
            if (err) console.error("Error adding name column:", err.message);
            else console.log("Added name column to event_history table.");
          });
        }
        if (!colNames.includes("status")) {
          db.run("ALTER TABLE event_history ADD COLUMN status TEXT", [], (err) => {
            if (err) console.error("Error adding status column:", err.message);
            else console.log("Added status column to event_history table.");
          });
        }
        if (!colNames.includes("note")) {
          db.run("ALTER TABLE event_history ADD COLUMN note TEXT", [], (err) => {
            if (err) console.error("Error adding note column:", err.message);
            else console.log("Added note column to event_history table.");
          });
        }
        if (!colNames.includes("user")) {
          db.run("ALTER TABLE event_history ADD COLUMN user TEXT", [], (err) => {
            if (err) console.error("Error adding user column:", err.message);
            else console.log("Added user column to event_history table.");
          });
        }
      }
    });
    
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      )
    `, (err) => { if (err) console.error(err.message); });
    
    // Create vans table
    db.run(`
      CREATE TABLE IF NOT EXISTS vans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      )
    `, (err) => { if (err) console.error(err.message); });
    
    // Create groomers table
    db.run(`
      CREATE TABLE IF NOT EXISTS groomers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        schedule TEXT
      )
    `, (err) => { if (err) console.error(err.message); });
    
    // Create schedule table – each cell uniquely identified by (van_id, day)
    db.run(`
      CREATE TABLE IF NOT EXISTS schedule (
        van_id INTEGER,
        day TEXT,
        assignment TEXT,
        status TEXT,
        PRIMARY KEY (van_id, day)
      )
    `, (err) => { if (err) console.error('Error creating schedule table:', err.message); });
  }
});

// Middleware: authenticateToken
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Middleware: authorizeAdmin
function authorizeAdmin(req, res, next) {
  if (req.user && req.user.role && req.user.role.toLowerCase() === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

//ENDPOINTS 
// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit.');
  res.json({ message: 'Test endpoint working' });
});

// GET /vans – return all vans
app.get('/vans', authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT * FROM vans", [], (err, rows) => {
    if (err) {
      console.error('Error fetching vans:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('Van List Return:', rows);
    res.json(rows);
  });
});

// POST /vans – add a new van
app.post('/vans', authenticateToken, authorizeAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Van name is required' });
  db.run("INSERT INTO vans (name) VALUES (?)", [name], function(err) {
    if (err) {
      console.error('Error inserting van:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Van added successfully", id: this.lastID, name });
  });
});

// PUT /vans/:id – update a van's name
app.put('/vans/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Van name is required' });
  db.run("UPDATE vans SET name = ? WHERE id = ?", [name, id], function(err) {
    if (err) {
      console.error('Error updating van:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Van not found' });
    }
    res.json({ message: "Van updated successfully" });
  });
});

// DELETE /vans/:id – delete a van
app.delete('/vans/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM vans WHERE id = ?", [id], function(err) {
    if (err) {
      console.error('Error deleting van:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Van not found' });
    }
    res.json({ message: "Van deleted successfully" });
  });
});

// GET /groomers – return all groomers (with schedule parsed)
app.get('/groomers', authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT * FROM groomers", [], (err, rows) => {
    if (err) {
      console.error('Error fetching groomers:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const parsedRows = rows.map(row => ({
      ...row,
      schedule: row.schedule ? JSON.parse(row.schedule) : {}
    }));
    console.log('Groomers List Return:', rows);
    res.json(parsedRows);
  });
});

// GET /schedule – retrieve all schedule cells as a flat array.
app.get('/schedule', authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT * FROM schedule", [], (err, rows) => {
    if (err) {
      console.error('Error fetching schedule:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log("GET /schedule returns:", rows);
    res.json(rows);
  });
});

// PUT /schedule – persist the schedule grid.
// Expects a flat array of schedule cell objects with keys: van_id, day, assignment, status.
app.put('/schedule', authenticateToken, authorizeAdmin, (req, res) => {
  const scheduleData = req.body;
  if (!Array.isArray(scheduleData)) {
    return res.status(400).json({ error: "Invalid schedule data format. Expected an array." });
  }
  let completed = 0;
  let errorOccurred = false;
  scheduleData.forEach((cell) => {
    const { van_id, day, assignment, status } = cell;
    db.run(
      `INSERT OR REPLACE INTO schedule (van_id, day, assignment, status) VALUES (?, ?, ?, ?)`,
      [van_id, day, assignment, status],
      (err) => {
        if (err) {
          console.error('Error updating schedule cell:', err.message);
          errorOccurred = true;
        }
        completed++;
        if (completed === scheduleData.length) {
          if (errorOccurred) {
            return res.status(500).json({ error: "Error updating schedule." });
          }
          res.json({ message: "Schedule updated successfully." });
        }
      }
    );
  });
});

// POST /initialize-schedule – initialize the schedule table with blank cells.
// Expects JSON body: { num_vans: number, num_days: number, start_date: "YYYY-MM-DD" }
app.post('/initialize-schedule', authenticateToken, authorizeAdmin, (req, res) => {
  const { num_vans, num_days, start_date } = req.body;
  if (!num_vans || !num_days || !start_date) {
    return res.status(400).json({ error: 'num_vans, num_days, and start_date are required' });
  }
  const startDate = new Date(start_date);
  let recordsInserted = 0;
  const totalRecords = num_vans * num_days;
  for (let van_id = 1; van_id <= num_vans; van_id++) {
    for (let i = 0; i < num_days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayStr = d.toISOString().split("T")[0];
      db.run(
        `INSERT OR REPLACE INTO schedule (van_id, day, assignment, status) VALUES (?, ?, ?, ?)`,
        [van_id, dayStr, "", "Blank"],
        (err) => {
          if (err) {
            console.error('Error inserting blank schedule cell:', err.message);
          }
          recordsInserted++;
          if (recordsInserted === totalRecords) {
            res.json({ message: "Schedule initialized successfully" });
          }
        }
      );
    }
  }
});

// ===== New Endpoints for Cell History =====

// POST /cell-history – insert a new history record for a cell.
// Expects JSON body with keys: cell_id, date, action, name, status, note, user, and optional timestamp.
app.post('/cell-history', authenticateToken, authorizeAdmin, (req, res) => {
  const { cell_id, date, action, name, status, note, user, timestamp } = req.body;
  if (!cell_id || !date || !action || !name || !status || !user) {
    return res.status(400).json({ error: "Missing required fields. Expected cell_id, date, action, name, status, and user." });
  }
  const ts = timestamp || new Date().toISOString();
  db.run(
    `INSERT INTO event_history (cell_id, action, date, timestamp, name, status, note, user) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [cell_id, action, date, ts, name, status, note || '', user],
    function(err) {
      if (err) {
        console.error("Error inserting cell history:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Cell-History POST Info:', req.body);
      res.json({ message: "Cell history recorded successfully", id: this.lastID });
    }
  );
});


// GET /cell-history/:cell_id – retrieve all history records for a specific cell.
app.get('/cell-history/:cell_id', authenticateToken, authorizeAdmin, (req, res) => {
  const { cell_id } = req.params;
  db.all(
    `SELECT * FROM event_history WHERE cell_id = ? ORDER BY timestamp DESC`,
    [cell_id],
    (err, rows) => {
      if (err) {
        console.error("Error fetching cell history:", err.message);
        return res.status(500).json({ error: err.message });
      }
      /* === HIGHLIGHTED CHANGE: Added response to return rows === */
      res.json(rows);
    }
  );
});


// User management endpoints
app.post('/register', (req, res) => {
  const { id, username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password, and role are required' });
  }
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  db.run(
    "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)",
    [id || Date.now().toString(), username, hashedPassword, role],
    function (err) {
      if (err) {
        console.error('Error registering user:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'User registered successfully' });
    }
  );
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      console.log(`User not found for username: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const payload = { username: user.username, role: user.role };
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    res.json({ token });
  });
});

app.post('/forgot', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });
  res.json({ message: `Password reset not implemented yet for user ${username}.` });
});

// Add this new endpoint to add days to the grid

app.post('/add-days', authenticateToken, authorizeAdmin, (req, res) => {
  const { start_date, end_date } = req.body; 
  // start_date: the last date currently in the grid (or a starting point)
  // end_date: the new end date up to which days should be added
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required.' });
  }
  
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  if (endDate <= startDate) {
    return res.status(400).json({ error: 'end_date must be after start_date.' });
  }
  
  // Calculate the number of days to add (excluding the start date)
  const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  // Get the list of vans from the vans table.
  db.all("SELECT id FROM vans", [], (err, vans) => {
    if (err) {
      console.error("Error fetching vans:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!vans || vans.length === 0) {
      return res.status(400).json({ error: "No vans found. Please add vans first." });
    }
    
    let recordsInserted = 0;
    let errors = [];
    const totalRecords = vans.length * diffDays;
    
    // For each van, add a blank schedule record for each new day.
    vans.forEach(van => {
      for (let i = 1; i <= diffDays; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dayStr = d.toISOString().split("T")[0];
        
        // Use INSERT OR REPLACE so that if a record already exists, it won’t create a duplicate.
        db.run(
          `INSERT OR REPLACE INTO schedule (van_id, day, assignment, status) VALUES (?, ?, ?, ?)`,
          [van.id, dayStr, "", "Blank"],
          (err) => {
            if (err) {
              errors.push(err.message);
            }
            recordsInserted++;
            if (recordsInserted === totalRecords) {
              if (errors.length > 0) {
                res.status(500).json({ error: errors.join(", ") });
              } else {
                res.json({ message: "Days added successfully." });
              }
            }
          }
        );
      }
    });
  });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
