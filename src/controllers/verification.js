const QRCode = require('qrcode');
const Student = require('../models/Student');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Verify QR code and log pickup
// @route   POST /api/v1/verify-pickup
// @access  Private/Staff
exports.verifyPickup = async (req, res, next) => {
  try {
    const { qrCodeData } = req.body;

    if (!qrCodeData) {
      return next(new ErrorResponse('Please provide QR code data', 400));
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrCodeData);
    } catch (err) {
      return next(new ErrorResponse('Invalid QR code data', 400));
    }

    const { studentId, parentId, code } = parsedData;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Find the parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return next(new ErrorResponse('Parent not found', 404));
    }

    // Verify the QR code
    const validQR = student.qrCodes && student.qrCodes.some(
      qr => qr.code === code && 
            qr.parent.toString() === parentId && 
            new Date(qr.expiresAt) > new Date()
    );

    if (!validQR) {
      return next(new ErrorResponse('Invalid or expired QR code', 400));
    }

    // Log the pickup
    const pickupLog = {
      student: studentId,
      parent: parentId,
      verifiedBy: req.user.id,
      timestamp: new Date()
    };

    student.pickupLogs = student.pickupLogs || [];
    student.pickupLogs.push(pickupLog);

    // Remove the used QR code
    student.qrCodes = student.qrCodes.filter(qr => qr.code !== code);
    
    await student.save();

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          grade: student.grade,
          photo: student.photo
        },
        parent: {
          id: parent._id,
          name: parent.name,
          photo: parent.photo
        },
        verifiedBy: req.user.name,
        timestamp: pickupLog.timestamp
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get pickup logs
// @route   GET /api/v1/logs
// @access  Private/Admin,Staff
exports.getPickupLogs = async (req, res, next) => {
  try {
    let query;
    
    // If user is a parent, only show their children's logs
    if (req.user.role === 'parent') {
      query = Student.find({ parents: req.user.id });
    } else {
      // For staff and admin, show all logs
      query = Student.find();
    }

    // Populate the necessary fields
    const students = await query
      .select('firstName lastName pickupLogs')
      .populate({
        path: 'pickupLogs.parent pickupLogs.verifiedBy',
        select: 'name email'
      });

    // Format the response
    const logs = [];
    students.forEach(student => {
      if (student.pickupLogs && student.pickupLogs.length > 0) {
        student.pickupLogs.forEach(log => {
          logs.push({
            student: {
              id: student._id,
              name: `${student.firstName} ${student.lastName}`
            },
            parent: {
              id: log.parent._id,
              name: log.parent.name,
              email: log.parent.email
            },
            verifiedBy: log.verifiedBy ? log.verifiedBy.name : 'System',
            timestamp: log.timestamp
          });
        });
      }
    });

    // Sort by timestamp, newest first
    logs.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
};
