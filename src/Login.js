import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Alert } from '@mui/material';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    // Make a POST request to the login endpoint.
    fetch(`${process.env.REACT_APP_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) {
          // Try to extract error message from the response text
          return res.text().then((text) => {
            throw new Error(text || 'Login failed');
          });
        }
        return res.json();
      })
      .then((data) => {
        // Save the token and username in localStorage.
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        setLoading(false);
        onLogin(); // Notify parent component that login succeeded.
      })
      .catch((error) => {
        console.error("Login error:", error);
        setErrorMsg(error.message || 'Invalid username or password.');
        setLoading(false);
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
        <Button
          type="submit"
          variant="contained"
          color="primary"
          style={{ marginTop: '20px' }}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Container>
  );
};

export default Login;
