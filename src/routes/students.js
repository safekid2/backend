const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  generateParentQRCode,
} = require('../controllers/students');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below are protected
router.use(protect);

// Only admins can access these routes
router.use(authorize('admin'));

router
  .route('/')
  .get(getStudents)
  .post(createStudent);

router
  .route('/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

// QR Code generation
router.get(
  '/:studentId/parents/:parentId/qrcode',
  generateParentQRCode
);

module.exports = router;
