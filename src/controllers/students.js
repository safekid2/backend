const Student = require('../models/Student');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const QRCode = require('qrcode');

// @desc    Get all students
// @route   GET /api/v1/students
// @access  Private/Admin
exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.find().populate('parents', 'name email phone');
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single student
// @route   GET /api/v1/students/:id
// @access  Private
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('parents', 'name email phone');

    if (!student) {
      return next(
        new ErrorResponse(`Student not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is the parent of the student or admin
    if (
      !student.parents.some(parent => parent._id.toString() === req.user.id) &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `Not authorized to access this student`,
          401
        )
      );
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new student
// @route   POST /api/v1/students
// @access  Private/Admin
exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    
    // If parent IDs are provided, link them to the student
    if (req.body.parents && req.body.parents.length > 0) {
      await Promise.all(
        req.body.parents.map(async (parentId) => {
          await User.findByIdAndUpdate(
            parentId,
            { $addToSet: { children: student._id } }
          );
        })
      );
    }

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student
// @route   PUT /api/v1/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res, next) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return next(
        new ErrorResponse(`Student not found with id of ${req.params.id}`, 404)
      );
    }

    // Update student
    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Update parent-child relationships if parents are being updated
    if (req.body.parents) {
      // Remove student from all parents first
      await User.updateMany(
        { children: student._id },
        { $pull: { children: student._id } }
      );

      // Add student to new parents
      await Promise.all(
        req.body.parents.map(async (parentId) => {
          await User.findByIdAndUpdate(
            parentId,
            { $addToSet: { children: student._id } }
          );
        })
      );
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete student
// @route   DELETE /api/v1/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return next(
        new ErrorResponse(`Student not found with id of ${req.params.id}`, 404)
      );
    }

    // Remove student from parents
    await User.updateMany(
      { children: student._id },
      { $pull: { children: student._id } }
    );

    await student.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate QR code for parent
// @route   GET /api/v1/students/:studentId/parents/:parentId/qrcode
// @access  Private
exports.generateParentQRCode = async (req, res, next) => {
  try {
    const { studentId, parentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return next(
        new ErrorResponse(`Student not found with id of ${studentId}`, 404)
      );
    }

    // Check if the parent is associated with the student
    const isParent = student.parents.some(parent => parent.toString() === parentId);
    if (!isParent && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`Not authorized to generate QR code for this student`, 403)
      );
    }

    // Generate a unique code
    const code = `${studentId}-${parentId}-${Date.now()}`;
    const qrData = {
      studentId,
      parentId,
      code,
      timestamp: Date.now()
    };

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Store the code in the database
    student.qrCodes = student.qrCodes || [];
    student.qrCodes.push({
      code,
      parent: parentId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    await student.save();

    res.status(200).json({
      success: true,
      data: {
        qrCode,
        expiresAt: student.qrCodes[student.qrCodes.length - 1].expiresAt
      }
    });
  } catch (err) {
    next(err);
  }
};
