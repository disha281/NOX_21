const { pharmacies } = require('../data/pharmacies');
const { calculateDistance } = require('../utils/geoUtils');

class RecommendationEngine {
  constructor() {
    this.defaultWeights = {
      price: 0.4,
      distance: 0.4,
      availability: 0.2
    };
  }

  async getPharmacyRecommendations({ medicine, userLocation, preferences = {} }) {
    try {
      const { lat, lng } = userLocation;
      const weights = { ...this.defaultWeights, ...preferences };

      // Find pharmacies with the medicine in stock
      const availablePharmacies = this.findPharmaciesWithMedicine(medicine.id);
      
      if (availablePharmacies.length === 0) {
        return [];
      }

      // Calculate scores for each pharmacy
      const scoredPharmacies = availablePharmacies.map(pharmacy => {
        const distance = calculateDistance(lat, lng, pharmacy.lat, pharmacy.lng);
        const medicineInfo = pharmacy.inventory.find(item => item.medicineId === medicine.id);
        
        const scores = this.calculatePharmacyScores({
          pharmacy,
          medicineInfo,
          distance,
          weights
        });

        return {
          pharmacy: {
            id: pharmacy.id,
            name: pharmacy.name,
            address: pharmacy.address,
            phone: pharmacy.phone,
            rating: pharmacy.rating,
            lat: pharmacy.lat,
            lng: pharmacy.lng,
            openHours: pharmacy.openHours
          },
          medicine: {
            price: medicineInfo.price,
            stock: medicineInfo.stock,
            discount: medicineInfo.discount || 0
          },
          distance: Math.round(distance * 100) / 100,
          totalScore: scores.totalScore,
          scoreBreakdown: scores.breakdown,
          reasoning: this.generateReasoning(scores, distance, medicineInfo)
        };
      });

      // Sort by total score (highest first)
      scoredPharmacies.sort((a, b) => b.totalScore - a.totalScore);

      return scoredPharmacies;
    } catch (error) {
      throw new Error(`Recommendation engine error: ${error.message}`);
    }
  }

  findPharmaciesWithMedicine(medicineId) {
    return pharmacies.filter(pharmacy => 
      pharmacy.inventory.some(item => 
        item.medicineId === medicineId && item.stock > 0
      )
    );
  }

  calculatePharmacyScores({ pharmacy, medicineInfo, distance, weights }) {
    // Normalize scores to 0-1 range
    const priceScore = this.calculatePriceScore(medicineInfo.price, medicineId);
    const distanceScore = this.calculateDistanceScore(distance);
    const availabilityScore = this.calculateAvailabilityScore(medicineInfo.stock);
    const ratingScore = pharmacy.rating / 5; // Assuming 5-star rating system

    const totalScore = (
      (priceScore * weights.priceWeight || weights.price) +
      (distanceScore * weights.distanceWeight || weights.distance) +
      (availabilityScore * weights.availabilityWeight || weights.availability) +
      (ratingScore * 0.1) // Small weight for pharmacy rating
    );

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        price: Math.round(priceScore * 100) / 100,
        distance: Math.round(distanceScore * 100) / 100,
        availability: Math.round(availabilityScore * 100) / 100,
        rating: Math.round(ratingScore * 100) / 100
      }
    };
  }

  calculatePriceScore(price, medicineId) {
    // Get price range for this medicine across all pharmacies
    const allPrices = this.getAllPricesForMedicine(medicineId);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    if (minPrice === maxPrice) return 1;
    
    // Lower price = higher score (inverted normalization)
    return 1 - ((price - minPrice) / (maxPrice - minPrice));
  }

  calculateDistanceScore(distance) {
    // Closer distance = higher score
    // Assuming max reasonable distance is 20km
    const maxDistance = 20;
    return Math.max(0, 1 - (distance / maxDistance));
  }

  calculateAvailabilityScore(stock) {
    // Higher stock = higher score
    // Normalize based on typical stock levels
    if (stock >= 50) return 1;
    if (stock >= 20) return 0.8;
    if (stock >= 10) return 0.6;
    if (stock >= 5) return 0.4;
    if (stock >= 1) return 0.2;
    return 0;
  }

  getAllPricesForMedicine(medicineId) {
    const prices = [];
    pharmacies.forEach(pharmacy => {
      const medicineInfo = pharmacy.inventory.find(item => item.medicineId === medicineId);
      if (medicineInfo) {
        prices.push(medicineInfo.price);
      }
    });
    return prices;
  }

  generateReasoning(scores, distance, medicineInfo) {
    const reasons = [];
    
    if (scores.breakdown.price > 0.8) {
      reasons.push('Excellent price');
    } else if (scores.breakdown.price > 0.6) {
      reasons.push('Good price');
    }
    
    if (scores.breakdown.distance > 0.8) {
      reasons.push('Very close location');
    } else if (scores.breakdown.distance > 0.6) {
      reasons.push('Nearby location');
    }
    
    if (scores.breakdown.availability > 0.8) {
      reasons.push('High stock availability');
    } else if (scores.breakdown.availability > 0.4) {
      reasons.push('Medicine in stock');
    }
    
    if (medicineInfo.discount > 0) {
      reasons.push(`${medicineInfo.discount}% discount available`);
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Available option';
  }

  async getPriceTrend(medicineId, days = 30) {
    // Simulate price trend data
    // In real implementation, this would query historical price data
    const trend = [];
    const basePrice = this.getAveragePriceForMedicine(medicineId);
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate price fluctuation
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const averagePrice = basePrice * (1 + variation);
      
      trend.push({
        date: date.toISOString().split('T')[0],
        averagePrice: Math.round(averagePrice * 100) / 100,
        lowestPrice: Math.round(averagePrice * 0.9 * 100) / 100,
        highestPrice: Math.round(averagePrice * 1.1 * 100) / 100,
        pharmacyCount: Math.floor(Math.random() * 10) + 5
      });
    }
    
    return trend;
  }

  getAveragePriceForMedicine(medicineId) {
    const prices = this.getAllPricesForMedicine(medicineId);
    return prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
  }

  async getPersonalizedRecommendations({ medicine, userLocation, userPreferences, userId }) {
    // Adjust weights based on user preferences
    const personalizedWeights = {
      priceWeight: userPreferences.priceWeight,
      distanceWeight: userPreferences.distanceWeight,
      availabilityWeight: userPreferences.availabilityWeight
    };

    let recommendations = await this.getPharmacyRecommendations({
      medicine,
      userLocation,
      preferences: personalizedWeights
    });

    // Filter by budget range if specified
    if (userPreferences.budgetRange) {
      recommendations = recommendations.filter(rec => 
        rec.medicine.price >= userPreferences.budgetRange.min &&
        rec.medicine.price <= userPreferences.budgetRange.max
      );
    }

    // Boost preferred pharmacies
    if (userPreferences.preferredPharmacies && userPreferences.preferredPharmacies.length > 0) {
      recommendations = recommendations.map(rec => {
        if (userPreferences.preferredPharmacies.includes(rec.pharmacy.id)) {
          return {
            ...rec,
            totalScore: rec.totalScore + 0.1, // Boost score for preferred pharmacies
            reasoning: `${rec.reasoning}, Preferred pharmacy`
          };
        }
        return rec;
      });
      
      // Re-sort after boosting
      recommendations.sort((a, b) => b.totalScore - a.totalScore);
    }

    return recommendations;
  }

  // Emergency-specific recommendations
  async getEmergencyRecommendations({ medicine, userLocation }) {
    const emergencyWeights = {
      priceWeight: 0.1,
      distanceWeight: 0.7,
      availabilityWeight: 0.2
    };

    const recommendations = await this.getPharmacyRecommendations({
      medicine,
      userLocation,
      preferences: emergencyWeights
    });

    // Filter for 24/7 pharmacies or currently open ones
    const currentHour = new Date().getHours();
    const emergencyRecommendations = recommendations.filter(rec => {
      const pharmacy = rec.pharmacy;
      return pharmacy.is24x7 || this.isPharmacyOpen(pharmacy.openHours, currentHour);
    });

    return emergencyRecommendations.length > 0 ? emergencyRecommendations : recommendations.slice(0, 3);
  }

  isPharmacyOpen(openHours, currentHour) {
    // Simple check - in real app, this would be more sophisticated
    if (!openHours) return false;
    
    const [openTime, closeTime] = openHours.split('-').map(time => parseInt(time));
    return currentHour >= openTime && currentHour < closeTime;
  }
}

module.exports = new RecommendationEngine();