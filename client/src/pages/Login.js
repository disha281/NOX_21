import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [pharmacyName, setPharmacyName] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleContinue = () => {
    if (role === "user") {
      navigate("/search");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!pharmacyName.trim()) {
      setError("Please enter your pharmacy name.");
      return;
    }
    if (!medicineName.trim()) {
      setError("Please enter medicine name.");
      return;
    }
    const parsed = parseFloat(price);
    if (Number.isNaN(parsed) || parsed < 0) {
      setError("Enter a valid non-negative price");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post("/api/pharmacy/self/medicine", {
        pharmacyName: pharmacyName.trim(),
        name: medicineName.trim(),
        price: parsed,
        stock: 10,
      });

      if (res.data && res.data.success) {
        setSuccess("Saved successfully");
        setMedicineName("");
        setPrice("");
      } else {
        setError("Failed to save");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Login / Pharmacy Setup
          </Typography>

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">I am a</FormLabel>
            <RadioGroup
              row
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <FormControlLabel value="user" control={<Radio />} label="User" />
              <FormControlLabel
                value="pharmacy"
                control={<Radio />}
                label="Pharmacy"
              />
            </RadioGroup>
          </FormControl>

          {role === "user" && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Continue as a user to search for medicines.
              </Typography>
              <Button variant="contained" onClick={handleContinue}>
                Continue
              </Button>
            </Box>
          )}

          {role === "pharmacy" && (
            <Box component="form" onSubmit={handleAdd}>
              <TextField
                label="Pharmacy name"
                fullWidth
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Medicine name"
                fullWidth
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                sx={{ mb: 2, width: 200 }}
              />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saving}>
                  Add Medicine
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
