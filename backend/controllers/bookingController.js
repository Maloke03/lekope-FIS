const Airtime = require('../models/Airtime'); // Assuming model exists

// Get all airtime bookings
const getAirtimes = async (req, res) => {
  try {
    const airtimes = await Airtime.find();
    res.json(airtimes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch airtime bookings' });
  }
};

// Get airtime by ID
const getAirtimeById = async (req, res) => {
  try {
    const airtime = await Airtime.findById(req.params.id);
    if (!airtime) {
      return res.status(404).json({ error: 'Airtime booking not found' });
    }
    res.json(airtime);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch airtime booking' });
  }
};

// Create airtime booking
const createAirtime = async (req, res) => {
  try {
    const airtime = new Airtime(req.body);
    await airtime.save();
    res.status(201).json(airtime);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create airtime booking' });
  }
};

// Update airtime booking (approve or edit)
const updateAirtime = async (req, res) => {
  try {
    const airtime = await Airtime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!airtime) {
      return res.status(404).json({ error: 'Airtime booking not found' });
    }
    res.json(airtime);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update airtime booking' });
  }
};

// Delete airtime booking
const deleteAirtime = async (req, res) => {
  try {
    const airtime = await Airtime.findByIdAndDelete(req.params.id);
    if (!airtime) {
      return res.status(404).json({ error: 'Airtime booking not found' });
    }
    res.json({ message: 'Airtime booking deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete airtime booking' });
  }
};

module.exports = {
  getAirtimes,
  getAirtimeById,
  createAirtime,
  updateAirtime,
  deleteAirtime
};