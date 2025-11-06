import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  LocalPharmacy,
  CompareArrows,
  CameraAlt,
  TrendingUp,
  Speed,
  Security
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [popularMedicines, setPopularMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPopularMedicines();
    getCurrentLocation();
  }, []);

  const fetchPopularMedicines = async () => {
    try {
      const response = await axios.get('/api/medicine/popular/list');
      setPopularMedicines(response.data.medicines.slice(0, 8));
    } catch (error) {
      console.error('Error fetching popular medicines:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError('Location access denied. Please enable location services for better results.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const features = [
    {
      icon: <SearchIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Smart Search',
      description: 'Find medicines by name or upload prescription images with AI-powered OCR'
    },
    {
      icon: <LocationOn color="primary" sx={{ fontSize: 40 }} />,
      title: 'Location-Based',
      description: 'Discover nearby pharmacies with real-time stock and distance information'
    },
    {
      icon: <CompareArrows color="primary" sx={{ fontSize: 40 }} />,
      title: 'Price Comparison',
      description: 'Compare prices across multiple pharmacies to find the best deals'
    },
    {
      icon: <Speed color="primary" sx={{ fontSize: 40 }} />,
      title: 'AI Recommendations',
      description: 'Get personalized pharmacy recommendations based on price, distance, and availability'
    },
    {
      icon: <LocalPharmacy color="primary" sx={{ fontSize: 40 }} />,
      title: 'Substitute Finder',
      description: 'Find generic alternatives and therapeutic substitutes when medicines are unavailable'
    },
    {
      icon: <Security color="primary" sx={{ fontSize: 40 }} />,
      title: 'Privacy First',
      description: 'Your data is anonymized and secure. No personal information is stored'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
          Find Medicines Instantly
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          AI-powered medicine locator with real-time price comparison and smart recommendations
        </Typography>

        {/* Search Bar */}
        <Box maxWidth={600} mx="auto" mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for medicines (e.g., Paracetamol, Aspirin)"
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
                    disabled={!searchQuery.trim()}
                    sx={{ mr: -1 }}
                  >
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'white',
              },
            }}
          />
        </Box>

        {/* Quick Action Buttons */}
        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={() => navigate('/ocr')}
            size="large"
          >
            Upload Prescription
          </Button>
          <Button
            variant="outlined"
            startIcon={<CompareArrows />}
            onClick={() => navigate('/compare')}
            size="large"
          >
            Compare Prices
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={() => navigate('/dashboard')}
            size="large"
          >
            View Analytics
          </Button>
        </Box>

        {/* Location Status */}
        {locationError && (
          <Alert severity="warning" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
            {locationError}
          </Alert>
        )}
        {location && (
          <Alert severity="success" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
            Location detected! You'll get personalized nearby pharmacy recommendations.
          </Alert>
        )}
      </Box>

      {/* Popular Medicines */}
      {popularMedicines.length > 0 && (
        <Box mb={6}>
          <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center">
            Popular Medicines
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center" mt={2}>
            {popularMedicines.map((medicine) => (
              <Chip
                key={medicine.id}
                label={medicine.name}
                onClick={() => navigate(`/search?q=${encodeURIComponent(medicine.name)}`)}
                clickable
                variant="outlined"
                sx={{
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Features Grid */}
      <Box mb={6}>
        <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center" mb={4}>
          Why Choose MedAI?
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box mb={2}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* How It Works */}
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom fontWeight="bold" mb={4}>
          How It Works
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Box>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                1
              </Box>
              <Typography variant="h6" gutterBottom>
                Search or Upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type medicine name or upload prescription image
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                2
              </Box>
              <Typography variant="h6" gutterBottom>
                AI Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Our AI finds nearby pharmacies with stock and prices
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                3
              </Box>
              <Typography variant="h6" gutterBottom>
                Smart Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get ranked results based on price, distance, and availability
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                4
              </Box>
              <Typography variant="h6" gutterBottom>
                Visit & Purchase
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Navigate to the best pharmacy and get your medicine
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;