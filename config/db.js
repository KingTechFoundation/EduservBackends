const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err.stack);
    return;
  }
  console.log('Connected to MySQL DB');
});

module.exports = db;
