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
      
      // 1. Find exact salt composition matches (Generic equivalents)
      const exactMatches = this.findBySaltComposition(medicine);
      substitutes.push(...exactMatches.map(sub => ({
        ...sub,
        substituteType: 'generic',
        similarity: 1.0,
        reason: 'Same active ingredient'
      })));

      // 2. Find therapeutic class matches (Alternative treatments)
      const therapeuticMatches = this.findByTherapeuticClass(medicine);
      substitutes.push(...therapeuticMatches.map(sub => ({
        ...sub,
        substituteType: 'therapeutic',
        similarity: 0.8,
        reason: 'Same therapeutic class'
      })));

      // 3. Find similar strength/dosage matches
      const dosageMatches = this.findBySimilarDosage(medicine);
      substitutes.push(...dosageMatches.map(sub => ({
        ...sub,
        substituteType: 'dosage',
        similarity: 0.7,
        reason: 'Similar dosage form'
      })));

      // Remove duplicates and the original medicine
      const uniqueSubstitutes = this.removeDuplicates(substitutes, medicine.id);

      // Sort by similarity and price
      uniqueSubstitutes.sort((a, b) => {
        if (a.similarity !== b.similarity) {
          return b.similarity - a.similarity;
        }
        return this.getAveragePrice(a.id) - this.getAveragePrice(b.id);
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
      throw new Error(`Substitute finding error: ${error.message}`);
    }
  }

  findBySaltComposition(medicine) {
    const salt = medicine.saltComposition.toLowerCase();
    const matches = this.saltCompositionMap.get(salt) || [];
    return matches.filter(m => m.id !== medicine.id);
  }

  findByTherapeuticClass(medicine) {
    const therapeuticClass = medicine.therapeuticClass.toLowerCase();
    const matches = this.therapeuticClassMap.get(therapeuticClass) || [];
    return matches.filter(m => 
      m.id !== medicine.id && 
      m.saltComposition.toLowerCase() !== medicine.saltComposition.toLowerCase()
    );
  }

  findBySimilarDosage(medicine) {
    const dosageForm = this.extractDosageForm(medicine.name);
    const strength = this.extractStrength(medicine.name);
    const medicineData = csvLoader.getMedicines();
    
    return medicineData.filter(m => {
      if (m.id === medicine.id) return false;
      
      const mDosageForm = this.extractDosageForm(m.name);
      const mStrength = this.extractStrength(m.name);
      
      return mDosageForm === dosageForm && this.isSimilarStrength(strength, mStrength);
    });
  }

  extractDosageForm(medicineName) {
    const forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops'];
    const name = medicineName.toLowerCase();
    
    for (const form of forms) {
      if (name.includes(form)) {
        return form;
      }
    }
    return 'tablet'; // default
  }

  extractStrength(medicineName) {
    const strengthMatch = medicineName.match(/(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg)/i);
    return strengthMatch ? {
      value: parseFloat(strengthMatch[1]),
      unit: strengthMatch[2].toLowerCase()
    } : null;
  }

  isSimilarStrength(strength1, strength2) {
    if (!strength1 || !strength2) return false;
    if (strength1.unit !== strength2.unit) return false;
    
    const ratio = strength1.value / strength2.value;
    return ratio >= 0.5 && ratio <= 2.0; // Within 50%-200% range
  }

  removeDuplicates(substitutes, originalId) {
    const seen = new Set([originalId]);
    return substitutes.filter(substitute => {
      if (seen.has(substitute.id)) {
        return false;
      }
      seen.add(substitute.id);
      return true;
    });
  }

  getAveragePrice(medicineId) {
    // Calculate average price across all pharmacies
    const { pharmacies } = require('../data/pharmacies');
    const prices = [];
    
    pharmacies.forEach(pharmacy => {
      const medicineInfo = pharmacy.inventory.find(item => item.medicineId === medicineId);
      if (medicineInfo) {
        prices.push(medicineInfo.price);
      }
    });
    
    return prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
  }

  comparePrices(originalId, substituteId) {
    const originalPrice = this.getAveragePrice(originalId);
    const substitutePrice = this.getAveragePrice(substituteId);
    
    if (originalPrice === 0 || substitutePrice === 0) {
      return { comparison: 'unknown', difference: 0 };
    }
    
    const difference = ((substitutePrice - originalPrice) / originalPrice) * 100;
    
    return {
      originalPrice: Math.round(originalPrice * 100) / 100,
      substitutePrice: Math.round(substitutePrice * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      comparison: difference < -10 ? 'cheaper' : difference > 10 ? 'expensive' : 'similar'
    };
  }

  checkAvailability(medicineId) {
    const { pharmacies } = require('../data/pharmacies');
    let totalStock = 0;
    let pharmacyCount = 0;
    
    pharmacies.forEach(pharmacy => {
      const medicineInfo = pharmacy.inventory.find(item => item.medicineId === medicineId);
      if (medicineInfo && medicineInfo.stock > 0) {
        totalStock += medicineInfo.stock;
        pharmacyCount++;
      }
    });
    
    return {
      availableAt: pharmacyCount,
      totalPharmacies: pharmacies.length,
      totalStock,
      availability: pharmacyCount > 0 ? 'available' : 'out_of_stock',
      availabilityPercentage: Math.round((pharmacyCount / pharmacies.length) * 100)
    };
  }

  calculateSafetyRating(medicine) {
    // Simulate safety rating based on various factors
    let rating = 4.0; // Base rating
    
    // Adjust based on medicine type
    if (medicine.therapeuticClass.toLowerCase().includes('antibiotic')) {
      rating -= 0.2; // Antibiotics need more caution
    }
    
    if (medicine.therapeuticClass.toLowerCase().includes('pain')) {
      rating -= 0.1; // Pain medications need caution
    }
    
    // Add some randomness for demo
    rating += (Math.random() - 0.5) * 0.4;
    
    return Math.max(1.0, Math.min(5.0, Math.round(rating * 10) / 10));
  }

  // Advanced substitute finding with AI-like scoring
  async findAdvancedSubstitutes(medicine, userPreferences = {}) {
    const basicSubstitutes = await this.findSubstitutes(medicine);
    
    // Apply advanced scoring based on user preferences
    return basicSubstitutes.map(substitute => {
      let advancedScore = substitute.similarity;
      
      // Adjust score based on user preferences
      if (userPreferences.preferGeneric && substitute.substituteType === 'generic') {
        advancedScore += 0.1;
      }
      
      if (userPreferences.budgetConscious) {
        const priceRatio = substitute.priceComparison.substitutePrice / substitute.priceComparison.originalPrice;
        if (priceRatio < 0.8) advancedScore += 0.15; // Cheaper options get boost
      }
      
      if (userPreferences.availabilityImportant) {
        const availabilityBoost = substitute.availability.availabilityPercentage / 100 * 0.1;
        advancedScore += availabilityBoost;
      }
      
      return {
        ...substitute,
        advancedScore: Math.round(advancedScore * 100) / 100,
        recommendationReason: this.generateRecommendationReason(substitute, userPreferences)
      };
    }).sort((a, b) => b.advancedScore - a.advancedScore);
  }

  generateRecommendationReason(substitute, preferences) {
    const reasons = [];
    
    if (substitute.substituteType === 'generic') {
      reasons.push('Same active ingredient');
    }
    
    if (substitute.priceComparison.comparison === 'cheaper') {
      reasons.push(`${Math.abs(substitute.priceComparison.difference)}% cheaper`);
    }
    
    if (substitute.availability.availabilityPercentage > 80) {
      reasons.push('Widely available');
    }
    
    if (substitute.safetyRating >= 4.5) {
      reasons.push('High safety rating');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Alternative option';
  }

  // Method to check drug interactions
  async checkDrugInteractions(medicine1Id, medicine2Id) {
    // Simulate drug interaction checking
    // In real implementation, this would use a drug interaction database
    const medicine1 = medicineData.find(m => m.id === medicine1Id);
    const medicine2 = medicineData.find(m => m.id === medicine2Id);
    
    if (!medicine1 || !medicine2) {
      return { error: 'Medicine not found' };
    }
    
    // Simple simulation - check if same therapeutic class
    const sameClass = medicine1.therapeuticClass === medicine2.therapeuticClass;
    
    return {
      hasInteraction: sameClass && Math.random() > 0.7, // Random for demo
      severity: sameClass ? 'moderate' : 'low',
      description: sameClass ? 
        'May have additive effects when used together' : 
        'No known significant interactions',
      recommendation: sameClass ? 
        'Consult doctor before combining' : 
        'Generally safe to use together'
    };
  }
}

module.exports = new SubstituteEngine();