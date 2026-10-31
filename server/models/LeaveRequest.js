import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true
    },
    fromDate: {
      type: Date,
      required: true
    },
    toDate: {
      type: Date,
      required: true
    },
    daysCount: {
      type: Number,
      required: true
    },
    isHalfDay: {
      type: Boolean,
      default: false
    },
    halfDayType: {
      type: String,
      enum: ['FIRST_HALF', 'SECOND_HALF', 'NONE'],
      default: 'NONE'
    },
    isPermission: {
      type: Boolean,
      default: false
    },
    permissionHours: {
      type: Number,
      default: 0
    },
    permissionTimeSlot: {
      type: String,
      default: ''
    },
    isEmergency: {
      type: Boolean,
      default: false,
      index: true
    },
    reason: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String
      }
    ],
    status: {
      type: String,
      default: 'PENDING',
      index: true
    },
    escalatedAt: {
      type: Date
    },
    escalationDeadline: {
      type: Date
    },
    approvalFlow: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reviewerRole: {
          type: String
        },
        action: {
          type: String
        },
        comments: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimized queries
leaveRequestSchema.index({ user: 1, status: 1, isDeleted: 1 });
leaveRequestSchema.index({ user: 1, fromDate: -1, isDeleted: 1 });
leaveRequestSchema.index({ status: 1, isEmergency: 1, escalationDeadline: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1, status: 1 }); // For date range queries

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
