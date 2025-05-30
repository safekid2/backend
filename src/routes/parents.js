const express = require('express');
const {
  getParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
} = require('../controllers/parents');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below are protected
router.use(protect);

// Only admins can access these routes
router.use(authorize('admin'));

router
  .route('/')
  .get(getParents)
  .post(createParent);

router
  .route('/:id')
  .get(getParent)
  .put(updateParent)
  .delete(deleteParent);

module.exports = router;
