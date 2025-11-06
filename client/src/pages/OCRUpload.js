import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  Description,
  LocalPharmacy,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OCRUpload = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState('');
  const [medicineDetails, setMedicineDetails] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setError('');
      setOcrResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.bmp', '.tiff']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload an image file.');
      } else {
        setError('File upload failed. Please try again.');
      }
    }
  });

  const processPrescription = async () => {
    if (!uploadedFile) return;

    setProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('prescription', uploadedFile);

    try {
      const response = await axios.post('/api/ocr/prescription', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOcrResult(response.data);
      
      // Fetch detailed information for each detected medicine
      if (response.data.medicines && response.data.medicines.length > 0) {
        const details = {};
        for (const medicine of response.data.medicines) {
          if (medicine.fromDatabase && medicine.id) {
            try {
              const detailResponse = await axios.get(`/api/ocr/medicine/${medicine.id}`);
              if (detailResponse.data.success) {
                details[medicine.id] = detailResponse.data.medicine;
              }
            } catch (detailError) {
              console.warn(`Failed to fetch details for ${medicine.name}:`, detailError);
            }
          }
        }
        setMedicineDetails(details);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process prescription. Please try again.');
      console.error('OCR processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const searchMedicine = (medicine) => {
    navigate(`/search?q=${encodeURIComponent(medicine.name)}`);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setOcrResult(null);
    setError('');
    setMedicineDetails({});
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Prescription OCR Upload
      </Typography>
      
      <Typography variant="body1" color="text.secondary" mb={4}>
        Upload a photo of your prescription and our AI will extract medicine names automatically
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Prescription Image
              </Typography>

              {!uploadedFile ? (
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Drop the image here' : 'Drag & drop prescription image'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    or click to select file
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: JPG, PNG, BMP, TIFF (Max 10MB)
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircle />
                      <Typography>
                        File uploaded: {uploadedFile.name}
                      </Typography>
                    </Box>
                  </Alert>

                  {/* Image Preview */}
                  <Box mb={2}>
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt="Prescription preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                      }}
                    />
                  </Box>

                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      onClick={processPrescription}
                      disabled={processing}
                      startIcon={processing ? <CircularProgress size={20} /> : <CameraAlt />}
                    >
                      {processing ? 'Processing...' : 'Process Prescription'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={resetUpload}
                      disabled={processing}
                    >
                      Upload Different Image
                    </Button>
                  </Box>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips for Better Results
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                      <Typography variant="caption">1</Typography>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Ensure good lighting and clear image quality" />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                      <Typography variant="caption">2</Typography>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Keep the prescription flat and avoid shadows" />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                      <Typography variant="caption">3</Typography>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Make sure medicine names are clearly visible" />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                      <Typography variant="caption">4</Typography>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Avoid blurry or tilted images" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          {ocrResult && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Extraction Results
                </Typography>

                <Box mb={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Processing Time: {ocrResult.processingTime}ms | 
                    Confidence: {Math.round(ocrResult.confidence * 100)}%
                    {ocrResult.extractionMethod && (
                      <> | Method: {ocrResult.extractionMethod.replace(/_/g, ' ')}</>
                    )}
                    {ocrResult.ocrConfidence && (
                      <> | OCR Confidence: {ocrResult.ocrConfidence}%</>
                    )}
                  </Typography>
                  {ocrResult.error && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {ocrResult.error}
                    </Alert>
                  )}
                </Box>

                {/* Extracted Medicines */}
                {ocrResult.medicines && ocrResult.medicines.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Detected Medicines ({ocrResult.medicines.length})
                    </Typography>
                    
                    <List>
                      {ocrResult.medicines.map((medicine, index) => {
                        const details = medicineDetails[medicine.id];
                        return (
                          <React.Fragment key={medicine.id}>
                            <Card
                              sx={{
                                mb: 2,
                                border: '2px solid',
                                borderColor: 'success.main',
                                backgroundColor: 'success.light',
                                '&:hover': {
                                  boxShadow: 3,
                                },
                              }}
                            >
                              <CardContent>
                                {/* Medicine Name Header */}
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                  <Avatar sx={{ bgcolor: 'success.main' }}>
                                    <LocalPharmacy />
                                  </Avatar>
                                  <Typography 
                                    variant="h5" 
                                    fontWeight="bold"
                                    sx={{ 
                                      color: 'success.dark',
                                      backgroundColor: 'white',
                                      px: 2,
                                      py: 1,
                                      borderRadius: 2,
                                      display: 'inline-block',
                                      boxShadow: 1
                                    }}
                                  >
                                    {medicine.name}
                                  </Typography>
                                  <Chip
                                    label={`${Math.round(medicine.confidence * 100)}% Match`}
                                    size="medium"
                                    color="success"
                                    variant="filled"
                                  />
                                  {medicine.fromDatabase && (
                                    <Chip
                                      label="✓ Verified"
                                      size="medium"
                                      color="info"
                                      variant="filled"
                                    />
                                  )}
                                </Box>

                                {/* Medicine Details Grid */}
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1 }}>
                                      <Typography variant="h6" color="primary" gutterBottom>
                                        Basic Information
                                      </Typography>
                                      <Typography variant="body1" sx={{ mb: 1 }}>
                                        <strong>Generic Name:</strong> {medicine.genericName}
                                      </Typography>
                                      {details && (
                                        <>
                                          <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Category:</strong> {details.category}
                                          </Typography>
                                          <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Form:</strong> {details.dosageForm}
                                          </Typography>
                                          <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Strength:</strong> {details.strength}
                                          </Typography>
                                          <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Manufacturer:</strong> {details.manufacturer}
                                          </Typography>
                                        </>
                                      )}
                                      {medicine.dosageInfo && medicine.dosageInfo.strength && (
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                          <strong>Detected Strength:</strong> {medicine.dosageInfo.strength}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1 }}>
                                      <Typography variant="h6" color="primary" gutterBottom>
                                        Medical Information
                                      </Typography>
                                      {details && (
                                        <>
                                          <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Indication:</strong> {details.indication}
                                          </Typography>
                                          <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Classification:</strong> {details.classification}
                                          </Typography>
                                          <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Prescription Required:</strong> {details.prescriptionRequired ? 'Yes' : 'No'}
                                          </Typography>
                                          {details.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                              {details.description}
                                            </Typography>
                                          )}
                                        </>
                                      )}
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        <strong>Detection:</strong> {medicine.matchType || 'pattern'} match
                                      </Typography>
                                      {medicine.extractedText && medicine.extractedText !== medicine.name && (
                                        <Typography variant="body2" color="text.secondary">
                                          <strong>Raw Text:</strong> "{medicine.extractedText}"
                                        </Typography>
                                      )}
                                    </Box>
                                  </Grid>
                                </Grid>

                                {/* Action Buttons */}
                                <Box display="flex" gap={2} mt={3} justifyContent="center">
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={() => searchMedicine(medicine)}
                                    startIcon={<LocalPharmacy />}
                                  >
                                    Find Pharmacies
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="large"
                                    onClick={() => navigate(`/substitutes?id=${medicine.id}`)}
                                  >
                                    Find Substitutes
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Box>
                )}

                {/* Raw Extracted Text */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Extracted Text
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {ocrResult.extractedText}
                    </Typography>
                  </Box>
                </Box>


              </CardContent>
            </Card>
          )}

          {!ocrResult && !uploadedFile && (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box textAlign="center">
                <Description sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Upload a prescription to see results here
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Sample Images Section */}
      <Box mt={6}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          How It Works
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  1. Upload Image
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Take a clear photo of your prescription or upload an existing image
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CameraAlt sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  2. AI Processing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our OCR technology extracts medicine names and dosages from the image
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocalPharmacy sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  3. Find Pharmacies
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search for nearby pharmacies with the detected medicines in stock
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default OCRUpload;