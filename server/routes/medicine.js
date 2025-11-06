const express = require('express');
const router = express.Router();
const csvLoader = require('../services/csvLoader');
const substituteEngine = require('../services/substituteEngine');

// Search medicines by name
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = csvLoader.searchMedicines(query, parseInt(limit));

    res.json({
      success: true,
      results,
      total: results.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medicine details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = csvLoader.getMedicineById(id);
    
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({
      success: true,
      medicine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medicine substitutes
router.get('/:id/substitutes', async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = csvLoader.getMedicineById(id);
    
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const substitutes = await substituteEngine.findSubstitutes(medicine);
    
    res.json({
      success: true,
      substitutes,
      originalMedicine: medicine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular medicines
router.get('/popular/list', async (req, res) => {
  try {
    const popularMedicines = csvLoader.getPopularMedicines(20);

    res.json({
      success: true,
      medicines: popularMedicines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;