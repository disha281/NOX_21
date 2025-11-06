const csvLoader = require('./csvLoader');
const Tesseract = require('tesseract.js');

class OCRService {
  constructor() {
    this.medicinePatterns = this.buildMedicinePatterns();
  }

  buildMedicinePatterns() {
    const medicineData = csvLoader.getMedicines();
    return medicineData.map(medicine => ({
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      patterns: [
        // Exact name match with word boundaries
        new RegExp(`\\b${this.escapeRegex(medicine.name)}\\b`, 'gi'),
        // Generic name match with word boundaries
        new RegExp(`\\b${this.escapeRegex(medicine.genericName)}\\b`, 'gi')
      ]
    }));
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  findMedicineByName(searchName) {
    const medicines = csvLoader.getMedicines();
    
    // First try exact match
    let medicine = medicines.find(m => 
      m.name.toLowerCase() === searchName.toLowerCase() ||
      m.genericName.toLowerCase() === searchName.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!medicine) {
      medicine = medicines.find(m => 
        m.name.toLowerCase().includes(searchName.toLowerCase()) ||
        m.genericName.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    
    // If still no match, create a mock medicine entry for common medicines
    if (!medicine) {
      const mockMedicines = {
        'paracetamol': { id: 'mock_paracetamol', name: 'Paracetamol', genericName: 'Acetaminophen' },
        'acetaminophen': { id: 'mock_acetaminophen', name: 'Acetaminophen', genericName: 'Acetaminophen' },
        'aspirin': { id: 'mock_aspirin', name: 'Aspirin', genericName: 'Acetylsalicylic Acid' },
        'ibuprofen': { id: 'mock_ibuprofen', name: 'Ibuprofen', genericName: 'Ibuprofen' },
        'amoxicillin': { id: 'mock_amoxicillin', name: 'Amoxicillin', genericName: 'Amoxicillin' },
        'omeprazole': { id: 'mock_omeprazole', name: 'Omeprazole', genericName: 'Omeprazole' },
        'metformin': { id: 'mock_metformin', name: 'Metformin', genericName: 'Metformin' }
      };
      
      medicine = mockMedicines[searchName.toLowerCase()];
    }
    
    return medicine;
  }

  async processPrescription(imageBuffer) {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting OCR processing...');
      
      // Process the actual image using Tesseract.js
      const { data: { text, confidence } } = await Tesseract.recognize(
        imageBuffer,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      console.log('✅ OCR text extraction completed');
      console.log('📄 Extracted text:', text.substring(0, 200) + '...');
      
      // Extract medicines from the OCR text
      const medicines = this.extractMedicinesFromText(text);
      
      const overallConfidence = medicines.length > 0 
        ? medicines.reduce((sum, med) => sum + med.confidence, 0) / medicines.length
        : confidence / 100; // Use Tesseract confidence if no medicines found
      
      return {
        text: text,
        medicines,
        medicineCount: medicines.length,
        confidence: Math.round(overallConfidence * 100) / 100,
        processingTime: Date.now() - startTime,
        extractionMethod: 'tesseract_ocr',
        ocrConfidence: Math.round(confidence)
      };
    } catch (error) {
      console.error('❌ OCR processing error:', error);
      
      // Fallback to mock data if OCR fails
      console.log('🔄 Falling back to mock data...');
      const mockExtractedText = this.generateMockPrescriptionText();
      const medicines = this.extractMedicinesFromText(mockExtractedText);
      
      const overallConfidence = medicines.length > 0 
        ? medicines.reduce((sum, med) => sum + med.confidence, 0) / medicines.length
        : 0.0;
      
      return {
        text: mockExtractedText,
        medicines,
        medicineCount: medicines.length,
        confidence: Math.round(overallConfidence * 100) / 100,
        processingTime: Date.now() - startTime,
        extractionMethod: 'fallback_mock_data',
        error: `OCR failed: ${error.message}`
      };
    }
  }

  async extractMedicineName(imageBuffer) {
    const startTime = Date.now();
    
    try {
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
    const samplePrescriptions = [
      `Rx:
1. Paracetamol 500mg - Take 1 tablet twice daily
2. Amoxicillin 250mg - Take 1 capsule three times daily
3. Omeprazole 20mg - Take 1 tablet once daily before breakfast`,
      
      `Prescribed Medicines:
- Aspirin 75mg (1 tablet daily)
- Metformin 500mg (2 tablets daily)
- Ibuprofen 400mg (as needed for pain)`,
      
      `1) Paracetamol 500mg tablets - Take as needed
2) Amoxicillin 250mg capsules - Three times daily
3) Aspirin 75mg - Once daily`
    ];
    
    return samplePrescriptions[Math.floor(Math.random() * samplePrescriptions.length)];
  }

  generateMockMedicineText() {
    const sampleMedicines = ['Paracetamol', 'Aspirin', 'Ibuprofen', 'Amoxicillin', 'Omeprazole'];
    return sampleMedicines[Math.floor(Math.random() * sampleMedicines.length)];
  }

  extractPotentialMedicineWords(text) {
    // Extract words that could be medicine names
    const words = [];
    const seenWords = new Set(); // Track words we've already processed
    
    // Split text into words and filter potential medicine names
    const allWords = text.match(/\b[A-Za-z]{3,}\b/g) || [];
    
    allWords.forEach(word => {
      const cleanWord = word.trim();
      const lowerWord = cleanWord.toLowerCase();
      
      // Skip if we've already processed this word
      if (seenWords.has(lowerWord)) {
        return;
      }
      
      // Skip common non-medicine words
      const skipWords = ['the', 'and', 'for', 'with', 'take', 'tablet', 'capsule', 'daily', 'twice', 'once', 'morning', 'evening', 'night', 'before', 'after', 'meal', 'food', 'doctor', 'patient', 'prescription', 'signature', 'date', 'follow', 'review', 'times', 'days', 'weeks', 'months'];
      
      if (cleanWord.length >= 3 && !skipWords.includes(lowerWord)) {
        // Prioritize words that look like medicine names
        const isMedicineLike = 
          /^[A-Z][a-z]+$/.test(cleanWord) || // Proper case
          /cillin|mycin|profen|statin|nazole|phen|met|vir|zole|pine|sartan|pril|mab|nib|tinib/i.test(cleanWord) || // Medicine suffixes
          cleanWord.length >= 6; // Longer words more likely to be medicines
        
        if (isMedicineLike) {
          words.push(cleanWord);
          seenWords.add(lowerWord); // Mark as processed
        }
      }
    });
    
    return words;
  }

  calculateSearchConfidence(searchTerm, medicine) {
    const term = searchTerm.toLowerCase();
    const name = medicine.name.toLowerCase();
    const generic = medicine.genericName.toLowerCase();
    
    // Exact match gets highest confidence
    if (term === name || term === generic) {
      return 0.95;
    }
    
    // Check if search term is contained in medicine name
    if (name.includes(term) || term.includes(name)) {
      const ratio = Math.min(term.length, name.length) / Math.max(term.length, name.length);
      return 0.8 * ratio;
    }
    
    // Check generic name
    if (generic.includes(term) || term.includes(generic)) {
      const ratio = Math.min(term.length, generic.length) / Math.max(term.length, generic.length);
      return 0.75 * ratio;
    }
    
    // Use Levenshtein distance for fuzzy matching
    const nameDistance = this.levenshteinDistance(term, name);
    const genericDistance = this.levenshteinDistance(term, generic);
    
    const minDistance = Math.min(nameDistance, genericDistance);
    const maxLength = Math.max(term.length, Math.max(name.length, generic.length));
    
    const similarity = (maxLength - minDistance) / maxLength;
    
    return Math.max(0, similarity);
  }

  extractMedicinesFromText(text) {
    const foundMedicines = [];
    const processedText = this.preprocessPrescriptionText(text);
    
    if (!processedText || processedText.length < 3) {
      return foundMedicines;
    }

    console.log('🔍 Searching for medicines in text using full dataset...');
    
    // Extract potential medicine words from the text
    const words = this.extractPotentialMedicineWords(processedText);

    // Search each word against the full medicine dataset
    words.forEach(word => {
      if (word.length >= 3) { // Only search words with 3+ characters
        const searchResults = csvLoader.searchMedicines(word, 5); // Get top 5 matches
        
        searchResults.forEach(medicine => {
          // Check if we already found this medicine (by ID or name)
          const alreadyFound = foundMedicines.find(fm => 
            fm.id === medicine.id || 
            fm.name.toLowerCase() === medicine.name.toLowerCase() ||
            fm.genericName.toLowerCase() === medicine.genericName.toLowerCase()
          );
          
          if (!alreadyFound) {
            const confidence = this.calculateSearchConfidence(word, medicine);
            
            if (confidence >= 0.6) { // Only include matches with 60%+ confidence
              const dosageInfo = this.extractDosageFromText(text, word);
              
              console.log(`✅ Found medicine: ${medicine.name} (confidence: ${Math.round(confidence * 100)}%)`);
              
              foundMedicines.push({
                id: medicine.id,
                name: medicine.name,
                genericName: medicine.genericName,
                confidence: confidence,
                matchType: 'dataset_search',
                extractedText: word,
                dosageInfo: dosageInfo,
                fromDatabase: true,
                // Include additional database information
                category: medicine.category,
                dosageForm: medicine.dosageForm,
                strength: medicine.strength,
                manufacturer: medicine.manufacturer,
                indication: medicine.indication,
                classification: medicine.classification,
                saltComposition: medicine.saltComposition,
                therapeuticClass: medicine.therapeuticClass,
                prescriptionRequired: medicine.prescriptionRequired,
                description: medicine.description
              });
            }
          }
        });
      }
    });

    // Also try pattern-based detection for medicine-like words
    const medicinePattern = /\b[A-Z][a-z]{3,}(?:cillin|mycin|profen|statin|nazole|phen|met|vir|zole|pine|sartan|pril|mab|nib|tinib)\b/gi;
    const patternMatches = text.match(medicinePattern) || [];
    
    patternMatches.forEach(match => {
      const searchResults = csvLoader.searchMedicines(match, 3);
      
      searchResults.forEach(medicine => {
        // Check if we already found this medicine (by ID or name)
        const alreadyFound = foundMedicines.find(fm => 
          fm.id === medicine.id || 
          fm.name.toLowerCase() === medicine.name.toLowerCase() ||
          fm.genericName.toLowerCase() === medicine.genericName.toLowerCase()
        );
        
        if (!alreadyFound) {
          const confidence = this.calculateSearchConfidence(match, medicine) * 0.9; // Slightly lower for pattern matches
          
          if (confidence >= 0.5) {
            const dosageInfo = this.extractDosageFromText(text, match);
            
            console.log(`🔍 Pattern match: ${medicine.name} (confidence: ${Math.round(confidence * 100)}%)`);
            
            foundMedicines.push({
              id: medicine.id,
              name: medicine.name,
              genericName: medicine.genericName,
              confidence: confidence,
              matchType: 'pattern_search',
              extractedText: match,
              dosageInfo: dosageInfo,
              fromDatabase: true,
              category: medicine.category,
              dosageForm: medicine.dosageForm,
              strength: medicine.strength,
              manufacturer: medicine.manufacturer,
              indication: medicine.indication,
              classification: medicine.classification,
              saltComposition: medicine.saltComposition,
              therapeuticClass: medicine.therapeuticClass,
              prescriptionRequired: medicine.prescriptionRequired,
              description: medicine.description
            });
          }
        }
      });
    });

    // Final deduplication step - remove any remaining duplicates
    const uniqueMedicines = [];
    const seenMedicines = new Set();
    
    foundMedicines.forEach(medicine => {
      const key = `${medicine.name.toLowerCase()}_${medicine.genericName.toLowerCase()}`;
      if (!seenMedicines.has(key)) {
        uniqueMedicines.push(medicine);
        seenMedicines.add(key);
      }
    });

    console.log(`📊 Total unique medicines found: ${uniqueMedicines.length}`);

    // Sort by confidence and return unique medicines
    return uniqueMedicines
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Limit to reasonable number of medicines
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

  preprocessPrescriptionText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    try {
      return text
        // Clean up common OCR artifacts
        .replace(/[|]/g, 'l') // Pipe to lowercase L
        .replace(/[0]/g, 'O') // Zero to O in medicine names context
        .replace(/[1]/g, 'l') // One to lowercase L
        .replace(/[5]/g, 'S') // Five to S
        // Remove doctor information but preserve medicine names
        .replace(/Dr\.?\s+[A-Za-z\s]+,?\s*(MD|MBBS|M\.D\.|M\.B\.B\.S\.)?/gi, '')
        .replace(/Date:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi, '')
        .replace(/Patient:?\s*\[.*?\]/gi, '')
        .replace(/Signature:?\s*Dr\.?\s*[A-Za-z\s]+/gi, '')
        .replace(/(Follow up|Review) in \d+\s*(days?|weeks?|months?)/gi, '')
        .replace(/Duration:?\s*\d+\s*days?/gi, '')
        // Clean up extra punctuation but preserve medicine names
        .replace(/[^\w\s\.\-\(\)]/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      console.warn('Error preprocessing text:', error.message);
      return text || '';
    }
  }

  extractMedicineLines(text) {
    const lines = text.split('\n');
    const medicineLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
      
      // Look for lines that contain medicine indicators
      const hasMedicineIndicators = 
        /\d+[\.\)]\s*[A-Za-z]/.test(trimmedLine) || // Numbered list
        /^[-*•]\s*[A-Za-z]/.test(trimmedLine) || // Bullet points
        /\d+\s*(mg|g|ml|mcg)/i.test(trimmedLine) || // Contains dosage
        /(tablet|capsule|syrup|injection)/i.test(trimmedLine); // Contains form
      
      if (hasMedicineIndicators) {
        medicineLines.push(trimmedLine);
      }
    }
    
    // If no specific lines found, return filtered lines
    if (medicineLines.length === 0) {
      return lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.match(/^Dr\./i) && 
               !trimmed.match(/^Date:/i) && 
               !trimmed.match(/^Patient:/i) &&
               !trimmed.match(/^Signature:/i);
      });
    }
    
    return medicineLines;
  }

  calculateMatchConfidence(matchText, patternIndex) {
    let baseConfidence = patternIndex === 0 ? 0.95 : 0.85;
    
    const matchLength = matchText.length;
    if (matchLength < 4) baseConfidence -= 0.2;
    if (matchLength > 12) baseConfidence += 0.05;
    
    return Math.max(0.7, Math.min(0.98, baseConfidence));
  }

  extractDosageFromText(text, medicineName) {
    // Look for dosage info near the medicine name
    const medicineIndex = text.toLowerCase().indexOf(medicineName.toLowerCase());
    if (medicineIndex === -1) return { strength: null, form: null, frequency: null };
    
    const surroundingText = text.substring(
      Math.max(0, medicineIndex - 20), 
      medicineIndex + medicineName.length + 50
    );
    
    const strengthMatch = surroundingText.match(/(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg)/i);
    const formMatch = surroundingText.match(/(tablet|capsule|syrup|injection|cream|drops)s?/i);
    const frequencyMatch = surroundingText.match(/(once|twice|thrice|\d+\s*times?)\s*(daily|per day)/i);
    
    return {
      strength: strengthMatch ? `${strengthMatch[1]}${strengthMatch[2]}` : null,
      form: formMatch ? formMatch[1].toLowerCase() : null,
      frequency: frequencyMatch ? frequencyMatch[0] : null
    };
  }

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