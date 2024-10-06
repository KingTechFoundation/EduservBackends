const db = require('../config/db');



// Add a new payment
exports.addPayment = (req, res) => {
  const { student_id, amount_paid, payment_date, payment_method } = req.body;

  if (!student_id || !amount_paid || !payment_date || !payment_method) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `
    INSERT INTO payments (student_id, amount_paid, payment_date, payment_method)
    VALUES (?, ?, ?, ?);
  `;
  db.query(
    sql,
    [student_id, amount_paid, payment_date, payment_method],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res
        .status(201)
        .json({
          message: 'Payment added successfully',
          paymentId: result.insertId,
        });
    }
  );
};


