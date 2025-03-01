// src/App.js
import React, { useState, useEffect } from "react";
import { Container, Box, Tabs, Tab, Button, Typography, TextField } from "@mui/material";
import CustomGrid from "./components/CustomGrid";
import ModelingGrid from "./components/ModelingGrid";
import GroomerManagement from "./components/GroomerManagement";
import VanManagement from "./components/VanManagement";
import Utilities from "./Utilities";
import Reports from "./Reports";
import AuthScreen from "./AuthScreen"; // New authentication container
import Login from "./Login";
import Registration from "./Registration";
import ForgotPassword from "./ForgotPassword";
import { VanProvider } from "./contexts/VanContext";
import { GroomerProvider } from "./contexts/GroomerContext";
import AddDaysDialog from "./AddDaysDialog";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  // Now 6 tabs: 0 = Master Schedule, 1 = Groomers, 2 = Vans, 3 = Utilities, 4 = Reports, 5 = Schedule Modeling
  const [tabValue, setTabValue] = useState(0);
  const [addDaysOpen, setAddDaysOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  });

  useEffect(() => {
    // Force login on load—ignore any previously stored token.
    setIsAuthenticated(false);
  }, []);

  const fetchScheduleData = (t) => {
    fetch("http://localhost:3001/schedule", {
      headers: { Authorization: "Bearer " + t },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error fetching schedule data");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched schedule data:", data);
        setScheduleData(data);
      })
      .catch((err) => console.error(err));
  };

  let currentLastDate = "";
  if (scheduleData && scheduleData.length > 0) {
    const distinctDates = [...new Set(scheduleData.map((cell) => cell.day))].sort();
    currentLastDate = distinctDates[distinctDates.length - 1];
  }

  const handleGridChange = (newGrid) => {
    console.log("Updated grid data:", newGrid);
    setScheduleData(newGrid.flat());
  };

  const handleSaveSchedule = (grid) => {
    fetch("http://localhost:3001/schedule", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(grid.flat()),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save schedule");
        return res.json();
      })
      .then((data) => {
        console.log("Schedule saved successfully:", data);
        fetchScheduleData(token);
      })
      .catch((err) => console.error(err));
  };

  const handleLoginSuccess = (username, password) => {
    // Your login API call should store the token into localStorage.
    // Here we assume that after successful login, the token is already stored.
    const t = localStorage.getItem("token");
    setToken(t);
    setIsAuthenticated(true);
    fetchScheduleData(t);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setIsAuthenticated(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddDays = (newEndDate) => {
    fetch("http://localhost:3001/add-days", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        start_date: currentLastDate,
        end_date: newEndDate,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add days");
        return res.json();
      })
      .then((data) => {
        console.log("Days added successfully:", data);
        fetchScheduleData(token);
        setAddDaysOpen(false);
      })
      .catch((err) => {
        console.error("Error adding days:", err);
        alert("Error adding days: " + err.message);
      });
  };

  return (
    <GroomerProvider token={token}>
      <VanProvider>
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          {isAuthenticated ? (
            <>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h4" component="div" fontWeight="bold">
                  Zoomin Groomin - Greater Tampa Bay
                </Typography>
                <Typography variant="h5" component="div" fontWeight="bold">
                  Groomer Tracking and Modeling
                </Typography>
              </Box>
              <Box display="flex" justifyContent="flex-end" mt={0} mb={0}>
                <Button variant="contained" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  textColor="inherit"
                  indicatorColor="primary"
                  variant="fullWidth"
                  sx={{
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontSize: "1.1rem",
                      minWidth: 0,
                      padding: "6px 16px",
                      borderTopLeftRadius: "4px",
                      borderTopRightRadius: "4px",
                    },
                    "& .Mui-selected": {
                      fontWeight: "bold",
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  <Tab label="Master Schedule" />
                  <Tab label="Groomers" />
                  <Tab label="Vans" />
                  <Tab label="Utilities" />
                  <Tab label="Reports" />
                  <Tab label="Schedule Modeling" />
                </Tabs>
              </Box>
              {tabValue === 0 && (
                <Box>
                  <Box sx={{ mb: 2, textAlign: "right" }}>
                    <Button variant="outlined" onClick={() => setAddDaysOpen(true)}>
                      Add Days
                    </Button>
                  </Box>
                  <Box sx={{ mb: 2, textAlign: "right" }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>
                      Show dates from:
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <CustomGrid
                    gridData={scheduleData}
                    onGridChange={handleGridChange}
                    onSaveSchedule={handleSaveSchedule}
                    numRows={6}
                    dateFilter={dateFilter}
                  />
                </Box>
              )}
              {tabValue === 1 && <GroomerManagement />}
              {tabValue === 2 && <VanManagement />}
              {tabValue === 3 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">Utilities</Typography>
                  <Utilities refreshScheduleData={() => fetchScheduleData(token)} currentLastDate={currentLastDate} />
                </Box>
              )}
              {tabValue === 4 && <Reports />}
              {tabValue === 5 && (
                <Box sx={{ p: 2 }}>
                  <ModelingGrid
                    onGridChange={(newGrid) => console.log("Modeling grid updated:", newGrid)}
                    onSaveSchedule={(grid) => {
                      fetch("http://localhost:3001/model-schedule", {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: "Bearer " + token,
                        },
                        body: JSON.stringify(grid.flat()),
                      })
                        .then((res) => {
                          if (!res.ok) throw new Error("Failed to save model schedule");
                          return res.json();
                        })
                        .then((data) => {
                          console.log("Model schedule saved successfully:", data);
                        })
                        .catch((err) => console.error("Error saving model schedule:", err));
                    }}
                  />
                </Box>
              )}
              <AddDaysDialog
                open={addDaysOpen}
                onClose={() => setAddDaysOpen(false)}
                onSubmit={handleAddDays}
                currentLastDate={currentLastDate}
              />
            </>
          ) : (
            <AuthScreen onLoginSuccess={handleLoginSuccess} />
          )}
        </Container>
      </VanProvider>
    </GroomerProvider>
  );
}

export default App;
