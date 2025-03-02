// src/Registration.js
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Alert } from '@mui/material';

const Registration = ({ onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // Default role; adjust as needed.
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure all fields are filled
    if (!username || !password || !role) {
      setErrorMsg('All fields are required.');
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Registration failed');
        }
        return res.json();
      })
      .then((data) => {
        setSuccessMsg('Registration successful. You can now log in.');
        setErrorMsg('');
        // Optionally, call a callback to switch to the login screen.
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Error during registration: ' + error.message);
      });
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Register
      </Typography>
      {errorMsg && <Alert severity="error" style={{ marginBottom: '10px' }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" style={{ marginBottom: '10px' }}>{successMsg}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          fullWidth
          margin="normal"
          helperText="For now, use 'admin' or other roles as desired."
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: '20px' }}>
          Register
        </Button>
      </form>
    </Container>
  );
};

export default Registration;
