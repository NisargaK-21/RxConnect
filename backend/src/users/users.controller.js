const userService = require("./users.service");

const createStaff = async (req, res) => {
  try {
    const user = await userService.createStaff(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const users = await userService.getAllStaff();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const user = await userService.getStaffById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const user = await userService.updateStaff(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const response = await userService.deleteStaff(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};