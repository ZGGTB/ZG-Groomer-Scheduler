// Server/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { format } = require("date-fns");

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

// Open (or create) the SQLite database file named ZG-Groomer-Scheduler.db in a data folder.
const dbPath = path.resolve(__dirname, "../data", "ZG-Groomer-Scheduler.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database at', dbPath);
    
    // Create events table
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TEXT
      )
    `, (err) => { if (err) console.error(err.message); });
    
    // Create event_history table
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
    
    // Alter event_history table to add new columns if missing
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

// TEST ENDPOINT WORKING
app.get('/test', (req, res) => {
  console.log('Test endpoint hit.');
  res.json({ message: 'Test endpoint working' });
});

// VAN ENDPOINTS
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

app.put('/vans/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Van name is required' });
  db.run("UPDATE vans SET name = ? WHERE id = ?", [name, id], function(err) {
    if (err) {
      console.error('Error updating van:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Van not found' });
    res.json({ message: "Van updated successfully" });
  });
});

app.delete('/vans/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM vans WHERE id = ?", [id], function(err) {
    if (err) {
      console.error('Error deleting van:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Van not found' });
    res.json({ message: "Van deleted successfully" });
  });
});

// GROOMER ENDPOINTS
app.get('/groomers', authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT * FROM groomers", [], (err, rows) => {
    if (err) {
      console.error('Error fetching groomers:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const parsedRows = rows.map(row => (Object.assign({}, row, {
      schedule: row.schedule ? JSON.parse(row.schedule) : {}
    })));
    console.log('Groomers List Return:', rows);
    res.json(parsedRows);
  });
});

app.put('/groomers/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { name, schedule } = req.body;
  if (!name || !schedule) return res.status(400).json({ error: 'Name and schedule are required.' });
  const scheduleStr = typeof schedule === 'object' ? JSON.stringify(schedule) : schedule;
  db.run("UPDATE groomers SET name = ?, schedule = ? WHERE id = ?", [name, scheduleStr, id], function(err) {
    if (err) {
      console.error("Error updating groomer:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Groomer not found' });
    res.json({ message: "Groomer updated successfully" });
  });
});

// POST endpoint for adding a new groomer
app.post('/groomers', (req, res) => {
  const { id, name, schedule, inactive } = req.body;
  if (!name || !schedule) {
    return res.status(400).json({ error: "Name and schedule are required" });
  }
  // You might want to use a generated id instead of the client-sent id.
  db.run(
    "INSERT INTO groomers (id, name, schedule) VALUES (?, ?, ?)",
    [id, name, JSON.stringify(schedule)],
    function(err) {
      if (err) {
        console.error("Error inserting groomer:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Groomer added successfully", id });
    }
  );
});


// POST /create-groomer-normal-schedule
app.post(
  "/create-groomer-normal-schedule",
  authenticateToken,
  authorizeAdmin,
  (req, res) => {
    const { groomer_id, start_date } = req.body;
    if (!groomer_id || !start_date) {
      return res
        .status(400)
        .json({ error: "groomer_id and start_date are required." });
    }
    // Look up the groomer from the groomers table.
    db.get("SELECT * FROM groomers WHERE id = ?", [groomer_id], (err, groomer) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!groomer) {
        return res.status(404).json({ error: "Groomer not found." });
      }
      // Parse the groomer's normal schedule.
      let scheduleObj = {};
      try {
        scheduleObj =
          typeof groomer.schedule === "string"
            ? JSON.parse(groomer.schedule)
            : groomer.schedule || {};
      } catch (e) {
        return res
          .status(500)
          .json({ error: "Failed to parse groomer schedule." });
      }
      // Expect scheduleObj keys to be full day names, e.g. "Sunday", "Monday", etc.
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      // Determine the last day in the grid by querying the schedule table.
      db.get("SELECT MAX(day) as last_day FROM schedule", [], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const lastDay = row.last_day;
        if (!lastDay) {
          return res
            .status(400)
            .json({ error: "No schedule records found to determine last day." });
        }
        // Parse start_date and lastDay as local dates.
        const [year, month, day] = start_date.split("-");
        const start = new Date(year, month - 1, day);
        const [lyear, lmonth, lday] = lastDay.split("-");
        const end = new Date(lyear, lmonth - 1, lday);

        let daysToInsert = [];
        let current = new Date(start);
        while (current <= end) {
          const currentDayName = dayNames[current.getDay()]; // e.g. "Sunday"
          // Check if the groomer’s schedule has an entry for this day.
          if (scheduleObj[currentDayName] && scheduleObj[currentDayName] !== "") {
            // Use date-fns format to create a local date string in "yyyy-MM-dd" format.
            const dateStr = format(current, "yyyy-MM-dd");
            daysToInsert.push({ van_id: scheduleObj[currentDayName], date: dateStr });
          }
          current.setDate(current.getDate() + 1);
        }
        const totalToInsert = daysToInsert.length;
        if (totalToInsert === 0) {
          return res.status(400).json({
            error:
              "No scheduled days found for this groomer between the selected dates.",
          });
        }
        let completed = 0;
        let errors = [];
        daysToInsert.forEach(({ van_id, date }) => {
          // Insert (or replace) a schedule cell for this van and date.
          db.run(
            `INSERT OR REPLACE INTO schedule (van_id, day, assignment, status) VALUES (?, ?, ?, ?)`,
            [van_id, date, groomer.name, "Scheduled"],
            (err) => {
              if (err) {
                errors.push(err.message);
              }
              // Insert a corresponding event_history record.
              const timestamp = new Date().toISOString();
              db.run(
                `INSERT INTO event_history (cell_id, action, date, timestamp, name, status, note, user) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  `${van_id}-${date}`,
                  "create",
                  date,
                  timestamp,
                  groomer.name,
                  "Scheduled",
                  "Initial Assignment",
                  "Utility: Create Groomer Normal Schedule",
                ],
                function (err2) {
                  if (err2) {
                    errors.push(err2.message);
                  }
                  completed++;
                  if (completed === totalToInsert) {
                    if (errors.length > 0) {
                      return res.status(500).json({ error: errors.join(", ") });
                    }
                    return res.json({
                      message: `Successfully created ${totalToInsert} schedule records for groomer ${groomer.name}.`,
                    });
                  }
                }
              );
            }
          );
        });
      });
    });
  }
);


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

// SCHEDULE ENDPOINTS
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

app.put('/schedule', authenticateToken, authorizeAdmin, (req, res) => {
  const scheduleData = req.body;
  if (!Array.isArray(scheduleData)) return res.status(400).json({ error: "Invalid schedule data format. Expected an array." });
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
          if (errorOccurred) return res.status(500).json({ error: "Error updating schedule." });
          res.json({ message: "Schedule updated successfully." });
        }
      }
    );
  });
});

// MODELING ENDPOINTS
app.get('/model-schedule', authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT * FROM model_schedule", [], (err, rows) => {
    if (err) {
      console.error("Error fetching model schedule:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log("GET /model-schedule returns:", rows);
    res.json(rows);
  });
});

app.put('/model-schedule', authenticateToken, authorizeAdmin, (req, res) => {
  const scheduleData = req.body;
  if (!Array.isArray(scheduleData)) return res.status(400).json({ error: "Invalid schedule data format. Expected an array." });
  let completed = 0;
  let errorOccurred = false;
  scheduleData.forEach((cell) => {
    const { van_id, day, assignment, status } = cell;
    db.run(
      `INSERT OR REPLACE INTO model_schedule (van_id, day, assignment, status) VALUES (?, ?, ?, ?)`,
      [van_id, day, assignment, status],
      (err) => {
        if (err) {
          console.error("Error updating model schedule cell:", err.message);
          errorOccurred = true;
        }
        completed++;
        if (completed === scheduleData.length) {
          if (errorOccurred) {
            return res.status(500).json({ error: "Error updating model schedule." });
          }
          res.json({ message: "Model schedule updated successfully." });
        }
      }
    );
  });
});

app.get('/model-groomers', authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT * FROM model_groomers", [], (err, rows) => {
    if (err) {
      console.error("Error fetching model groomers:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
    console.log("Fetched model-groomers:", rows);
  });
});

app.get('/model-vans', authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT * FROM model_vans", [], (err, rows) => {
    if (err) {
      console.error("Error fetching model vans:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
    console.log("Fetched model-vans:", rows);
  });
});

// CELL HISTORY ENDPOINTS
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
      res.json(rows);
    }
  );
});

// EVENT HISTORY ENDPOINT
app.get('/event-history', authenticateToken, (req, res) => {
  console.log("GET /event-history query:", req.query);
  const { start_date, end_date, status } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ error: "start_date and end_date are required." });
  }
  
  let query = "SELECT * FROM event_history WHERE date BETWEEN ? AND ?";
  const params = [start_date, end_date];
  if (status && status !== "All") {
    query += " AND status = ?";
    params.push(status);
  }
  query += " ORDER BY timestamp DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching event history:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log("Event history rows:", rows);
    res.json(rows);
  });
});

// USER MANAGEMENT ENDPOINTS
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
      return res.status(500).json({ error: 'Internal server error. ' + err.message });
    }
    if (!user) {
      console.log(`User not found for username: ${username}`);
      return res.status(401).json({ error: 'User not found' });
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

// ********************
// Static file serving configuration for React
// ********************

// Serve static files from the React app's build folder
// Serve static files from the React app's build folder (located one level up)
app.use(express.static(path.join(__dirname, '../build')));

// For any request that doesn't match an API route, send back the React index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
})
;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
