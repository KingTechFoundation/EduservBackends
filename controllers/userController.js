// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Hash passwords and store them in MySQL users table
const hashPasswords = async () => {
  const users = [
    {
      userId: 25291,
      role: 'registrar',
      password: '1111',
    },
    {
      userId: 25292,
      role: 'finance',
      password: 'financePassword',
    },
    {
      userId: 25293,
      role: 'director',
      password: 'directorPassword',
    },
  ];

  for (let user of users) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    // Insert into database
    const sql = `INSERT INTO users (user_id, role, hashed_password) VALUES (?, ?, ?)`;
    db.query(sql, [user.userId, user.role, hashedPassword], (err, result) => {
      if (err) {
        console.error(`Error inserting user ${user.role}:`, err);
      } else {
        console.log(`Hashed password for ${user.role} inserted successfully.`);
      }
    });
  }
};

// Call hashPasswords to hash and store users (run once)
// Uncomment the line below to run it when needed
hashPasswords();

const loginUser = async (req, res) => {
  const { user_id, password, role } = req.body;

  if (!user_id || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required' });
  }

  // Query user from database
  const sql = `SELECT * FROM users WHERE user_id = ? AND role = ?`;
  db.query(sql, [user_id, role], async (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: 'Database error' });
    }

    const user = results[0]; // Assuming user_id is unique

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid user ID or role' });
    }

    // Compare entered password with hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.hashed_password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      'musinguziverelian23',
      { expiresIn: '1h' }
    );

    res.json({ success: true, token });
  });
};

module.exports = {
  hashPasswords,
  loginUser,
};
