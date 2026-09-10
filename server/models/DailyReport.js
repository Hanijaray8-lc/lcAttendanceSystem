import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please enter a report title or summary.'],
      trim: true
    },
    projectTitle: {
      type: String,
      default: 'Attendance Project',
      trim: true
    },
    moduleName: {
      type: String,
      default: 'General',
      trim: true
    },
    tasksCompleted: {
      type: String,
      required: [true, 'Please detail the tasks completed today.']
    },
    pendingTasks: {
      type: String,
      default: ''
    },
    blockers: {
      type: String,
      default: ''
    },
    hoursWorked: {
      type: Number,
      default: 8,
      min: [0, 'Hours worked cannot be negative.'],
      max: [24, 'Hours worked cannot exceed 24.']
    },
    workStatus: {
      type: String,
      enum: ['IN_PROGRESS', 'PENDING', 'COMPLETED'],
      default: 'IN_PROGRESS'
    },
    reportSlot: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'GENERAL'],
      default: 'GENERAL'
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'REVIEWED', 'APPROVED'],
      default: 'SUBMITTED'
    },
    feedback: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        comment: {
          type: String,
          required: true,
          trim: true
        },
        status: {
          type: String,
          enum: ['SUBMITTED', 'REVIEWED', 'APPROVED'],
          default: 'REVIEWED'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for querying user reports by date
dailyReportSchema.index({ user: 1, date: -1 });

export const DailyReport = mongoose.model('DailyReport', dailyReportSchema);
