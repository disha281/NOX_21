const express = require('express');
const router = express.Router();
const { pharmacies, generatePharmacyInventory } = require('../data/pharmacies');
const csvLoader = require('../services/csvLoader');
const { calculateDistance } = require('../utils/geoUtils');

// Initialize pharmacy inventory on first load
let inventoryInitialized = false;
function ensureInventoryInitialized() {
  if (!inventoryInitialized) {
    generatePharmacyInventory(csvLoader);
    inventoryInitialized = true;
    console.log('✅ Pharmacy inventory initialized with CSV data');
  }
}

// Find nearby pharmacies
router.get('/nearby', async (req, res) => {
  try {
    ensureInventoryInitialized();
    
    const { lat, lng, radius = 10, medicineId } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    // Filter pharmacies within radius
    let nearbyPharmacies = pharmacies.filter(pharmacy => {
      const distance = calculateDistance(userLat, userLng, pharmacy.lat, pharmacy.lng);
      return distance <= searchRadius;
    });

    // Add distance to each pharmacy
    nearbyPharmacies = nearbyPharmacies.map(pharmacy => ({
      ...pharmacy,
      distance: calculateDistance(userLat, userLng, pharmacy.lat, pharmacy.lng)
    }));

    // If medicineId is provided, filter by availability
    if (medicineId) {
      nearbyPharmacies = nearbyPharmacies.filter(pharmacy => 
        pharmacy.inventory.some(item => item.medicineId === medicineId && item.stock > 0)
      );
    }

    // Sort by distance
    nearbyPharmacies.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      pharmacies: nearbyPharmacies,
      total: nearbyPharmacies.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pharmacy details
router.get('/:id', async (req, res) => {
  try {
    ensureInventoryInitialized();
    
    const { id } = req.params;
    const pharmacy = pharmacies.find(p => p.id === id);
    
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      pharmacy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medicine availability and prices at specific pharmacy
router.get('/:id/medicine/:medicineId', async (req, res) => {
  try {
    ensureInventoryInitialized();
    
    const { id, medicineId } = req.params;
    const pharmacy = pharmacies.find(p => p.id === id);
    
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    const medicineInfo = pharmacy.inventory.find(item => item.medicineId === medicineId);
    
    if (!medicineInfo) {
      return res.status(404).json({ error: 'Medicine not available at this pharmacy' });
    }

    res.json({
      success: true,
      pharmacy: {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address
      },
      medicine: medicineInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare prices across pharmacies
router.get('/compare/:medicineId', async (req, res) => {
  try {
    ensureInventoryInitialized();
    
    const { medicineId } = req.params;
    const { lat, lng, radius = 10 } = req.query;

    let pharmaciesWithMedicine = [];

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const searchRadius = parseFloat(radius);

      // Filter by location and medicine availability
      pharmaciesWithMedicine = pharmacies
        .filter(pharmacy => {
          const distance = calculateDistance(userLat, userLng, pharmacy.lat, pharmacy.lng);
          return distance <= searchRadius;
        })
        .map(pharmacy => {
          const medicineInfo = pharmacy.inventory.find(item => item.medicineId === medicineId);
          if (medicineInfo && medicineInfo.stock > 0) {
            return {
              pharmacy: {
                id: pharmacy.id,
                name: pharmacy.name,
                address: pharmacy.address,
                rating: pharmacy.rating,
                lat: pharmacy.lat,
                lng: pharmacy.lng
              },
              medicine: medicineInfo,
              distance: calculateDistance(userLat, userLng, pharmacy.lat, pharmacy.lng)
            };
          }
          return null;
        })
        .filter(item => item !== null);
    } else {
      // Get all pharmacies with the medicine
      pharmaciesWithMedicine = pharmacies
        .map(pharmacy => {
          const medicineInfo = pharmacy.inventory.find(item => item.medicineId === medicineId);
          if (medicineInfo && medicineInfo.stock > 0) {
            return {
              pharmacy: {
                id: pharmacy.id,
                name: pharmacy.name,
                address: pharmacy.address,
                rating: pharmacy.rating,
                lat: pharmacy.lat,
                lng: pharmacy.lng
              },
              medicine: medicineInfo,
              distance: null
            };
          }
          return null;
        })
        .filter(item => item !== null);
    }

    // Sort by price
    pharmaciesWithMedicine.sort((a, b) => a.medicine.price - b.medicine.price);

    res.json({
      success: true,
      comparisons: pharmaciesWithMedicine,
      total: pharmaciesWithMedicine.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;