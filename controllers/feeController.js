const db = require('../config/db');

// Get all fees
exports.getAllFees = (req, res) => {
  const sql = 'SELECT * FROM fees';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

// Add a new fee
exports.addFee = (req, res) => {
  const { fee_name, fee_amount } = req.body;

  if (
    !fee_name ||
    typeof fee_name !== 'string' ||
    !fee_amount ||
    typeof fee_amount !== 'number'
  ) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  const sql = 'INSERT INTO fees (fee_name, fee_amount) VALUES (?, ?)';
  db.query(sql, [fee_name, fee_amount], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res
      .status(201)
      .json({ message: 'Fee added successfully', fee_id: results.insertId });
  });
};
