import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'Life Changers Ind'
    },
    companyLogo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    weekendDays: {
      type: [String],
      default: ['Saturday', 'Sunday']
    },
    officeStartTime: {
      type: String,
      default: '09:00'
    },
    officeEndTime: {
      type: String,
      default: '18:00'
    },
    emergencyEscalationMinutes: {
      type: Number,
      default: 5
    },
    allowNegativeLeaveBalance: {
      type: Boolean,
      default: false
    },
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    notificationEmailEnabled: {
      type: Boolean,
      default: true
    },
    testAttendanceCleaned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);
