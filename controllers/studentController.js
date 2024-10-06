const db = require('../config/db');

// Add new student
exports.addStudent = (req, res) => {
  const { firstname, lastname, contacts, status, isonloan, program_id } =
    req.body;

  if (!firstname || !lastname || !contacts || !program_id) {
    return res.status(400).json({
      error: 'Firstname, Lastname, Contacts, and Program are required',
    });
  }

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

    const newStudent = {
      firstname,
      lastname,
      contacts,
      status: status || 'not completed',
      isonloan: isonloan || false,
      program_id,
      outstanding_balance: tuition_fee,
    };

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
        tuition_fee,
      });
    });
  });
};




// Update student status
exports.updateStudentStatus = (req, res) => {
  const studentId = req.params.id;
  const { status } = req.body;

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
};

// Get students on loan
exports.getStudentsOnLoan = (req, res) => {
  const sql = 'SELECT * FROM students WHERE isonloan = true';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};

// Get students who have completed
exports.getCompletedStudents = (req, res) => {
  const sql = `
    SELECT 
      s.id, s.firstname, s.lastname, s.contacts, s.status, s.isonloan, 
      p.program_name, p.tuition_fee, 
      IFNULL(SUM(pm.amount_paid), 0) AS total_paid, 
      (p.tuition_fee - IFNULL(SUM(pm.amount_paid), 0)) AS balance
    FROM students s
    JOIN programs p ON s.program_id = p.id
    LEFT JOIN payments pm ON s.id = pm.student_id
    WHERE s.status = 'completed'
    GROUP BY s.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};

// Get students who have travelled
exports.getTravelledStudents = (req, res) => {
  const sql = `
    SELECT 
      s.id, s.firstname, s.lastname, s.contacts, s.status, s.isonloan, 
      p.program_name, p.tuition_fee, 
      IFNULL(SUM(pm.amount_paid), 0) AS total_paid, 
      (p.tuition_fee - IFNULL(SUM(pm.amount_paid), 0)) AS balance
    FROM students s
    JOIN programs p ON s.program_id = p.id
    LEFT JOIN payments pm ON s.id = pm.student_id
    WHERE s.status = 'travelled'
    GROUP BY s.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};


exports.getNotCompletedStudents =  (req, res) => {
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
};




// Get all students with program, tuition, and balance
exports.getAllStudents = (req, res) => {
  const sql = `
    SELECT 
      s.id, s.firstname, s.lastname, s.contacts, s.status, s.isonloan, 
      p.program_name, p.tuition_fee, 
      IFNULL(SUM(pm.amount_paid), 0) AS total_paid, 
      (p.tuition_fee - IFNULL(SUM(pm.amount_paid), 0)) AS balance
    FROM students s
    JOIN programs p ON s.program_id = p.id
    LEFT JOIN payments pm ON s.id = pm.student_id
    GROUP BY s.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};
