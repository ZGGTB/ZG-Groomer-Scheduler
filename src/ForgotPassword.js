// src/ForgotPassword.js
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Alert } from '@mui/material';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username) {
      setErrorMsg('Username is required.');
      return; // Close the if block properly here.
    }  // <-- This closing curly brace was missing

    fetch(`${process.env.REACT_APP_API_URL}/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Request failed');
        }
        return res.json();
      })
      .then((data) => {
        setMessage(data.message);
        setErrorMsg('');
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Error: ' + error.message);
      });
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Forgot Password
      </Typography>
      {errorMsg && <Alert severity="error" style={{ marginBottom: '10px' }}>{errorMsg}</Alert>}
      {message && <Alert severity="info" style={{ marginBottom: '10px' }}>{message}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: '20px' }}>
          Submit
        </Button>
      </form>
    </Container>
  );
};

export default ForgotPassword;
