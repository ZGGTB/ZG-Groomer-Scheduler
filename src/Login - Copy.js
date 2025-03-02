import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Alert } from '@mui/material';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Make a POST request to the login endpoint.
    fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Login failed');
        }
        return res.json();
      })
      .then((data) => {
        // Save the token and username in localStorage.
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username); // Store the username
        onLogin(); // Notify parent component that login succeeded.
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg('Invalid username or password.');
      });
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Admin Login
      </Typography>
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
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
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: '20px' }}>
          Login
        </Button>
      </form>
    </Container>
  );
};

export default Login;
