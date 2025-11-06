const fs = require('fs');
const path = require('path');

class CSVLoader {
  constructor() {
    this.medicines = [];
    this.loaded = false;
  }

  loadMedicineData() {
    if (this.loaded) {
      return this.medicines;
    }

    try {
      const csvPath = path.join(__dirname, '../../medicine_dataset.csv');
      const csvData = fs.readFileSync(csvPath, 'utf8');
      const lines = csvData.split('\n');
      
      // Skip header row
      lines[0].split(','); // Header row (not used)
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length >= 7) {
          const medicine = {
            id: `med_${i.toString().padStart(5, '0')}`,
            name: values[0] || 'Unknown Medicine',
            category: values[1] || 'General',
            dosageForm: values[2] || 'Tablet',
            strength: values[3] || '0 mg',
            manufacturer: values[4] || 'Unknown Manufacturer',
            indication: values[5] || 'General Use',
            classification: values[6] || 'Over-the-Counter',
            // Derived fields for compatibility
            genericName: this.extractGenericName(values[0]),
            saltComposition: this.extractSaltComposition(values[0]) || values[0] || 'Unknown',
            therapeuticClass: values[1] || 'General',
            prescriptionRequired: (values[6] || '').toLowerCase().includes('prescription'),
            popularity: Math.floor(Math.random() * 100) + 1,
            description: `${values[1]} medication for ${values[5]}`,
            sideEffects: this.generateSideEffects(values[1]),
            dosage: this.generateDosage(values[2]),
            maxDailyDose: this.calculateMaxDose(values[3])
          };
          
          this.medicines.push(medicine);
        }
      }
      
      this.loaded = true;
      console.log(`✅ Loaded ${this.medicines.length} medicines from CSV`);
      return this.medicines;
      
    } catch (error) {
      console.error('Error loading CSV data:', error);
      return [];
    }
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  extractGenericName(medicineName) {
    // Extract generic name by removing common suffixes
    const name = medicineName || '';
    const suffixes = ['cillin', 'mycin', 'profen', 'statin', 'nazole', 'phen', 'met', 'vir'];
    
    for (const suffix of suffixes) {
      if (name.toLowerCase().includes(suffix)) {
        return name.replace(new RegExp(suffix, 'gi'), '').trim() || name;
      }
    }
    
    return name;
  }

  extractSaltComposition(medicineName) {
    // Extract active ingredient/salt composition from medicine name
    const name = (medicineName || '').toLowerCase();
    
    // Common active ingredients mapping - more specific
    const saltMap = {
      'paracetamol': 'acetaminophen',
      'acetaminophen': 'acetaminophen', 
      'aspirin': 'acetylsalicylic acid',
      'ibuprofen': 'ibuprofen',
      'amoxicillin': 'amoxicillin',
      'omeprazole': 'omeprazole',
      'metformin': 'metformin',
      'lisinopril': 'lisinopril',
      'atorvastatin': 'atorvastatin',
      'simvastatin': 'simvastatin',
      'amlodipine': 'amlodipine',
      'losartan': 'losartan',
      'hydrochlorothiazide': 'hydrochlorothiazide',
      'ciprofloxacin': 'ciprofloxacin',
      'azithromycin': 'azithromycin',
      'cephalexin': 'cephalexin',
      'doxycycline': 'doxycycline',
      'prednisone': 'prednisone',
      'warfarin': 'warfarin',
      'insulin': 'insulin'
    };
    
    // Find matching salt composition
    for (const [medicine, salt] of Object.entries(saltMap)) {
      if (name.includes(medicine)) {
        return salt;
      }
    }
    
    // Extract suffix-based groupings for more specific matching
    const suffixes = ['cillin', 'mycin', 'profen', 'statin', 'nazole', 'phen', 'met', 'vir'];
    for (const suffix of suffixes) {
      if (name.includes(suffix)) {
        return `${suffix}_group`; // Group by suffix
      }
    }
    
    // If no specific mapping found, use the full name to avoid over-grouping
    return name || 'unknown';
  }

  generateSideEffects(category) {
    const sideEffectsMap = {
      'Antibiotic': ['Nausea', 'Diarrhea', 'Stomach upset', 'Allergic reactions'],
      'Analgesic': ['Drowsiness', 'Stomach irritation', 'Dizziness'],
      'Antipyretic': ['Nausea', 'Liver damage (overdose)', 'Skin rash'],
      'Antifungal': ['Headache', 'Nausea', 'Liver problems'],
      'Antiviral': ['Fatigue', 'Headache', 'Nausea'],
      'Antidepressant': ['Drowsiness', 'Dry mouth', 'Weight changes'],
      'Antidiabetic': ['Hypoglycemia', 'Nausea', 'Weight gain'],
      'Antiseptic': ['Skin irritation', 'Allergic reactions']
    };
    
    return sideEffectsMap[category] || ['Consult doctor for side effects'];
  }

  generateDosage(dosageForm) {
    const dosageMap = {
      'Tablet': '1-2 tablets as directed',
      'Capsule': '1 capsule as directed',
      'Syrup': '5-10ml as directed',
      'Injection': 'As per medical supervision',
      'Ointment': 'Apply thin layer as needed',
      'Cream': 'Apply to affected area',
      'Drops': '2-3 drops as directed',
      'Inhaler': '1-2 puffs as needed'
    };
    
    return dosageMap[dosageForm] || 'As directed by physician';
  }

  calculateMaxDose(strength) {
    const match = strength.match(/(\d+)\s*mg/);
    if (match) {
      const dose = parseInt(match[1]);
      return `${dose * 4}mg`; // Assuming max 4 times daily
    }
    return '2000mg';
  }

  getMedicines() {
    return this.loadMedicineData();
  }

  searchMedicines(query, limit = 10) {
    const medicines = this.getMedicines();
    const searchTerm = query.toLowerCase();
    
    return medicines
      .filter(medicine => 
        medicine.name.toLowerCase().includes(searchTerm) ||
        medicine.genericName.toLowerCase().includes(searchTerm) ||
        medicine.category.toLowerCase().includes(searchTerm) ||
        medicine.indication.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  }

  getMedicineById(id) {
    const medicines = this.getMedicines();
    return medicines.find(medicine => medicine.id === id);
  }

  getPopularMedicines(limit = 20) {
    const medicines = this.getMedicines();
    return medicines
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }
}

module.exports = new CSVLoader();