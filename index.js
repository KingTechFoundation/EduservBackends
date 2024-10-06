const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const userRoutes = require('./routes/userRoutes');

const db = require('./config/db'); // Ensure there's no extra punctuation or spaces
const port = process.env.port;

dotenv.config();

const app = express();

app.use(bodyParser.json()); // To parse JSON requests
app.use(cors());

// Student routes
app.use('/api', studentRoutes);
app.use('/api', paymentRoutes);
app.use('/api', feeRoutes);

app.use('/api', userRoutes);

// Endpoint to fetch available programs
app.get('/programs', (req, res) => {
  const sql = 'SELECT id, program_name, tuition_fee FROM programs';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});

app.get('/expenses', (req, res) => {
  const { start_date, end_date } = req.query;

  let sql = 'SELECT * FROM expenses';
  const values = [];

  // If both start_date and end_date are provided, filter expenses by date range
  if (start_date && end_date) {
    sql += ' WHERE expense_date BETWEEN ? AND ?';
    values.push(start_date, end_date);
  }

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error fetching expenses:', err);
      return res.status(500).json({ error: 'Error fetching expenses' });
    }
    res.json(results);
  });
});

app.post('/courses', (req, res) => {
  const { program_name, tuition_fee } = req.body;
  const sql = `INSERT INTO programs (program_name, tuition_fee) VALUES ( ?, ?)`;
  db.query(sql, [program_name, tuition_fee], (err, result) => {
    if (err) throw err;
    res.send('program  added successfully!');
  });
});

// POST /expenses - Add a new expense
app.post('/expenses', (req, res) => {
  const { person_name, amount, expense_date, description } = req.body;

  // Validation
  if (
    !person_name ||
    typeof person_name !== 'string' ||
    person_name.length > 100
  ) {
    return res.status(400).json({ error: 'Invalid person name' });
  }
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  if (!expense_date || isNaN(Date.parse(expense_date))) {
    return res.status(400).json({ error: 'Invalid expense date' });
  }
  if (description && typeof description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' });
  }

  const sql =
    'INSERT INTO expenses (person_name, amount, expense_date, description) VALUES (?, ?, ?, ?)';
  const values = [person_name, amount, expense_date, description || ''];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting expense:', err);
      return res.status(500).json({ error: 'Error adding expense' });
    }
    res
      .status(201)
      .json({ message: 'Expense added successfully', id: results.insertId });
  });
});

// GET payment history for a student
app.get('/students/:id/paymentz', (req, res) => {
  const { id } = req.params;
  const query = `
        SELECT f.fee_name, p.payment_amount, p.payment_date, p.payment_method 
        FROM paymentz p 
        JOIN fees f ON p.fee_id = f.fee_id 
        WHERE p.student_id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// GET balance for a student
app.get('/students/:id/balance', (req, res) => {
  const { id } = req.params;
  const query = `
        SELECT f.fee_name, sfb.total_fee, sfb.amount_paid, sfb.balance_remaining
        FROM student_fee_balances sfb
        JOIN fees f ON sfb.fee_id = f.fee_id
        WHERE sfb.student_id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// POST: Make a payment for a student
app.post('/students/:id/paymentz', (req, res) => {
  const { id } = req.params;
  const { fee_id, payment_amount, payment_date, payment_method } = req.body; // Include payment_method

  // Insert payment into paymentz table
  const paymentQuery = `
        INSERT INTO paymentz (student_id, fee_id, payment_amount, payment_date, payment_method)
        VALUES (?, ?, ?, ?, ?)`;
  db.query(
    paymentQuery,
    [id, fee_id, payment_amount, payment_date, payment_method],
    (err) => {
      if (err) return res.status(500).send(err);

      // Update the balance in student_fee_balances table
      const updateBalanceQuery = `
            UPDATE student_fee_balances 
            SET amount_paid = amount_paid + ?
            WHERE student_id = ? AND fee_id = ?`;
      db.query(updateBalanceQuery, [payment_amount, id, fee_id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Payment recorded and balance updated' });
      });
    }
  );
});

app.get('/students/:studentId/payments', (req, res) => {
  const { studentId } = req.params; // Retrieve the studentId from route parameters

  // SQL query to select only the required fields
  const sql =
    'SELECT amount_paid, payment_date, payment_method FROM payments WHERE student_id = ?';

  db.query(sql, [studentId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: 'No payments found for this student' });
    }
    res.status(200).json(results); // Return payment records for the specified student
  });
});
// Error Handling for Invalid Routes
app.use((req, res) => {
  res.status(404).send({ error: 'Route not found' });
});
// Start the server

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
