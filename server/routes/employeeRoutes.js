import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  registerFaceLock,
  removeFaceLock
} from '../controllers/employeeController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', restrictTo('CEO', 'ADMIN', 'HR'), createEmployee);
router.put('/:id', restrictTo('CEO', 'ADMIN', 'HR'), updateEmployee);
router.patch('/:id/status', restrictTo('CEO', 'ADMIN', 'HR'), toggleEmployeeStatus);
router.delete('/:id', restrictTo('CEO', 'ADMIN', 'HR'), deleteEmployee);
router.post('/:id/face-lock', restrictTo('CEO', 'ADMIN', 'HR'), registerFaceLock);
router.delete('/:id/face-lock', restrictTo('CEO', 'ADMIN', 'HR'), removeFaceLock);

export default router;
