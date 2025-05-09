import express from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  addUserToDepartment,
  updateDepartment,
  deleteDepartment,
  getUsersByDepartment
} from '../controllers/department.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Route to create a department
router.post('/', protect, admin, createDepartment);

// Route to get all user IDs under a specific department
router.get('/:departmentId/users', protect, admin, getUsersByDepartment);

// Route to get all departments
router.get('/', protect, admin, getDepartments);

// Route to get a single department by ID
router.get('/:departmentId', protect, admin, getDepartmentById);

// Route to add user to a department
router.post('/:departmentId/add-user', protect, admin, addUserToDepartment);

// Route to update a department
router.put('/:departmentId', protect, admin, updateDepartment);

// Route to delete a department
router.delete('/:departmentId', protect, admin, deleteDepartment);

export default router;
