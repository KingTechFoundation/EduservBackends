// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { loginUser, hashPasswords } = require('../controllers/userController');

// Route for user login
router.post('/login', loginUser);

// Uncomment the line below if you want to hash and store users (run once)
// router.post('/hash-passwords', hashPasswords);

module.exports = router;
