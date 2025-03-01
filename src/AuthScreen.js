// src/AuthScreen.js
import React, { useState } from "react";
import { Box, Typography, Link } from "@mui/material";
import Login from "./Login";
import Registration from "./Registration";
import ForgotPassword from "./ForgotPassword";

const AuthScreen = ({ onLoginSuccess }) => {
  // mode can be 'login', 'register', or 'forgot'
  const [mode, setMode] = useState("login");

  const renderContent = () => {
    if (mode === "login") {
      return <Login onLogin={onLoginSuccess} onSwitchMode={setMode} />;
    } else if (mode === "register") {
      return <Registration onRegisterSuccess={onLoginSuccess} onSwitchMode={() => setMode("login")} />;
    } else if (mode === "forgot") {
      return <ForgotPassword onSwitchMode={() => setMode("login")} />;
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {renderContent()}
      {mode === "login" && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
          <Link component="button" onClick={() => setMode("register")}>
            Register
          </Link>
          <Link component="button" onClick={() => setMode("forgot")}>
            Forgot Password?
          </Link>
        </Box>
      )}
    </Box>
  );
};

export default AuthScreen;
