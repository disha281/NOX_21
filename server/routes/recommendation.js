const express = require('express');
const router = express.Router();
const recommendationEngine = require('../services/recommendationEngine');
const { pharmacies } = require('../data/pharmacies');
const csvLoader = require('../services/csvLoader');

// Get AI-powered pharmacy recommendations
router.post('/pharmacy', async (req, res) => {
  try {
    const { medicineId, userLocation, preferences = {} } = req.body;
    
    if (!medicineId || !userLocation) {
      return res.status(400).json({ 
        error: 'Medicine ID and user location are required' 
      });
    }

    const medicine = csvLoader.getMedicineById(medicineId);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const recommendations = await recommendationEngine.getPharmacyRecommendations({
      medicine,
      userLocation,
      preferences
    });

    res.json({
      success: true,
      recommendations,
      medicine: {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName
      },
      criteria: {
        priceWeight: preferences.priceWeight || 0.4,
        distanceWeight: preferences.distanceWeight || 0.4,
        availabilityWeight: preferences.availabilityWeight || 0.2
      }
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get best pharmacy recommendation
router.post('/best-pharmacy', async (req, res) => {
  try {
    const { medicineId, userLocation, urgency = 'normal' } = req.body;
    
    if (!medicineId || !userLocation) {
      return res.status(400).json({ 
        error: 'Medicine ID and user location are required' 
      });
    }

    const medicine = csvLoader.getMedicineById(medicineId);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Adjust weights based on urgency
    let preferences = {};
    switch (urgency) {
      case 'emergency':
        preferences = { priceWeight: 0.1, distanceWeight: 0.7, availabilityWeight: 0.2 };
        break;
      case 'budget':
        preferences = { priceWeight: 0.7, distanceWeight: 0.2, availabilityWeight: 0.1 };
        break;
      default:
        preferences = { priceWeight: 0.4, distanceWeight: 0.4, availabilityWeight: 0.2 };
    }

    const recommendations = await recommendationEngine.getPharmacyRecommendations({
      medicine,
      userLocation,
      preferences
    });

    const bestPharmacy = recommendations[0];

    res.json({
      success: true,
      bestPharmacy,
      alternativeOptions: recommendations.slice(1, 4),
      urgencyLevel: urgency,
      reasoning: bestPharmacy ? bestPharmacy.reasoning : 'No pharmacies found with this medicine'
    });
  } catch (error) {
    console.error('Best pharmacy recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get price trend analysis
router.get('/price-trend/:medicineId', async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { days = 30 } = req.query;

    const medicine = csvLoader.getMedicineById(medicineId);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const priceTrend = await recommendationEngine.getPriceTrend(medicineId, parseInt(days));

    res.json({
      success: true,
      medicine: {
        id: medicine.id,
        name: medicine.name
      },
      priceTrend,
      analysis: {
        averagePrice: priceTrend.reduce((sum, item) => sum + item.averagePrice, 0) / priceTrend.length,
        lowestPrice: Math.min(...priceTrend.map(item => item.lowestPrice)),
        highestPrice: Math.max(...priceTrend.map(item => item.highestPrice)),
        trend: priceTrend.length > 1 ? 
          (priceTrend[priceTrend.length - 1].averagePrice > priceTrend[0].averagePrice ? 'increasing' : 'decreasing') 
          : 'stable'
      }
    });
  } catch (error) {
    console.error('Price trend analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get personalized recommendations based on user history
router.post('/personalized', async (req, res) => {
  try {
    const { userId, medicineId, userLocation } = req.body;
    
    if (!medicineId || !userLocation) {
      return res.status(400).json({ 
        error: 'Medicine ID and user location are required' 
      });
    }

    // For demo purposes, we'll use default preferences
    // In a real app, this would fetch user preferences from database
    const userPreferences = {
      priceWeight: 0.5,
      distanceWeight: 0.3,
      availabilityWeight: 0.2,
      preferredPharmacies: [], // User's favorite pharmacies
      budgetRange: { min: 0, max: 1000 }
    };

    const medicine = csvLoader.getMedicineById(medicineId);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const recommendations = await recommendationEngine.getPersonalizedRecommendations({
      medicine,
      userLocation,
      userPreferences,
      userId
    });

    res.json({
      success: true,
      recommendations,
      userPreferences,
      personalizationFactors: [
        'Previous purchase history',
        'Preferred pharmacy chains',
        'Budget preferences',
        'Distance tolerance'
      ]
    });
  } catch (error) {
    console.error('Personalized recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;