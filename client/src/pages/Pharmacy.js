import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const Pharmacy = () => {
  const [medicineName, setMedicineName] = useState('');
  const [price, setPrice] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load current pharmacy inventory (demo: /self)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/pharmacy/self');
        if (mounted && res.data && res.data.pharmacy && res.data.pharmacy.inventory) {
          const inv = res.data.pharmacy.inventory.map(item => ({
            id: item.medicineId,
            name: item.medicineId,
            price: item.price,
            stock: item.stock
          }));
          setItems(inv);
        }
      } catch (err) {
        // ignore - server may not be initialized yet
      }
    })();
    return () => { mounted = false };
  }, []);

  const addItem = async (e) => {
    e.preventDefault();
    setError('');
    if (!medicineName.trim()) {
      setError('Please enter a medicine name.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid non-negative price.');
      return;
    }

    try {
      setSaving(true);
      // POST to demo endpoint - server maps 'self' to a demo pharmacy
      const res = await axios.post('/api/pharmacy/self/medicine', {
        name: medicineName.trim(),
        price: parsedPrice,
        stock: 10
      });

      if (res.data && res.data.success) {
        // Update local list using returned medicineId
        const newItem = {
          id: res.data.medicineId,
          name: medicineName.trim(),
          price: parsedPrice,
          stock: res.data.stock || 10
        };
        setItems(prev => [newItem, ...prev]);
        setMedicineName('');
        setPrice('');
      } else {
        setError('Failed to save item');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (id) => {
  setItems((prev) => prev.filter((it) => it.id !== id));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Pharmacy Panel
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Add medicines and prices to your local list. This demo stores entries locally in the page state.
      </Typography>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={addItem} display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Medicine name"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              sx={{ flex: '1 1 300px' }}
            />
            <TextField
              label="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              sx={{ width: 160 }}
            />
            <Button type="submit" variant="contained" sx={{ height: 56 }}>
              Add
            </Button>
          </Box>
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Current entries
        </Typography>
        <Card>
          <List>
            {items.length === 0 && (
              <ListItem>
                <ListItemText primary="No medicines added yet." />
              </ListItem>
            )}
            {items.map((it) => (
              <React.Fragment key={it.id}>
                <ListItem
                  secondaryAction={(
                    <IconButton edge="end" aria-label="delete" onClick={() => removeItem(it.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                >
                  <ListItemText primary={it.name} secondary={`Price: ${it.price}`} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Card>
      </Box>
    </Container>
  );
};

export default Pharmacy;
