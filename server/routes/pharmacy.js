const express = require('express');
const router = express.Router();
const { pharmacies, generatePharmacyInventory } = require('../data/pharmacies');
const csvLoader = require('../services/csvLoader');
const { calculateDistance } = require('../utils/geoUtils');

// Helper to create a new medicine in-memory when pharmacy adds one not present in CSV
function createCustomMedicine(name) {
  const medicines = csvLoader.getMedicines();
  const id = `med_custom_${Date.now()}`;
  const medicine = {
    id,
    name,
    category: 'Custom',
    dosageForm: 'Tablet',
    strength: 'N/A',
    manufacturer: 'Local Pharmacy',
    indication: 'General',
    classification: 'Over-the-Counter',
    genericName: name,
    saltComposition: 'N/A',
    therapeuticClass: 'General',
    prescriptionRequired: false,
    popularity: 1,
    description: `Custom entry for ${name}`,
    sideEffects: [],
    dosage: 'As directed',
    maxDailyDose: 'N/A'
  };

  medicines.push(medicine);
  return medicine;
}

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
    // Support demo alias 'self' which maps to the first pharmacy
    let pharmacy;
    if (id === 'self') {
      pharmacy = pharmacies[0];
    } else {
      pharmacy = pharmacies.find(p => p.id === id);
    }
    
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

// Add or update a medicine entry for a pharmacy (demo: /self maps to first pharmacy)
router.post('/:id/medicine', async (req, res) => {
  try {
    ensureInventoryInitialized();

    const { id } = req.params; // pharmacy id or 'self'
    const { name, price, stock = 10 } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Resolve pharmacy
    let pharmacy;
    // If client provided a pharmacyName, create a new pharmacy entry (demo behavior)
    const { pharmacyName } = req.body || {};
    if (pharmacyName && pharmacyName.trim()) {
      // create a lightweight custom pharmacy
      const newId = `pharm_custom_${Date.now()}`;
      const base = pharmacies[0] || { lat: 12.97, lng: 77.59 };
      const newPharmacy = {
        id: newId,
        name: pharmacyName.trim(),
        address: 'Custom Address',
        phone: '',
        lat: base.lat + (Math.random() - 0.5) * 0.01,
        lng: base.lng + (Math.random() - 0.5) * 0.01,
        rating: 4.0,
        openHours: '9-21',
        is24x7: false,
        type: 'custom',
        services: ['prescription', 'otc'],
        inventory: []
      };
      pharmacies.push(newPharmacy);
      pharmacy = newPharmacy;
    } else {
      if (id === 'self') {
        pharmacy = pharmacies[0];
      } else {
        pharmacy = pharmacies.find(p => p.id === id);
      }
    }

    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    // Try to find existing medicine by exact name (case-insensitive) or by search
    let medicine = csvLoader.getMedicines().find(m => m.name.toLowerCase() === name.toLowerCase());
    if (!medicine) {
      const searchResults = csvLoader.searchMedicines(name, 1);
      medicine = searchResults && searchResults.length ? searchResults[0] : null;
    }

    // If still not found, create a custom medicine in-memory
    if (!medicine) {
      medicine = createCustomMedicine(name);
    }

    const medicineId = medicine.id;

    // Update or add inventory entry
    const existing = pharmacy.inventory.find(item => item.medicineId === medicineId);
    const now = new Date().toISOString();
    if (existing) {
      existing.price = price;
      existing.stock = parseInt(stock, 10);
      existing.lastUpdated = now;
    } else {
      pharmacy.inventory.push({
        medicineId,
        price,
        stock: parseInt(stock, 10),
        discount: 0,
        lastUpdated: now
      });
    }

    res.json({ success: true, pharmacyId: pharmacy.id, medicineId, price, stock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;