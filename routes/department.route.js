import express from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getUsersByDepartment
} from '../controllers/department.controller.js';

const router = express.Router();

// Route to create a department
router.post('/', createDepartment);

// Route to get all user IDs under a specific department
router.get('/:departmentId/users', getUsersByDepartment);

// Route to get all departments
router.get('/', getDepartments);

// Route to get a single department by ID
router.get('/:departmentId', getDepartmentById);

// Route to update a department
router.put('/:departmentId', updateDepartment);

// Route to delete a department
router.delete('/:departmentId', deleteDepartment);

export default router;
