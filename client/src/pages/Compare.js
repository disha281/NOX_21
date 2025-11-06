import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Rating,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  AttachMoney,
  LocalPharmacy,
  DirectionsWalk,
  Phone,
  Star,
  TrendingUp,
  TrendingDown,
  Remove
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';

const Compare = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [priceTrend, setPriceTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const medicineId = searchParams.get('medicine');
    if (medicineId) {
      loadMedicineAndCompare(medicineId);
    }
    getCurrentLocation();
  }, [searchParams]);

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

  const loadMedicineAndCompare = async (medicineId) => {
    try {
      // Get medicine details
      const medicineResponse = await axios.get(`/api/medicine/${medicineId}`);
      const medicine = medicineResponse.data.medicine;
      setSelectedMedicine(medicine);
      setSearchQuery(medicine.name);

      // Compare prices
      await comparePrices(medicineId);
      
      // Get price trend
      await getPriceTrend(medicineId);
    } catch (error) {
      setError('Error loading medicine data');
      console.error('Error:', error);
    }
  };

  const searchMedicines = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/medicine/search?query=${encodeURIComponent(query)}&limit=10`);
      setMedicines(response.data.results);
    } catch (error) {
      setError('Error searching medicines');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const comparePrices = async (medicineId) => {
    setLoading(true);
    
    try {
      const params = {
        ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius: 20 })
      };
      
      const response = await axios.get(`/api/pharmacy/compare/${medicineId}`, { params });
      setComparisons(response.data.comparisons);
    } catch (error) {
      setError('Error comparing prices');
      console.error('Compare error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceTrend = async (medicineId) => {
    try {
      const response = await axios.get(`/api/recommendation/price-trend/${medicineId}?days=30`);
      setPriceTrend(response.data.priceTrend);
    } catch (error) {
      console.error('Price trend error:', error);
    }
  };

  const handleMedicineSelect = (medicine) => {
    setSelectedMedicine(medicine);
    setSearchQuery(medicine.name);
    comparePrices(medicine.id);
    getPriceTrend(medicine.id);
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

  const formatPrice = (price) => {
    return `₹${price.toFixed(0)}`;
  };

  const formatDistance = (distance) => {
    if (!distance) return 'N/A';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getPriceColor = (price, prices) => {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (price === minPrice) return 'success';
    if (price === maxPrice) return 'error';
    return 'warning';
  };

  const calculateSavings = (currentPrice, lowestPrice) => {
    if (currentPrice === lowestPrice) return 0;
    return ((currentPrice - lowestPrice) / currentPrice * 100).toFixed(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Price Comparison
      </Typography>

      {/* Search Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for medicines to compare prices..."
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
          />

          {/* Medicine Selection */}
          {medicines.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Select a medicine:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {medicines.map((medicine) => (
                  <Chip
                    key={medicine.id}
                    label={medicine.name}
                    onClick={() => handleMedicineSelect(medicine)}
                    clickable
                    variant={selectedMedicine?.id === medicine.id ? "filled" : "outlined"}
                    color={selectedMedicine?.id === medicine.id ? "primary" : "default"}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Selected Medicine Info */}
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
                  <strong>Therapeutic Class:</strong> {selectedMedicine.therapeuticClass}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Manufacturer:</strong> {selectedMedicine.manufacturer}
                </Typography>
                <Chip 
                  label={selectedMedicine.prescriptionRequired ? "Prescription Required" : "Over the Counter"}
                  color={selectedMedicine.prescriptionRequired ? "warning" : "success"}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Price Comparison Results */}
      {comparisons.length > 0 && (
        <Grid container spacing={3}>
          {/* Price Comparison Table */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Price Comparison ({comparisons.length} pharmacies)
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pharmacy</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Distance</TableCell>
                        <TableCell align="center">Rating</TableCell>
                        <TableCell align="center">Stock</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparisons
                        .sort((a, b) => a.medicine.price - b.medicine.price)
                        .map((comparison, index) => {
                          const prices = comparisons.map(c => c.medicine.price);
                          const lowestPrice = Math.min(...prices);
                          const savings = calculateSavings(comparison.medicine.price, lowestPrice);
                          
                          return (
                            <TableRow key={comparison.pharmacy.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {comparison.pharmacy.name}
                                    {index === 0 && (
                                      <Chip 
                                        label="Best Price" 
                                        color="success" 
                                        size="small" 
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {comparison.pharmacy.address}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                    <Phone fontSize="small" />
                                    <Typography variant="caption">
                                      {comparison.pharmacy.phone}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              
                              <TableCell align="right">
                                <Box>
                                  <Typography 
                                    variant="h6" 
                                    color={getPriceColor(comparison.medicine.price, prices) + '.main'}
                                    fontWeight="bold"
                                  >
                                    {formatPrice(comparison.medicine.price)}
                                  </Typography>
                                  {comparison.medicine.discount > 0 && (
                                    <Chip 
                                      label={`${comparison.medicine.discount}% off`}
                                      color="secondary"
                                      size="small"
                                    />
                                  )}
                                  {savings > 0 && (
                                    <Typography variant="caption" color="error">
                                      +{savings}% vs lowest
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              
                              <TableCell align="right">
                                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                  <DirectionsWalk fontSize="small" />
                                  <Typography variant="body2">
                                    {formatDistance(comparison.distance)}
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Box display="flex" flexDirection="column" alignItems="center">
                                  <Rating 
                                    value={comparison.pharmacy.rating} 
                                    readOnly 
                                    size="small" 
                                  />
                                  <Typography variant="caption">
                                    {comparison.pharmacy.rating}/5
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Chip
                                  label={`${comparison.medicine.stock} units`}
                                  color={comparison.medicine.stock > 50 ? 'success' : 
                                         comparison.medicine.stock > 10 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${comparison.pharmacy.lat},${comparison.pharmacy.lng}&key=AIzaSyC6AMF95Ws3mKqX_lQ_OEbTDffjPHkEU5M`;
                                    window.open(url, '_blank');
                                  }}
                                >
                                  Directions
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Price Statistics */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Price Statistics
                </Typography>
                
                {(() => {
                  const prices = comparisons.map(c => c.medicine.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                  const savings = maxPrice - minPrice;
                  
                  return (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Lowest Price:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatPrice(minPrice)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Highest Price:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          {formatPrice(maxPrice)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Average Price:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatPrice(avgPrice)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Max Savings:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {formatPrice(savings)} ({((savings/maxPrice)*100).toFixed(1)}%)
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Price Distribution Chart */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Price Distribution
                </Typography>
                
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparisons.map(c => ({
                    name: c.pharmacy.name.substring(0, 10) + '...',
                    price: c.medicine.price
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatPrice(value), 'Price']} />
                    <Bar dataKey="price" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Price Trend Chart */}
      {priceTrend.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              30-Day Price Trend
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatPrice(value), 'Price']} />
                <Line 
                  type="monotone" 
                  dataKey="averagePrice" 
                  stroke="#2196f3" 
                  strokeWidth={2}
                  name="Average Price"
                />
                <Line 
                  type="monotone" 
                  dataKey="lowestPrice" 
                  stroke="#4caf50" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Lowest Price"
                />
                <Line 
                  type="monotone" 
                  dataKey="highestPrice" 
                  stroke="#f44336" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Highest Price"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {selectedMedicine && comparisons.length === 0 && !loading && (
        <Alert severity="info">
          No pharmacies found with "{selectedMedicine.name}" in stock. Try searching for a different medicine or check back later.
        </Alert>
      )}
    </Container>
  );
};

export default Compare;