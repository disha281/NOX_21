const express = require('express');
const multer = require('multer');
const router = express.Router();
const ocrService = require('../services/ocrService');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Process prescription image
router.post('/prescription', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageBuffer = req.file.buffer;
    const result = await ocrService.processPrescription(imageBuffer);

    res.json({
      success: true,
      extractedText: result.text,
      medicines: result.medicines,
      medicineCount: result.medicineCount,
      confidence: result.confidence,
      processingTime: result.processingTime,
      extractionMethod: result.extractionMethod,
      ocrConfidence: result.ocrConfidence,
      error: result.error
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process prescription image',
      details: error.message 
    });
  }
});

// Process medicine name from image
router.post('/medicine-name', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageBuffer = req.file.buffer;
    const result = await ocrService.extractMedicineName(imageBuffer);

    res.json({
      success: true,
      extractedText: result.text,
      medicineName: result.medicineName,
      confidence: result.confidence,
      processingTime: result.processingTime
    });
  } catch (error) {
    console.error('Medicine name extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract medicine name from image',
      details: error.message 
    });
  }
});

// Get detailed medicine information
router.get('/medicine/:id', (req, res) => {
  try {
    const medicineId = req.params.id;
    const csvLoader = require('../services/csvLoader');
    
    const medicine = csvLoader.getMedicineById(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ 
        error: 'Medicine not found',
        id: medicineId 
      });
    }

    res.json({
      success: true,
      medicine: {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        category: medicine.category,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        manufacturer: medicine.manufacturer,
        indication: medicine.indication,
        classification: medicine.classification,
        saltComposition: medicine.saltComposition,
        therapeuticClass: medicine.therapeuticClass,
        prescriptionRequired: medicine.prescriptionRequired,
        description: medicine.description,
        sideEffects: medicine.sideEffects,
        dosage: medicine.dosage,
        maxDailyDose: medicine.maxDailyDose
      }
    });
  } catch (error) {
    console.error('Medicine details error:', error);
    res.status(500).json({ 
      error: 'Failed to get medicine details',
      details: error.message 
    });
  }
});

// Health check for OCR service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'OCR Service',
    status: 'operational',
    supportedFormats: ['jpg', 'jpeg', 'png', 'bmp', 'tiff'],
    maxFileSize: '10MB'
  });
});

module.exports = router;