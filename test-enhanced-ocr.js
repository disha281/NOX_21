const ocrService = require('./server/services/ocrService');

async function testEnhancedOCR() {
  console.log('🧪 Testing Enhanced OCR with Deduplication...\\n');
  
  // Test prescription with duplicate medicine names to test deduplication
  const testPrescription = `
    PRESCRIPTION
    
    Dr. Sarah Johnson, MD
    Date: 12/15/2023
    
    Patient: John Doe
    
    Rx:
    1. Paracetamol 500mg - Take 1 tablet twice daily
    2. Amoxicillin 250mg - Take 1 capsule three times daily  
    3. Omeprazole 20mg - Take 1 tablet once daily before breakfast
    4. Paracetamol 500mg - (duplicate mention)
    5. Acetaminophen 500mg - (same as Paracetamol)
    
    Note: Continue Paracetamol as prescribed
    Follow up with Amoxicillin treatment
    
    Signature: Dr. Sarah Johnson
  `;
  
  console.log('📄 Test Prescription Text:');
  console.log(testPrescription);
  console.log('\\n' + '─'.repeat(60) + '\\n');
  
  try {
    // Test the enhanced extraction
    const medicines = ocrService.extractMedicinesFromText(testPrescription);
    
    console.log(`✅ Extracted ${medicines.length} medicines:\\n`);
    
    medicines.forEach((medicine, index) => {
      console.log(`${index + 1}. Medicine: \"${medicine.name}\"`);
      console.log(`   Generic: ${medicine.genericName}`);
      console.log(`   Extracted Text: \"${medicine.extractedText}\"`);
      console.log(`   Confidence: ${(medicine.confidence * 100).toFixed(1)}%`);
      console.log(`   Match Type: ${medicine.matchType}`);
      console.log(`   From Database: ${medicine.fromDatabase ? 'Yes' : 'No'}`);
      
      if (medicine.fromDatabase) {
        console.log(`   Category: ${medicine.category}`);
        console.log(`   Form: ${medicine.dosageForm}`);
        console.log(`   Manufacturer: ${medicine.manufacturer}`);
        console.log(`   Indication: ${medicine.indication}`);
      }
      
      if (medicine.dosageInfo && medicine.dosageInfo.strength) {
        console.log(`   Detected Strength: ${medicine.dosageInfo.strength}`);
      }
      console.log('');
    });
    
    // Test with a medicine name that might have variations
    console.log('\\n🔍 Testing search variations:');
    const variations = ['paracetamol', 'acetaminophen', 'aspirin', 'ibuprofen'];
    
    variations.forEach(variation => {
      const results = ocrService.extractMedicinesFromText(`Take ${variation} 500mg twice daily`);
      console.log(`   \"${variation}\" found ${results.length} matches`);
      if (results.length > 0) {
        console.log(`     → ${results[0].name} (${(results[0].confidence * 100).toFixed(1)}%)`);
      }
    });
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }
}

testEnhancedOCR().catch(console.error);