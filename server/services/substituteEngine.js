const csvLoader = require('./csvLoader');

class SubstituteEngine {
  constructor() {
    this.saltCompositionMap = this.buildSaltCompositionMap();
    this.therapeuticClassMap = this.buildTherapeuticClassMap();
  }

  buildSaltCompositionMap() {
    const map = new Map();
    const medicineData = csvLoader.getMedicines();
    medicineData.forEach(medicine => {
      const salt = medicine.saltComposition.toLowerCase();
      if (!map.has(salt)) {
        map.set(salt, []);
      }
      map.get(salt).push(medicine);
    });
    return map;
  }

  buildTherapeuticClassMap() {
    const map = new Map();
    const medicineData = csvLoader.getMedicines();
    medicineData.forEach(medicine => {
      const therapeuticClass = medicine.therapeuticClass.toLowerCase();
      if (!map.has(therapeuticClass)) {
        map.set(therapeuticClass, []);
      }
      map.get(therapeuticClass).push(medicine);
    });
    return map;
  }

  async findSubstitutes(medicine) {
    try {
      const substitutes = [];
      
      // 1. Find exact salt composition matches within same therapeutic class (Generic equivalents)
      const exactMatches = this.findBySaltCompositionSameClass(medicine);
      substitutes.push(...exactMatches.map(sub => ({
        ...sub,
        substituteType: 'generic',
        similarity: 1.0,
        reason: 'Same active ingredient, same therapeutic class'
      })));

      // 2. Find therapeutic class matches (Alternative treatments within same class)
      const therapeuticMatches = this.findByTherapeuticClass(medicine);
      substitutes.push(...therapeuticMatches.map(sub => ({
        ...sub,
        substituteType: 'therapeutic',
        similarity: 0.9,
        reason: 'Same therapeutic class'
      })));

      // 3. Find similar strength/dosage matches within same therapeutic class
      const dosageMatches = this.findBySimilarDosageSameClass(medicine);
      substitutes.push(...dosageMatches.map(sub => ({
        ...sub,
        substituteType: 'dosage',
        similarity: 0.8,
        reason: 'Similar dosage form, same therapeutic class'
      })));

      // 4. Find by same indication within same therapeutic class
      const indicationMatches = this.findBySameIndicationSameClass(medicine);
      substitutes.push(...indicationMatches.map(sub => ({
        ...sub,
        substituteType: 'indication',
        similarity: 0.7,
        reason: 'Same indication, same therapeutic class'
      })));

      // Remove duplicates and the original medicine
      const uniqueSubstitutes = this.removeDuplicates(substitutes, medicine.id);

      // Sort by similarity and price
      uniqueSubstitutes.sort((a, b) => {
        if (a.similarity !== b.similarity) {
          return b.similarity - a.similarity;
        }
        // Handle prices properly in sorting
        const priceA = this.getAveragePrice(a.id) || 999999;
        const priceB = this.getAveragePrice(b.id) || 999999;
        return priceA - priceB;
      });

      // Add price comparison and availability info
      return uniqueSubstitutes.slice(0, 10).map(substitute => ({
        ...substitute,
        priceComparison: this.comparePrices(medicine.id, substitute.id),
        availability: this.checkAvailability(substitute.id),
        safetyRating: this.calculateSafetyRating(substitute),
        doctorRecommended: substitute.substituteType === 'generic'
      }));

    } catch (error) {
      console.error('Substitute finding error:', error);
      return [];
    }
  }

  findBySaltComposition(medicine) {
    const salt = medicine.saltComposition.toLowerCase();
    const matches = this.saltCompositionMap.get(salt) || [];
    return matches.filter(m => 
      m.id !== medicine.id && 
      m.name.toLowerCase() !== medicine.name.toLowerCase() // Exclude same name
    );
  }

  findBySaltCompositionSameClass(medicine) {
    const salt = medicine.saltComposition.toLowerCase();
    const matches = this.saltCompositionMap.get(salt) || [];
    return matches.filter(m => 
      m.id !== medicine.id && 
      m.name.toLowerCase() !== medicine.name.toLowerCase() &&
      m.therapeuticClass.toLowerCase() === medicine.therapeuticClass.toLowerCase() // Same therapeutic class
    );
  }

  findByTherapeuticClass(medicine) {
    const therapeuticClass = medicine.therapeuticClass.toLowerCase();
    const matches = this.therapeuticClassMap.get(therapeuticClass) || [];
    return matches.filter(m => 
      m.id !== medicine.id && 
      m.name.toLowerCase() !== medicine.name.toLowerCase() && // Exclude same name
      m.saltComposition.toLowerCase() !== medicine.saltComposition.toLowerCase()
    );
  }

  findBySimilarDosage(medicine) {
    const dosageForm = this.extractDosageForm(medicine.name);
    const strength = this.extractStrength(medicine.name);
    const medicineData = csvLoader.getMedicines();
    
    return medicineData.filter(m => {
      if (m.id === medicine.id) return false;
      if (m.name.toLowerCase() === medicine.name.toLowerCase()) return false; // Exclude same name
      
      const mDosageForm = this.extractDosageForm(m.name);
      const mStrength = this.extractStrength(m.name);
      
      return mDosageForm === dosageForm && this.isSimilarStrength(strength, mStrength);
    });
  }

  findBySimilarDosageSameClass(medicine) {
    const dosageForm = this.extractDosageForm(medicine.name);
    const strength = this.extractStrength(medicine.name);
    const medicineData = csvLoader.getMedicines();
    
    return medicineData.filter(m => {
      if (m.id === medicine.id) return false;
      if (m.name.toLowerCase() === medicine.name.toLowerCase()) return false; // Exclude same name
      if (m.therapeuticClass.toLowerCase() !== medicine.therapeuticClass.toLowerCase()) return false; // Same therapeutic class only
      
      const mDosageForm = this.extractDosageForm(m.name);
      const mStrength = this.extractStrength(m.name);
      
      return mDosageForm === dosageForm && this.isSimilarStrength(strength, mStrength);
    });
  }

  findByBroaderCriteria(medicine) {
    const medicineData = csvLoader.getMedicines();
    
    return medicineData.filter(m => {
      if (m.id === medicine.id) return false;
      if (m.name.toLowerCase() === medicine.name.toLowerCase()) return false; // Exclude same name
      
      // Match by indication (what the medicine is used for)
      const sameIndication = m.indication && medicine.indication && 
                            m.indication.toLowerCase() === medicine.indication.toLowerCase();
      
      // Match by category (broader therapeutic area)
      const sameCategory = m.category && medicine.category && 
                          m.category.toLowerCase() === medicine.category.toLowerCase();
      
      return sameIndication || sameCategory;
    }).slice(0, 5);
  }

  findBySameIndicationSameClass(medicine) {
    const medicineData = csvLoader.getMedicines();
    
    return medicineData.filter(m => {
      if (m.id === medicine.id) return false;
      if (m.name.toLowerCase() === medicine.name.toLowerCase()) return false; // Exclude same name
      if (m.therapeuticClass.toLowerCase() !== medicine.therapeuticClass.toLowerCase()) return false; // Same therapeutic class only
      
      // Match by indication (what the medicine is used for)
      const sameIndication = m.indication && medicine.indication && 
                            m.indication.toLowerCase() === medicine.indication.toLowerCase();
      
      return sameIndication;
    }).slice(0, 5);
  }

  extractDosageForm(medicineName) {
    const forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops'];
    const name = (medicineName || '').toLowerCase();
    
    for (const form of forms) {
      if (name.includes(form)) {
        return form;
      }
    }
    return 'tablet';
  }

  extractStrength(medicineName) {
    const strengthMatch = (medicineName || '').match(/(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg)/i);
    return strengthMatch ? {
      value: parseFloat(strengthMatch[1]),
      unit: strengthMatch[2].toLowerCase()
    } : null;
  }

  isSimilarStrength(strength1, strength2) {
    if (!strength1 || !strength2) return false;
    if (strength1.unit !== strength2.unit) return false;
    
    const ratio = strength1.value / strength2.value;
    return ratio >= 0.5 && ratio <= 2.0;
  }

  removeDuplicates(substitutes, originalId) {
    const seen = new Set([originalId.toString()]);
    const seenNames = new Set([]);
    
    return substitutes.filter(substitute => {
      const id = substitute.id.toString();
      const name = substitute.name.toLowerCase();
      
      // Skip if we've seen this ID or name before
      if (seen.has(id) || seenNames.has(name)) {
        return false;
      }
      
      seen.add(id);
      seenNames.add(name);
      return true;
    });
  }

  getAveragePrice(medicineId) {
    // Generate consistent simulated prices based on medicine ID
    const hash = medicineId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Generate price between $5 and $50
    return Math.abs(hash % 45) + 5;
  }

  comparePrices(originalId, substituteId) {
    const originalPrice = this.getAveragePrice(originalId);
    const substitutePrice = this.getAveragePrice(substituteId);
    
    const difference = ((substitutePrice - originalPrice) / originalPrice) * 100;
    
    return {
      originalPrice: Math.round(originalPrice * 100) / 100,
      substitutePrice: Math.round(substitutePrice * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      comparison: difference < -10 ? 'cheaper' : difference > 10 ? 'expensive' : 'similar',
      dataAvailable: true
    };
  }

  checkAvailability(medicineId) {
    // Generate consistent simulated availability based on medicine ID
    const hash = medicineId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const availableAt = Math.abs(hash % 8) + 2; // 2-9 pharmacies
    const totalPharmacies = 10;
    const totalStock = Math.abs(hash % 100) + 10; // 10-109 stock
    
    return {
      availableAt,
      totalPharmacies,
      totalStock,
      availability: availableAt > 0 ? 'available' : 'out_of_stock',
      availabilityPercentage: Math.round((availableAt / totalPharmacies) * 100)
    };
  }

  calculateSafetyRating(medicine) {
    let rating = 4.0;
    
    if (medicine.therapeuticClass.toLowerCase().includes('antibiotic')) {
      rating -= 0.2;
    }
    
    if (medicine.therapeuticClass.toLowerCase().includes('pain')) {
      rating -= 0.1;
    }
    
    rating += (Math.random() - 0.5) * 0.4;
    
    return Math.max(1.0, Math.min(5.0, Math.round(rating * 10) / 10));
  }
}

module.exports = new SubstituteEngine();