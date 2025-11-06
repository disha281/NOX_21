import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  LocalPharmacy,
  TrendingUp,
  LocationOn,
  AttachMoney,
  Inventory,
  Speed,
  Analytics,
  Star,
  AccessTime,
  Security
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalMedicines: 0,
    avgResponseTime: 0,
    successRate: 0
  });
  const [popularMedicines, setPopularMedicines] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading dashboard data
      // In a real app, this would fetch from multiple endpoints
      
      // Load popular medicines
      const medicinesResponse = await axios.get('/api/medicine/popular/list');
      setPopularMedicines(medicinesResponse.data.medicines.slice(0, 10));
      
      // Simulate other stats
      setStats({
        totalPharmacies: 150,
        totalMedicines: 2500,
        avgResponseTime: 1.2,
        successRate: 94.5
      });

      // Simulate recent searches
      setRecentSearches([
        { id: 1, medicine: 'Paracetamol 500mg', timestamp: '2 hours ago', status: 'success' },
        { id: 2, medicine: 'Aspirin 75mg', timestamp: '4 hours ago', status: 'success' },
        { id: 3, medicine: 'Ibuprofen 400mg', timestamp: '6 hours ago', status: 'success' },
        { id: 4, medicine: 'Amoxicillin 250mg', timestamp: '8 hours ago', status: 'success' },
        { id: 5, medicine: 'Omeprazole 20mg', timestamp: '1 day ago', status: 'success' },
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const categoryData = [
    { name: 'Pain Relief', value: 35, color: '#2196f3' },
    { name: 'Antibiotics', value: 25, color: '#4caf50' },
    { name: 'Cardiovascular', value: 20, color: '#ff9800' },
    { name: 'Gastrointestinal', value: 12, color: '#9c27b0' },
    { name: 'Others', value: 8, color: '#607d8b' }
  ];

  const usageData = [
    { day: 'Mon', searches: 120, recommendations: 95 },
    { day: 'Tue', searches: 150, recommendations: 120 },
    { day: 'Wed', searches: 180, recommendations: 145 },
    { day: 'Thu', searches: 160, recommendations: 130 },
    { day: 'Fri', searches: 200, recommendations: 165 },
    { day: 'Sat', searches: 140, recommendations: 110 },
    { day: 'Sun', searches: 100, recommendations: 80 }
  ];

  const performanceData = [
    { time: '00:00', responseTime: 1.1, accuracy: 94 },
    { time: '04:00', responseTime: 0.9, accuracy: 96 },
    { time: '08:00', responseTime: 1.3, accuracy: 93 },
    { time: '12:00', responseTime: 1.5, accuracy: 92 },
    { time: '16:00', responseTime: 1.2, accuracy: 95 },
    { time: '20:00', responseTime: 1.0, accuracy: 97 }
  ];

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPrice = (price) => {
    return `₹${price.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="400px">
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        MedAI Analytics Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" mb={4}>
        Real-time insights into medicine searches, pharmacy recommendations, and system performance
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <LocalPharmacy />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(stats.totalPharmacies)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Partner Pharmacies
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Inventory />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatNumber(stats.totalMedicines)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Medicines Tracked
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Speed />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.avgResponseTime}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Analytics />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.successRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        {/* Medicine Categories */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medicine Categories
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Usage Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="searches" fill="#2196f3" name="Searches" />
                  <Bar dataKey="recommendations" fill="#4caf50" name="Recommendations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Performance (24 Hours)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="responseTime" 
                stroke="#ff9800" 
                fill="#ff9800" 
                fillOpacity={0.3}
                name="Response Time (s)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="accuracy" 
                stroke="#4caf50" 
                strokeWidth={2}
                name="Accuracy (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Popular Medicines */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Searched Medicines
              </Typography>
              <List>
                {popularMedicines.slice(0, 8).map((medicine, index) => (
                  <ListItem key={medicine.id} divider={index < 7}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <Typography variant="caption" fontWeight="bold">
                          {index + 1}
                        </Typography>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={medicine.name}
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption">
                            {medicine.category}
                          </Typography>
                          <Chip 
                            label={`${medicine.popularity}% popular`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Search Activity
              </Typography>
              <List>
                {recentSearches.map((search, index) => (
                  <ListItem key={search.id} divider={index < recentSearches.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                        <Star fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={search.medicine}
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTime fontSize="small" />
                          <Typography variant="caption">
                            {search.timestamp}
                          </Typography>
                          <Chip 
                            label={search.status}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Status */}
      <Alert severity="success" sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Security />
          <Typography>
            All systems operational. Data is anonymized and secure. Last updated: {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Alert>
    </Container>
  );
};

export default Dashboard;