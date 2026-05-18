const AdContract = require('../models/AdContract'); // Assuming model exists

// Get all ad contracts
const getAdContracts = async (req, res) => {
  try {
    const contracts = await AdContract.find();
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ad contracts' });
  }
};

// Get ad contract by ID
const getAdContractById = async (req, res) => {
  try {
    const contract = await AdContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Ad contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ad contract' });
  }
};

// Create ad contract
const createAdContract = async (req, res) => {
  try {
    const contract = new AdContract(req.body);
    await contract.save();
    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ad contract' });
  }
};

// Update ad contract (approve or edit)
const updateAdContract = async (req, res) => {
  try {
    const contract = await AdContract.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contract) {
      return res.status(404).json({ error: 'Ad contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ad contract' });
  }
};

// Delete ad contract
const deleteAdContract = async (req, res) => {
  try {
    const contract = await AdContract.findByIdAndDelete(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Ad contract not found' });
    }
    res.json({ message: 'Ad contract deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ad contract' });
  }
};

module.exports = {
  getAdContracts,
  getAdContractById,
  createAdContract,
  updateAdContract,
  deleteAdContract
};