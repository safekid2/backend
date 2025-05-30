const User = require('../models/User');
const Student = require('../models/Student');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all parents
// @route   GET /api/v1/parents
// @access  Private/Admin
exports.getParents = async (req, res, next) => {
  try {
    const parents = await User.find({ role: 'parent' }).select('-password');
    
    res.status(200).json({
      success: true,
      count: parents.length,
      data: parents,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single parent
// @route   GET /api/v1/parents/:id
// @access  Private
exports.getParent = async (req, res, next) => {
  try {
    const parent = await User.findById(req.params.id)
      .select('-password')
      .populate('children');

    if (!parent) {
      return next(
        new ErrorResponse(`Parent not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is the parent or admin
    if (parent._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `Not authorized to access this parent's information`,
          401
        )
      );
    }

    res.status(200).json({
      success: true,
      data: parent,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new parent
// @route   POST /api/v1/parents
// @access  Private/Admin
exports.createParent = async (req, res, next) => {
  try {
    // Set role to parent
    req.body.role = 'parent';
    
    // Create parent
    const parent = await User.create(req.body);

    // If children are provided, link them to the parent
    if (req.body.children && req.body.children.length > 0) {
      await Promise.all(
        req.body.children.map(async (childId) => {
          await Student.findByIdAndUpdate(
            childId,
            { $addToSet: { parents: parent._id } }
          );
        })
      );
    }

    // Remove password from response
    parent.password = undefined;

    res.status(201).json({
      success: true,
      data: parent,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update parent
// @route   PUT /api/v1/parents/:id
// @access  Private
exports.updateParent = async (req, res, next) => {
  try {
    let parent = await User.findById(req.params.id);

    if (!parent) {
      return next(
        new ErrorResponse(`Parent not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is the parent or admin
    if (parent._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `Not authorized to update this parent's information`,
          401
        )
      );
    }

    // Remove role from req.body to prevent role changes
    if (req.body.role) {
      delete req.body.role;
    }

    // Update parent
    parent = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    // Update parent-child relationships if children are being updated
    if (req.body.children) {
      // Remove parent from all children first
      await Student.updateMany(
        { parents: parent._id },
        { $pull: { parents: parent._id } }
      );

      // Add parent to new children
      await Promise.all(
        req.body.children.map(async (childId) => {
          await Student.findByIdAndUpdate(
            childId,
            { $addToSet: { parents: parent._id } },
            { new: true, runValidators: true }
          );
        })
      );
    }

    res.status(200).json({
      success: true,
      data: parent,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete parent
// @route   DELETE /api/v1/parents/:id
// @access  Private/Admin
exports.deleteParent = async (req, res, next) => {
  try {
    const parent = await User.findById(req.params.id);

    if (!parent) {
      return next(
        new ErrorResponse(`Parent not found with id of ${req.params.id}`, 404)
      );
    }

    // Remove parent from children
    await Student.updateMany(
      { parents: parent._id },
      { $pull: { parents: parent._id } }
    );

    await parent.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
