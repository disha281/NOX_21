// Simple test script to verify the API is working with CSV data
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing MedAI API with CSV data...\n');

    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Search medicines
    console.log('\n2. Testing medicine search...');
    const searchResponse = await axios.get(`${BASE_URL}/medicine/search?query=Amoxicillin&limit=5`);
    console.log('✅ Search results:', searchResponse.data.results.length, 'medicines found');
    console.log('First medicine:', searchResponse.data.results[0]?.name);

    // Test 3: Get popular medicines
    console.log('\n3. Testing popular medicines...');
    const popularResponse = await axios.get(`${BASE_URL}/medicine/popular/list`);
    console.log('✅ Popular medicines:', popularResponse.data.medicines.length, 'medicines loaded');

    // Test 4: Find nearby pharmacies
    console.log('\n4. Testing nearby pharmacies...');
    const nearbyResponse = await axios.get(`${BASE_URL}/pharmacy/nearby?lat=12.9716&lng=77.5946&radius=20`);
    console.log('✅ Nearby pharmacies:', nearbyResponse.data.pharmacies.length, 'pharmacies found');
    
    if (nearbyResponse.data.pharmacies.length > 0) {
      const firstPharmacy = nearbyResponse.data.pharmacies[0];
      console.log('First pharmacy:', firstPharmacy.name);
      console.log('Inventory items:', firstPharmacy.inventory.length);
      
      if (firstPharmacy.inventory.length > 0) {
        const firstItem = firstPharmacy.inventory[0];
        console.log('Sample price: ₹' + firstItem.price);
      }
    }

    // Test 5: Price comparison
    if (searchResponse.data.results.length > 0) {
      const medicineId = searchResponse.data.results[0].id;
      console.log('\n5. Testing price comparison...');
      const compareResponse = await axios.get(`${BASE_URL}/pharmacy/compare/${medicineId}?lat=12.9716&lng=77.5946`);
      console.log('✅ Price comparison:', compareResponse.data.comparisons.length, 'pharmacies with medicine');
      
      if (compareResponse.data.comparisons.length > 0) {
        const prices = compareResponse.data.comparisons.map(c => c.medicine.price);
        console.log('Price range: ₹' + Math.min(...prices) + ' - ₹' + Math.max(...prices));
      }
    }

    console.log('\n🎉 All tests passed! MedAI is working with CSV data and Indian Rupees.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();