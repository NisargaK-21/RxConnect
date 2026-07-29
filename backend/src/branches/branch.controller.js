const branchService = require("./branch.service");

const createBranch = async (req, res) => {
  try {
    const result = await branchService.createBranch(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllBranches = async (req, res) => {
  try {
    const result = await branchService.getAllBranches();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBranchById = async (req, res) => {
  try {
    const result = await branchService.getBranchById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const result = await branchService.updateBranch(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const result = await branchService.deleteBranch(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};