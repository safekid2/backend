const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please add a first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please add a last name'],
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    grade: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    parents: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    authorizedPickup: [
      {
        name: {
          type: String,
          required: true,
        },
        relationship: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
        qrCode: String,
        qrCodeExpires: Date,
      },
    ],
    photo: {
      type: String,
      default: 'no-photo.jpg',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate QR code for authorized pickup
studentSchema.methods.generatePickupQR = function (pickupPersonId) {
  const pickupPerson = this.authorizedPickup.id(pickupPersonId);
  
  if (!pickupPerson) {
    throw new Error('Authorized pickup person not found');
  }

  // Generate a unique code (in a real app, you might want to use a more secure method)
  const code = `${this._id}-${pickupPerson._id}-${Date.now()}`;
  
  // Set expiration (e.g., 1 hour from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  
  // In a real app, you would generate an actual QR code here
  // For now, we'll just store the code and expiration
  pickupPerson.qrCode = code;
  pickupPerson.qrCodeExpires = expires;
  
  return {
    code,
    expires,
    studentId: this._id,
    pickupPersonId: pickupPerson._id,
    studentName: `${this.firstName} ${this.lastName}`,
    pickupPersonName: pickupPerson.name,
  };
};

// Verify QR code
studentSchema.statics.verifyPickupQR = async function (code) {
  // In a real app, you would verify the QR code against the database
  // This is a simplified version
  const student = await this.findOne({
    'authorizedPickup.qrCode': code,
    'authorizedPickup.qrCodeExpires': { $gt: Date.now() },
  });

  if (!student) {
    return { isValid: false };
  }

  const pickupPerson = student.authorizedPickup.find(
    (p) => p.qrCode === code
  );

  if (!pickupPerson) {
    return { isValid: false };
  }

  return {
    isValid: true,
    student: {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
    },
    pickupPerson: {
      id: pickupPerson._id,
      name: pickupPerson.name,
      relationship: pickupPerson.relationship,
    },
  };
};

module.exports = mongoose.model('Student', studentSchema);
