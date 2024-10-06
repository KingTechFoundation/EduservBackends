const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const feeController = require('../controllers/feeController');

// Routes for student operations
router.post('/students', studentController.addStudent);
router.put('/students/:id/status', studentController.updateStudentStatus);
router.get('/students/onloan', studentController.getStudentsOnLoan);
router.get('/students/completed', studentController.getCompletedStudents);
router.get('/students/travelled', studentController.getTravelledStudents);
router.get('/students/travelled', studentController.getTravelledStudents);
router.get('/students/notcompleted', studentController.getNotCompletedStudents);
router.get('/students', studentController.getAllStudents);


module.exports = router;
