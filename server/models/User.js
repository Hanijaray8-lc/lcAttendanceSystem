import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { encryptFaceDescriptor, decryptFaceDescriptor } from '../utils/encryption.js';

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    dateOfBirth: {
      type: Date
    },
    username: {
      type: String,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    plainPassword: {
      type: String
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation'
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Contract', 'Intern'],
      default: 'Full Time'
    },
    shift: {
      type: String,
      default: 'General (9:00 AM - 6:00 PM)'
    },
    role: {
      type: String,
      enum: ['ADMIN', 'HR', 'TEAM_LEAD', 'EMPLOYEE', 'CEO'],
      default: 'EMPLOYEE',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE'
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    faceDescriptor: {
      type: String, // Changed from [Number] to String to store encrypted data
      default: '',
      select: false
    },
    isFaceRegistered: {
      type: Boolean,
      default: false,
      index: true
    },
    fcmTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

export const User = mongoose.model('User', userSchema);
