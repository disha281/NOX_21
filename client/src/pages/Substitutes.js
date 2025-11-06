import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Rating,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  LocalPharmacy,
  AttachMoney,
  Inventory,
  Star,
  CheckCircle,
  Warning,
  Info,
  TrendingDown,
  TrendingUp,
  Remove
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Substitutes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const medicineId = searchParams.get('id');
  const [originalMedicine, setOriginalMedicine] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicineId) {
      fetchSubstitutes();
    } else {
      setError('Medicine ID is required');
      setLoading(false);
    }
  }, [medicineId]);

  const fetchSubstitutes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/medicine/${medicineId}/substitutes`);
      setOriginalMedicine(response.data.originalMedicine);
      setSubstitutes(response.data.substitutes);
    } catch (error) {
      setError('Error fetching substitutes. Please try again.');
      console.error('Substitutes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubstituteTypeColor = (type) => {
    switch (type) {
      case 'generic':
        return 'success';
      case 'therapeutic':
        return 'primary';
      case 'dosage':
        return 'secondary';
      case 'alternative':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSubstituteTypeIcon = (type) => {
    switch (type) {
      case 'generic':
        return <CheckCircle />;
      case 'therapeutic':
        return <LocalPharmacy />;
      case 'dosage':
        return <Info />;
      case 'alternative':
        return <Warning />;
      default:
        return <Info />;
    }
  };

  const getPriceIcon = (comparison) => {
    switch (comparison) {
      case 'cheaper':
        return <TrendingDown color="success" />;
      case 'expensive':
        return <TrendingUp color="error" />;
      case 'similar':
        return <Remove color="action" />;
      default:
        return <Remove color="action" />;
    }
  };

  const formatPrice = (price) => {
    if (price === 'N/A') return 'N/A';
    return `₹${price}`;
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.9) return 'success';
    if (similarity >= 0.7) return 'primary';
    if (similarity >= 0.5) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Finding substitutes...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Medicine Substitutes
        </Typography>
      </Box>

      {/* Original Medicine Info */}
      {originalMedicine && (
        <Card sx={{ mb: 4, bgcolor: 'primary.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Original Medicine
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {originalMedicine.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Generic Name:</strong> {originalMedicine.genericName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Salt Composition:</strong> {originalMedicine.saltComposition}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Therapeutic Class:</strong> {originalMedicine.therapeuticClass}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" color="text.secondary">
                  <strong>Manufacturer:</strong> {originalMedicine.manufacturer}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Category:</strong> {originalMedicine.category}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Strength:</strong> {originalMedicine.strength}
                </Typography>
                <Chip 
                  label={originalMedicine.prescriptionRequired ? "Prescription Required" : "Over the Counter"}
                  color={originalMedicine.prescriptionRequired ? "warning" : "success"}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Substitutes Results */}
      {substitutes.length > 0 ? (
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h6">
              Found {substitutes.length} Substitute{substitutes.length !== 1 ? 's' : ''}
            </Typography>
            <Chip 
              label={`All from ${originalMedicine?.therapeuticClass} class`}
              color="info"
              size="small"
              variant="outlined"
            />
          </Box>
          
          <Grid container spacing={3}>
            {substitutes.map((substitute, index) => (
              <Grid item xs={12} md={6} lg={4} key={substitute.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: substitute.doctorRecommended ? '2px solid' : '1px solid',
                    borderColor: substitute.doctorRecommended ? 'success.main' : 'divider',
                    position: 'relative'
                  }}
                >
                  {substitute.doctorRecommended && (
                    <Chip
                      label="Doctor Recommended"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  <CardContent>
                    {/* Substitute Type Badge */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getSubstituteTypeColor(substitute.substituteType)}.main`,
                          width: 32,
                          height: 32
                        }}
                      >
                        {getSubstituteTypeIcon(substitute.substituteType)}
                      </Avatar>
                      <Chip
                        label={substitute.substituteType.charAt(0).toUpperCase() + substitute.substituteType.slice(1)}
                        color={getSubstituteTypeColor(substitute.substituteType)}
                        size="small"
                      />
                      <Chip
                        label={`${Math.round(substitute.similarity * 100)}% match`}
                        color={getSimilarityColor(substitute.similarity)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Medicine Name */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {substitute.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Generic:</strong> {substitute.genericName}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Therapeutic Class:</strong> {substitute.therapeuticClass}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Reason:</strong> {substitute.reason}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Price Comparison */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {getPriceIcon(substitute.priceComparison.comparison)}
                      <Typography variant="body2" fontWeight="bold">
                        Price: {formatPrice(substitute.priceComparison.substitutePrice)}
                      </Typography>
                      {substitute.priceComparison.dataAvailable && (
                        <Chip
                          label={`${substitute.priceComparison.difference > 0 ? '+' : ''}${substitute.priceComparison.difference.toFixed(1)}%`}
                          color={substitute.priceComparison.comparison === 'cheaper' ? 'success' : 
                                 substitute.priceComparison.comparison === 'expensive' ? 'error' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {/* Availability */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Inventory fontSize="small" />
                      <Typography variant="body2">
                        Available at {substitute.availability.availableAt}/{substitute.availability.totalPharmacies} pharmacies
                      </Typography>
                      <Chip
                        label={`${substitute.availability.availabilityPercentage}%`}
                        color={substitute.availability.availabilityPercentage > 70 ? 'success' : 
                               substitute.availability.availabilityPercentage > 40 ? 'warning' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Safety Rating */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Star fontSize="small" />
                      <Typography variant="body2">
                        Safety Rating:
                      </Typography>
                      <Rating 
                        value={substitute.safetyRating} 
                        readOnly 
                        size="small" 
                        precision={0.1}
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({substitute.safetyRating}/5.0)
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(substitute.name)}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/compare?medicine=${substitute.id}`)}
                      >
                        Compare Prices
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Legend */}
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Substitute Types
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label="Generic" color="success" size="small" />
                  <Typography variant="body2">Same active ingredient, same class</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label="Therapeutic" color="primary" size="small" />
                  <Typography variant="body2">Same therapeutic class</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label="Dosage" color="secondary" size="small" />
                  <Typography variant="body2">Similar dosage, same class</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label="Indication" color="warning" size="small" />
                  <Typography variant="body2">Same indication, same class</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      ) : (
        <Alert severity="info">
          No substitutes found for this medicine. This could mean:
          <ul>
            <li>The medicine has a unique formulation</li>
            <li>No generic alternatives are available</li>
            <li>The medicine is not in our substitute database</li>
          </ul>
          Please consult with your doctor or pharmacist for alternative options.
        </Alert>
      )}
    </Container>
  );
};

export default Substitutes;