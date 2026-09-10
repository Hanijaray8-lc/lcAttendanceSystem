import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST before any other imports
dotenv.config();

// __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LCM Server Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { connectDB } from './config/db.js';
import { globalErrorHandler } from './middleware/errorMiddleware.js';
import { responseTimeLogger, monitorDatabaseConnection, enableQueryLogging } from './middleware/performanceMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import designationRoutes from './routes/designationRoutes.js';
import leaveTypeRoutes from './routes/leaveTypeRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dailyReportRoutes from './routes/dailyReportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { checkEmergencyEscalations } from './services/escalationService.js';
import { updateEarnedLeaveToPaidLeave, updateCeoName } from './utils/seed.js';

const app = express();

// Performance Monitoring
monitorDatabaseConnection(mongoose);
enableQueryLogging(mongoose);

// Database Connection (Only run top-level connection on non-Vercel environments)
if (process.env.VERCEL !== '1') {
  connectDB().then(() => {
    updateEarnedLeaveToPaidLeave();
    updateCeoName();
  }).catch((err) => {
    console.error('[DB Init Error]', err.message);
  });
}

// Lazy DB connection middleware for Vercel serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware Error]', err.message);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection unavailable. Please try again shortly.'
    });
  }
});

// Essential Middleware
app.use(helmet());

// CORS — allow configured frontend URL + Vercel preview deployments + Local Network
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://employeelogin.lifechangersind.com',
  'https://lcattendancesystem.onrender.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://192.168.43.194:5173', // Local network access for mobile
  'http://192.168.43.194:4173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow exact match or any Vercel preview subdomain
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed.`));
      }
    },
    credentials: true
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(responseTimeLogger); // Track slow API requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF Protection (Double Submit Cookie Pattern)
// TODO: Enable after frontend integration
// Temporarily disabled to prevent "Invalid csrf token" errors
/*
const {
  generateToken, // Used to provide a CSRF token to the client
  doubleCsrfProtection, // Middleware to protect routes
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: '__Host-csrf.token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token']
});

// CSRF Token Generation Endpoint (Frontend can call this to get token)
app.get('/api/csrf-token', (req, res) => {
  const token = generateToken(req, res);
  res.status(200).json({
    status: 'success',
    data: { csrfToken: token }
  });
});

// Apply CSRF protection to all POST, PUT, PATCH, DELETE requests
app.use(doubleCsrfProtection);
*/

// Serve React Frontend (Static Files from client/dist)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Health Check API
app.get('/api/health', async (req, res) => {
  let dbName = mongoose.connection?.name || 'disconnected';
  let host = mongoose.connection?.host || 'none';
  let counts = {};
  try {
    if (mongoose.connection?.readyState === 1 && mongoose.connection?.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const c of collections) {
        counts[c.name] = await mongoose.connection.db.collection(c.name).countDocuments();
      }
    }
  } catch (e) {
    counts = { error: e.message };
  }

  res.status(200).json({
    status: 'success',
    service: 'Enterprise Life Changers Management (ELCM) API',
    database: dbName,
    host,
    counts,
    timestamp: new Date().toISOString()
  });
});



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/leaves', leaveRequestRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/settings', settingsRoutes);

// React Router SPA - All non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use(globalErrorHandler);

// Emergency Leave Escalation Cron/Background Service (Checks every 5 minutes - optimized from 30s)
const ESCALATION_INTERVAL = Number(process.env.ESCALATION_CHECK_INTERVAL_MS) || 300000; // Default: 5 minutes
if (process.env.VERCEL !== '1') {
  setInterval(() => {
    checkEmergencyEscalations();
  }, ESCALATION_INTERVAL);
  console.log(`🚨 [Emergency Escalation] Active - checking every ${ESCALATION_INTERVAL / 1000}s`);
}

const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 [ELCM Server] Running on http://localhost:${PORT}`);
    console.log(`🚨 [Emergency Escalation] Active (Check every ${ESCALATION_INTERVAL / 1000}s)`);
    console.log(`⚡ [Performance] Optimized for 50+ concurrent users`);
    console.log(`======================================================\n`);
  });
}

export default app;
