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

  try {
    // Create 'expenses' table
    const createExpensesTableQuery = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INT NOT NULL AUTO_INCREMENT,
        person_name VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `;
    db.query(createExpensesTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Expenses table created or already exists.');
    });

    // Create 'programs' table
    const createProgramsTableQuery = `
      CREATE TABLE IF NOT EXISTS programs (
        id INT NOT NULL AUTO_INCREMENT,
        program_name VARCHAR(100) NOT NULL,
        tuition_fee DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (id)
      )
    `;
    db.query(createProgramsTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Programs table created or already exists.');
    });

    // Create 'students' table
    const createStudentsTableQuery = `
      CREATE TABLE IF NOT EXISTS students (
        id INT NOT NULL AUTO_INCREMENT,
        firstname VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        contacts VARCHAR(15) NOT NULL,
        status ENUM('completed','travelled','not completed') DEFAULT 'not completed',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        isonloan TINYINT(1) DEFAULT '0',
        program_id INT DEFAULT NULL,
        outstanding_balance DECIMAL(10,2) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY fk_program (program_id),
        CONSTRAINT fk_program FOREIGN KEY (program_id) REFERENCES programs (id)
      )
    `;
    db.query(createStudentsTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Students table created or already exists.');
    });

    // Create 'users' table
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        user_id INT NOT NULL,
        role ENUM('registrar','finance','director') NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        PRIMARY KEY (user_id)
      )
    `;
    db.query(createUsersTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Users table created or already exists.');
    });

    // Create 'fees' table
    const createFeesTableQuery = `
      CREATE TABLE IF NOT EXISTS fees (
        fee_id INT NOT NULL AUTO_INCREMENT,
        fee_name VARCHAR(50) NOT NULL,
        fee_amount DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (fee_id)
      )
    `;
    db.query(createFeesTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Fees table created or already exists.');
    });

    // Create 'payments' table
    const createPaymentsTableQuery = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT NOT NULL AUTO_INCREMENT,
        student_id INT NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50) DEFAULT NULL,
        fee_id INT DEFAULT NULL,
        PRIMARY KEY (id),
        KEY student_id (student_id),
        CONSTRAINT fk_fee FOREIGN KEY (fee_id) REFERENCES fees (fee_id),
        CONSTRAINT payments_ibfk_1 FOREIGN KEY (student_id) REFERENCES students (id)
      )
    `;
    db.query(createPaymentsTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Payments table created or already exists.');
    });

    // Create 'paymentz' table
    const createPaymentzTableQuery = `
      CREATE TABLE IF NOT EXISTS paymentz (
        payment_id INT NOT NULL AUTO_INCREMENT,
        student_id INT DEFAULT NULL,
        fee_id INT DEFAULT NULL,
        payment_amount DECIMAL(10,2) DEFAULT NULL,
        payment_date DATE DEFAULT NULL,
        payment_method VARCHAR(255) DEFAULT NULL,
        PRIMARY KEY (payment_id),
        KEY student_id (student_id),
        KEY fee_id (fee_id),
        CONSTRAINT paymentz_ibfk_1 FOREIGN KEY (student_id) REFERENCES students (id),
        CONSTRAINT paymentz_ibfk_2 FOREIGN KEY (fee_id) REFERENCES fees (fee_id)
      )
    `;
    db.query(createPaymentzTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Paymentz table created or already exists.');
    });

    // Create 'student_fee_balances' table
    const createStudentFeeBalancesTableQuery = `
      CREATE TABLE IF NOT EXISTS student_fee_balances (
        id INT NOT NULL AUTO_INCREMENT,
        student_id INT DEFAULT NULL,
        fee_id INT DEFAULT NULL,
        total_fee DECIMAL(10,2) DEFAULT NULL,
        amount_paid DECIMAL(10,2) DEFAULT '0.00',
        balance_remaining DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (id),
        KEY student_id (student_id),
        KEY fee_id (fee_id),
        CONSTRAINT student_fee_balances_ibfk_1 FOREIGN KEY (student_id) REFERENCES students (id),
        CONSTRAINT student_fee_balances_ibfk_2 FOREIGN KEY (fee_id) REFERENCES fees (fee_id)
      )
    `;
    db.query(createStudentFeeBalancesTableQuery, (err, result) => {
      if (err) throw err;
      console.log('Student Fee Balances table created or already exists.');
    });
  } catch (error) {
    console.error('Error executing table creation queries: ', error);
  }
});

module.exports = db;
