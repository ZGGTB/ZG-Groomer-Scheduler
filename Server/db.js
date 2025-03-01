// Server/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for your SQLite database file.
const dbPath = path.resolve(__dirname, 'ZG-Grooming-Scheduler.db');

// Open (or create) the database.
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

module.exports = db;
