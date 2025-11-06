import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
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
  Rating
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  LocalPharmacy,
  Phone,
  DirectionsWalk,
  AttachMoney,
  Inventory,
  Star
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PharmacyMap from '../components/PharmacyMap';

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (searchQuery) {
      searchMedicines(searchQuery);
    }
    getCurrentLocation();
  }, [searchQuery]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  const searchMedicines = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/medicine/search?query=${encodeURIComponent(query)}&limit=10`);
      setMedicines(response.data.results);
      
      if (response.data.results.length > 0) {
        // Auto-select first medicine
        handleMedicineSelect(response.data.results[0]);
      }
    } catch (error) {
      setError('Error searching medicines. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineSelect = async (medicine) => {
    setSelectedMedicine(medicine);
    
    if (userLocation) {
      await Promise.all([
        findNearbyPharmacies(medicine.id),
        getRecommendations(medicine.id)
      ]);
    }
  };

  const findNearbyPharmacies = async (medicineId) => {
    if (!userLocation) return;
    
    try {
      const response = await axios.get('/api/pharmacy/nearby', {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: 20,
          medicineId
        }
      });
      setPharmacies(response.data.pharmacies);
    } catch (error) {
      console.error('Error finding pharmacies:', error);
    }
  };

  const getRecommendations = async (medicineId) => {
    if (!userLocation) return;
    
    try {
      const response = await axios.post('/api/recommendation/pharmacy', {
        medicineId,
        userLocation,
        preferences: {
          priceWeight: 0.4,
          distanceWeight: 0.4,
          availabilityWeight: 0.2
        }
      });
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMedicines(searchQuery);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatPrice = (price) => {
    return `₹${price.toFixed(0)}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Search Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Medicine Search
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for medicines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Search'}
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Medicine Results */}
      {medicines.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Found Medicines ({medicines.length})
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {medicines.map((medicine) => (
              <Box key={medicine.id} display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={`${medicine.name} (${medicine.genericName})`}
                  onClick={() => handleMedicineSelect(medicine)}
                  clickable
                  variant={selectedMedicine?.id === medicine.id ? "filled" : "outlined"}
                  color={selectedMedicine?.id === medicine.id ? "primary" : "default"}
                />
                <Button
                  size="small"
                  variant="text"
                  onClick={() => navigate(`/substitutes?id=${medicine.id}`)}
                  sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                >
                  Substitutes
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Selected Medicine Details */}
      {selectedMedicine && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {selectedMedicine.name}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Generic Name:</strong> {selectedMedicine.genericName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Salt Composition:</strong> {selectedMedicine.saltComposition}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Therapeutic Class:</strong> {selectedMedicine.therapeuticClass}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Manufacturer:</strong> {selectedMedicine.manufacturer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Category:</strong> {selectedMedicine.category}
                </Typography>
                <Chip 
                  label={selectedMedicine.prescriptionRequired ? "Prescription Required" : "Over the Counter"}
                  color={selectedMedicine.prescriptionRequired ? "warning" : "success"}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Grid>
            </Grid>
            
            <Box mt={2}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/compare?medicine=${selectedMedicine.id}`)}
                sx={{ mr: 2 }}
              >
                Compare Prices
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/substitutes?id=${selectedMedicine.id}`)}
              >
                Find Substitutes
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Results Grid */}
      {(recommendations.length > 0 || pharmacies.length > 0) && (
        <Grid container spacing={3}>
          {/* Recommendations */}
          <Grid item xs={12} lg={6}>
            <Typography variant="h6" gutterBottom>
              AI Recommendations
            </Typography>
            
            {recommendations.length > 0 ? (
              <List>
                {recommendations.slice(0, 5).map((rec, index) => (
                  <Card key={rec.pharmacy.id} sx={{ mb: 2 }}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? 'success.main' : 'primary.main' }}>
                          {index === 0 ? <Star /> : <LocalPharmacy />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {rec.pharmacy.name}
                            </Typography>
                            {index === 0 && (
                              <Chip label="Best Choice" color="success" size="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {rec.pharmacy.address}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <AttachMoney fontSize="small" />
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {formatPrice(rec.medicine.price)}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <DirectionsWalk fontSize="small" />
                                <Typography variant="body2">
                                  {formatDistance(rec.distance)}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Inventory fontSize="small" />
                                <Typography variant="body2">
                                  {rec.medicine.stock} in stock
                                </Typography>
                              </Box>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mt={1}>
                              <Rating value={rec.pharmacy.rating} readOnly size="small" />
                              <Typography variant="body2">
                                Score: {rec.totalScore}/1.0
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                              {rec.reasoning}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </Card>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                Enable location services to get personalized recommendations
              </Alert>
            )}
          </Grid>

          {/* Map */}
          <Grid item xs={12} lg={6}>
            <Typography variant="h6" gutterBottom>
              Pharmacy Locations
            </Typography>
            
            {userLocation && pharmacies.length > 0 ? (
              <PharmacyMap
                userLocation={userLocation}
                pharmacies={pharmacies}
                selectedMedicine={selectedMedicine}
                height={400}
              />
            ) : (
              <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {!userLocation ? 'Enable location to view map' : 'No pharmacies found nearby'}
                </Typography>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* No Results */}
      {searchQuery && medicines.length === 0 && !loading && (
        <Alert severity="info">
          No medicines found for "{searchQuery}". Try searching with a different name or check spelling.
        </Alert>
      )}
    </Container>
  );
};

export default Search;