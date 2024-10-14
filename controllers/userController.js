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
      password: '2222',
    },
    {
      userId: 25293,
      role: 'director',
      password: '5555',
    },
  ];

  for (let user of users) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    // Check if user already exists in the database
    const checkUserSql = `SELECT * FROM users WHERE user_id = ?`;
    db.query(checkUserSql, [user.userId], (err, results) => {
      if (err) {
        console.error(`Error checking user ${user.role}:`, err);
        return;
      }

      if (results.length > 0) {
        console.log(
          `User ${user.role} with user_id ${user.userId} already exists. Skipping insertion.`
        );
      } else {
        // Insert new user into the database
        const insertUserSql = `INSERT INTO users (user_id, role, hashed_password) VALUES (?, ?, ?)`;
        db.query(
          insertUserSql,
          [user.userId, user.role, hashedPassword],
          (err, result) => {
            if (err) {
              console.error(`Error inserting user ${user.role}:`, err);
            } else {
              console.log(
                `Hashed password for ${user.role} inserted successfully.`
              );
            }
          }
        );
      }
    });
  }
};

// Uncomment the line below to run it when needed
hashPasswords();

const loginUser = async (req, res) => {
  const { user_id, password, role } = req.body;

  if (!user_id || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required' });
  }

  // Query user from the database
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
      'musinguziverelian23', // Replace with your own secret in production
      { expiresIn: '1h' }
    );

    res.json({ success: true, token });
  });
};

module.exports = {
  hashPasswords,
  loginUser,
};
