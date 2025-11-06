const csvLoader = require('./csvLoader');

class OCRService {
  constructor() {
    // In a real implementation, this would use Tesseract.js or Google Vision API
    this.medicinePatterns = this.buildMedicinePatterns();
  }

  buildMedicinePatterns() {
    // Create regex patterns for common medicine names
    const medicineData = csvLoader.getMedicines();
    return medicineData.map(medicine => ({
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      patterns: [
        new RegExp(medicine.name.replace(/\s+/g, '\\s*'), 'gi'),
        new RegExp(medicine.genericName.replace(/\s+/g, '\\s*'), 'gi')
      ]
    }));
  }

  async processPrescription(imageBuffer) {
    const startTime = Date.now();
    
    try {
      // Simulate OCR processing
      // In real implementation, this would use actual OCR
      const mockExtractedText = this.generateMockPrescriptionText();
      
      const medicines = this.extractMedicinesFromText(mockExtractedText);
      
      return {
        text: mockExtractedText,
        medicines,
        confidence: 0.85,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async extractMedicineName(imageBuffer) {
    const startTime = Date.now();
    
    try {
      // Simulate medicine name extraction
      const mockText = this.generateMockMedicineText();
      const medicineName = this.extractSingleMedicine(mockText);
      
      return {
        text: mockText,
        medicineName,
        confidence: 0.90,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Medicine name extraction failed: ${error.message}`);
    }
  }

  generateMockPrescriptionText() {
    // Simulate extracted prescription text
    const samplePrescriptions = [
      `Dr. John Smith, MD
      Date: ${new Date().toLocaleDateString()}
      
      Patient: [PATIENT_NAME]
      
      Rx:
      1. Paracetamol 500mg - Take 1 tablet twice daily
      2. Amoxicillin 250mg - Take 1 capsule three times daily
      3. Omeprazole 20mg - Take 1 tablet once daily before breakfast
      
      Signature: Dr. John Smith`,
      
      `Medical Prescription
      
      Prescribed Medicines:
      - Aspirin 75mg (1 tablet daily)
      - Metformin 500mg (2 tablets daily)
      - Lisinopril 10mg (1 tablet daily)
      
      Duration: 30 days`,
      
      `Rx: Ibuprofen 400mg
      Dosage: 1 tablet every 8 hours
      Duration: 5 days`
    ];
    
    return samplePrescriptions[Math.floor(Math.random() * samplePrescriptions.length)];
  }

  generateMockMedicineText() {
    const sampleMedicines = ['Paracetamol', 'Aspirin', 'Ibuprofen', 'Amoxicillin', 'Omeprazole'];
    return sampleMedicines[Math.floor(Math.random() * sampleMedicines.length)];
  }

  extractMedicinesFromText(text) {
    const foundMedicines = [];
    
    this.medicinePatterns.forEach(pattern => {
      pattern.patterns.forEach(regex => {
        if (regex.test(text)) {
          const medicine = csvLoader.getMedicineById(pattern.id);
          if (medicine && !foundMedicines.find(fm => fm.id === medicine.id)) {
            foundMedicines.push({
              id: medicine.id,
              name: medicine.name,
              genericName: medicine.genericName,
              confidence: 0.85 + Math.random() * 0.1 // Random confidence between 0.85-0.95
            });
          }
        }
      });
    });

    return foundMedicines;
  }

  extractSingleMedicine(text) {
    for (const pattern of this.medicinePatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(text)) {
          const medicine = csvLoader.getMedicineById(pattern.id);
          if (medicine) {
            return {
              id: medicine.id,
              name: medicine.name,
              genericName: medicine.genericName,
              confidence: 0.90
            };
          }
        }
      }
    }
    
    return null;
  }

  // Method to improve OCR accuracy with preprocessing
  preprocessImage(imageBuffer) {
    // In real implementation, this would:
    // 1. Convert to grayscale
    // 2. Apply noise reduction
    // 3. Enhance contrast
    // 4. Correct skew/rotation
    // 5. Resize for optimal OCR
    return imageBuffer;
  }

  // Method to validate extracted medicine names
  validateMedicineName(extractedName) {
    const medicineData = csvLoader.getMedicines();
    const medicine = medicineData.find(m => 
      m.name.toLowerCase() === extractedName.toLowerCase() ||
      m.genericName.toLowerCase() === extractedName.toLowerCase()
    );
    
    return medicine ? {
      isValid: true,
      medicine,
      confidence: 0.95
    } : {
      isValid: false,
      suggestions: this.getSimilarMedicines(extractedName),
      confidence: 0.0
    };
  }

  getSimilarMedicines(searchTerm) {
    // Simple similarity matching - in real app, use more sophisticated algorithms
    const medicineData = csvLoader.getMedicines();
    return medicineData
      .filter(medicine => 
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm.toLowerCase().includes(medicine.name.toLowerCase())
      )
      .slice(0, 5)
      .map(medicine => ({
        id: medicine.id,
        name: medicine.name,
        similarity: this.calculateSimilarity(searchTerm, medicine.name)
      }))
      .sort((a, b) => b.similarity - a.similarity);
  }

  calculateSimilarity(str1, str2) {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

module.exports = new OCRService();