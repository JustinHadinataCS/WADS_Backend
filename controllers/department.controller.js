import Department from "../models/department.model.js";

// Create a new department
export const createDepartment = async (req, res) => {
  const { name, description, users } = req.body;

  try {
    const department = new Department({
      name,
      description,
      users,
    });

    await department.save();
    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Failed to create department' });
  }
};

// Get all user IDs associated with a specific department
export const getUsersByDepartment = async (req, res) => {
    const { departmentId } = req.params;
  
    try {
      // Find the department by ID
      const department = await Department.findById(departmentId).populate('users', '_id');
      
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
  
      // Extract the user IDs from the populated 'users' field
      const userIds = department.users.map(user => user._id);
  
      res.status(200).json({ userIds });
    } catch (error) {
      console.error('Error fetching users by department:', error);
      res.status(500).json({ message: 'Failed to fetch users by department' });
    }
  };

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('users', 'name email');
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
};

// Get a single department by ID
export const getDepartmentById = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findById(departmentId).populate('users', 'name email');
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json(department);
  } catch (error) {
    console.error('Error fetching department by ID:', error);
    res.status(500).json({ message: 'Failed to fetch department' });
  }
};

// Update department details
export const updateDepartment = async (req, res) => {
  const { departmentId } = req.params;
  const { name, description, users } = req.body;

  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    department.name = name || department.name;
    department.description = description || department.description;
    department.users = users || department.users;

    await department.save();
    res.status(200).json({ message: 'Department updated successfully', department });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Failed to update department' });
  }
};

// Delete a department
export const deleteDepartment = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const department = await Department.findByIdAndDelete(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Failed to delete department' });
  }
};
