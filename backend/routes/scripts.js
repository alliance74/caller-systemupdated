const express = require('express');
const router = express.Router();
const Script = require('../models/Script');

// Get all scripts
router.get('/', async (req, res) => {
  try {
    const scripts = await Script.find().sort({ createdAt: -1 });
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get script by ID
router.get('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new script
router.post('/', async (req, res) => {
  try {
    const script = new Script(req.body);
    await script.save();
    res.status(201).json(script);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update script
router.put('/:id', async (req, res) => {
  try {
    const script = await Script.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json(script);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete script
router.delete('/:id', async (req, res) => {
  try {
    const script = await Script.findByIdAndDelete(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;