const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json()); // To parse JSON requests
app.use(cors());

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // replace with your MySQL username
  password: 'musinguziverelian23', // replace with your MySQL password
  database: 'renew', // replace with your MySQL database name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to the database...');
});

// Route to POST new student data
app.post('/students', (req, res) => {
  const { firstname, lastname, contacts, status, isonloan, program_id } =
    req.body;

  // Validate input
  if (!firstname || !lastname || !contacts || !program_id) {
    return res.status(400).json({
      error: 'Firstname, Lastname, Contacts, and Program are required',
    });
  }

  // Fetch the tuition fee for the selected program
  const getTuitionFeeSql = 'SELECT tuition_fee FROM programs WHERE id = ?';

  db.query(getTuitionFeeSql, [program_id], (err, programResult) => {
    if (err) {
      return res
        .status(500)
        .json({ error: 'Database error while fetching tuition fee' });
    }

    if (programResult.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const tuition_fee = programResult[0].tuition_fee;

    // Prepare new student data with outstanding balance set to tuition fee
    const newStudent = {
      firstname,
      lastname,
      contacts,
      status: status || 'not completed',
      isonloan: isonloan || false, // Default to false if not provided
      program_id, // Assign the program_id
      outstanding_balance: tuition_fee, // Set the outstanding balance to the tuition fee
    };

    // Insert the new student into the database
    const insertStudentSql = 'INSERT INTO students SET ?';

    db.query(insertStudentSql, newStudent, (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ error: 'Database error while inserting student' });
      }

      res.status(201).json({
        message: 'Student added successfully',
        studentId: result.insertId,
        tuition_fee, // Return tuition fee for frontend use
      });
    });
  });
});

// Route to UPDATE student status
app.put('/students/:id/status', (req, res) => {
  const studentId = req.params.id;
  const { status } = req.body;

  // Validate the status input
  if (!['completed', 'travelled', 'not completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql =
    'UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.query(sql, [status, studentId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json({ message: 'Student status updated successfully' });
  });
});

// Route to GET students who are on loan
app.get('/students/onloan', (req, res) => {
  const sql = 'SELECT * FROM students WHERE isonloan = true';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});

// Get students who have completed
app.get('/students/completed', (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.firstname,
      s.lastname,
      s.contacts,
      s.status,
      s.isonloan,
      p.program_name,
      p.tuition_fee,
      IFNULL(SUM(pm.amount_paid), 0) AS total_paid, -- Total amount paid by the student
      (p.tuition_fee - IFNULL(SUM(pm.amount_paid), 0)) AS balance -- Outstanding balance
    FROM 
      students s
    JOIN 
      programs p ON s.program_id = p.id
    LEFT JOIN 
      payments pm ON s.id = pm.student_id -- LEFT JOIN to include students who have not made payments yet
    WHERE 
      s.status = 'completed' -- Filter for not completed students
    GROUP BY 
      s.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});

// Get students who have travelled
app.get('/students/travelled', (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.firstname,
      s.lastname,
      s.contacts,
      s.status,
      s.isonloan,
      p.program_name,
      p.tuition_fee,
      IFNULL(SUM(pm.amount_paid), 0) AS total_paid, -- Total amount paid by the student
      (p.tuition_fee - IFNULL(SUM(pm.amount_paid), 0)) AS balance -- Outstanding balance
    FROM 
      students s
    JOIN 
      programs p ON s.program_id = p.id
    LEFT JOIN 
      payments pm ON s.id = pm.student_id -- LEFT JOIN to include students who have not made payments yet
    WHERE 
      s.status = 'travelled' -- Filter for not completed students
    GROUP BY 
      s.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});

// Get students who have travelled
// Route to GET all students with program, tuition, and balance
app.get('/students', (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.firstname,
      s.lastname,
      s.contacts,
      s.status,
      s.isonloan,
      p.program_name,
      p.tuition_fee,
      IFNULL(SUM(pm.amount_paid), 0) AS total_paid, -- Total amount paid by the student
      (p.tuition_fee - IFNULL(SUM(pm.amount_paid), 0)) AS balance -- Outstanding balance
    FROM 
      students s
    JOIN 
      programs p ON s.program_id = p.id
    LEFT JOIN 
      payments pm ON s.id = pm.student_id -- LEFT JOIN to include students who have not made payments yet
    GROUP BY 
      s.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});

// Get payments for a specific student by their ID
// Get payments for a specific student by their ID
app.get('/payments/:studentId', (req, res) => {
  const studentId = req.params.studentId; // Get student ID from request parameters

  const sql = `
    SELECT 
      pm.id,
      pm.amount_paid,
      pm.payment_date,
      pm.payment_method
    FROM 
      payments pm
    WHERE 
      pm.student_id = ?; -- Use parameterized query to prevent SQL injection
  `;

  db.query(sql, [studentId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results); // Return the list of payments for the specified student
  });
});

app.post('/payments', (req, res) => {
  const { student_id, amount_paid, payment_date, payment_method } = req.body;

  // Validate required fields
  if (!student_id || !amount_paid || !payment_date || !payment_method) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // SQL query to insert the payment record
  const sql = `
    INSERT INTO payments (student_id, amount_paid, payment_date, payment_method)
    VALUES (?, ?, ?, ?);
  `;

  db.query(
    sql,
    [student_id, amount_paid, payment_date, payment_method],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Return success response
      res.status(201).json({
        message: 'Payment added successfully',
        paymentId: result.insertId,
      });
    }
  );
});

// Get students who have not completed
app.get('/students/notcompleted', (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.firstname,
      s.lastname,
      s.contacts,
      s.status,
      s.isonloan,
      p.program_name,
      p.tuition_fee,
      IFNULL(SUM(pm.amount_paid), 0) AS total_paid, -- Total amount paid by the student
      (p.tuition_fee - IFNULL(SUM(pm.amount_paid), 0)) AS balance -- Outstanding balance
    FROM 
      students s
    JOIN 
      programs p ON s.program_id = p.id
    LEFT JOIN 
      payments pm ON s.id = pm.student_id -- LEFT JOIN to include students who have not made payments yet
    WHERE 
      s.status = 'not completed' -- Filter for not completed students
    GROUP BY 
      s.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});

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

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
