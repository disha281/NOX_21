// Indian pharmacy database with inventory in Rupees
const pharmacies = [
  {
    id: 'pharm001',
    name: 'Apollo Pharmacy',
    address: 'MG Road, Bangalore, Karnataka 560001',
    phone: '+91-80-2558-0101',
    lat: 12.9716,
    lng: 77.5946,
    rating: 4.5,
    openHours: '8-22',
    is24x7: false,
    type: 'chain',
    services: ['prescription', 'otc', 'consultation', 'home_delivery'],
    inventory: [] // Will be populated dynamically
  },
  {
    id: 'pharm002',
    name: 'MedPlus Pharmacy',
    address: 'Koramangala, Bangalore, Karnataka 560034',
    phone: '+91-80-4112-0102',
    lat: 12.9279,
    lng: 77.6271,
    rating: 4.2,
    openHours: '7-23',
    is24x7: false,
    type: 'chain',
    services: ['prescription', 'otc', 'vaccination', 'health_checkup'],
    inventory: []
  },
  {
    id: 'pharm003',
    name: 'Netmeds Pharmacy',
    address: 'Indiranagar, Bangalore, Karnataka 560038',
    phone: '+91-80-2521-0103',
    lat: 12.9784,
    lng: 77.6408,
    rating: 4.3,
    openHours: '6-24',
    is24x7: false,
    type: 'chain',
    services: ['prescription', 'otc', 'consultation', 'vaccination'],
    inventory: []
  },
  {
    id: 'pharm004',
    name: 'Wellness Forever',
    address: 'Jayanagar, Bangalore, Karnataka 560011',
    phone: '+91-80-2663-0104',
    lat: 12.9279,
    lng: 77.5937,
    rating: 4.1,
    openHours: '9-21',
    is24x7: false,
    type: 'independent',
    services: ['prescription', 'otc', 'home_delivery'],
    inventory: []
  },
  {
    id: 'pharm005',
    name: '24x7 Medical Store',
    address: 'Brigade Road, Bangalore, Karnataka 560025',
    phone: '+91-80-2559-0105',
    lat: 12.9698,
    lng: 77.6205,
    rating: 4.0,
    openHours: '0-24',
    is24x7: true,
    type: 'independent',
    services: ['prescription', 'otc', 'emergency', 'consultation'],
    inventory: []
  },
  {
    id: 'pharm006',
    name: 'HealthBuddy Pharmacy',
    address: 'Whitefield, Bangalore, Karnataka 560066',
    phone: '+91-80-2845-0106',
    lat: 12.9698,
    lng: 77.7499,
    rating: 4.4,
    openHours: '8-20',
    is24x7: false,
    type: 'independent',
    services: ['prescription', 'otc', 'consultation', 'compounding'],
    inventory: []
  },
  {
    id: 'pharm007',
    name: 'QuickMeds Express',
    address: 'Electronic City, Bangalore, Karnataka 560100',
    phone: '+91-80-2783-0107',
    lat: 12.8456,
    lng: 77.6603,
    rating: 3.9,
    openHours: '10-22',
    is24x7: false,
    type: 'chain',
    services: ['prescription', 'otc', 'express_pickup'],
    inventory: []
  },
  {
    id: 'pharm008',
    name: 'Care & Cure Pharmacy',
    address: 'HSR Layout, Bangalore, Karnataka 560102',
    phone: '+91-80-4067-0108',
    lat: 12.9082,
    lng: 77.6476,
    rating: 4.6,
    openHours: '7-21',
    is24x7: false,
    type: 'independent',
    services: ['prescription', 'otc', 'consultation', 'home_delivery', 'medication_sync'],
    inventory: []
  },
  {
    id: 'pharm009',
    name: 'Fortis Pharmacy',
    address: 'Bannerghatta Road, Bangalore, Karnataka 560076',
    phone: '+91-80-6621-0109',
    lat: 12.8988,
    lng: 77.6022,
    rating: 4.3,
    openHours: '8-22',
    is24x7: false,
    type: 'hospital',
    services: ['prescription', 'otc', 'consultation', 'vaccination'],
    inventory: []
  },
  {
    id: 'pharm010',
    name: 'Manipal Pharmacy',
    address: 'Old Airport Road, Bangalore, Karnataka 560017',
    phone: '+91-80-2520-0110',
    lat: 12.9591,
    lng: 77.6469,
    rating: 4.2,
    openHours: '24x7',
    is24x7: true,
    type: 'hospital',
    services: ['prescription', 'otc', 'emergency', 'consultation', 'vaccination'],
    inventory: []
  }
];

// Function to generate inventory for pharmacies based on CSV medicines
function generatePharmacyInventory(csvLoader) {
  const medicines = csvLoader.getMedicines();
  
  pharmacies.forEach(pharmacy => {
    // Each pharmacy will have 60-80% of available medicines
    const inventorySize = Math.floor(medicines.length * (0.6 + Math.random() * 0.2));
    const selectedMedicines = medicines
      .sort(() => 0.5 - Math.random())
      .slice(0, inventorySize);
    
    pharmacy.inventory = selectedMedicines.map(medicine => {
      // Generate realistic Indian prices in Rupees
      const basePrice = generateIndianPrice(medicine);
      const stock = Math.floor(Math.random() * 200) + 10; // 10-210 units
      const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 25) + 5 : 0; // 0-30% discount
      
      return {
        medicineId: medicine.id,
        price: basePrice,
        stock: stock,
        discount: discount,
        lastUpdated: new Date().toISOString()
      };
    });
  });
}

function generateIndianPrice(medicine) {
  // Base price calculation based on medicine category and strength
  let basePrice = 50; // Base price in Rupees
  
  // Category-based pricing
  const categoryMultipliers = {
    'Antibiotic': 2.5,
    'Analgesic': 1.2,
    'Antipyretic': 1.0,
    'Antifungal': 3.0,
    'Antiviral': 4.0,
    'Antidepressant': 3.5,
    'Antidiabetic': 2.8,
    'Antiseptic': 0.8
  };
  
  const multiplier = categoryMultipliers[medicine.category] || 1.5;
  basePrice *= multiplier;
  
  // Strength-based pricing
  const strengthMatch = medicine.strength.match(/(\d+)/);
  if (strengthMatch) {
    const strength = parseInt(strengthMatch[1]);
    basePrice += (strength / 100) * 10; // Add based on strength
  }
  
  // Dosage form pricing
  const formMultipliers = {
    'Injection': 2.0,
    'Inhaler': 1.8,
    'Syrup': 1.3,
    'Ointment': 1.2,
    'Cream': 1.2,
    'Tablet': 1.0,
    'Capsule': 1.1,
    'Drops': 1.4
  };
  
  const formMultiplier = formMultipliers[medicine.dosageForm] || 1.0;
  basePrice *= formMultiplier;
  
  // Prescription vs OTC pricing
  if (medicine.prescriptionRequired) {
    basePrice *= 1.5;
  }
  
  // Add some randomness (±20%)
  const randomFactor = 0.8 + (Math.random() * 0.4);
  basePrice *= randomFactor;
  
  // Round to nearest rupee
  return Math.round(basePrice);
}

module.exports = {
  pharmacies,
  generatePharmacyInventory,
  generateIndianPrice
};