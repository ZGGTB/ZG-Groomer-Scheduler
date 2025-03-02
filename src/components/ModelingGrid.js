// src/components/ModelingGrid.js
import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import CustomGrid from "./CustomGrid";

const ModelingGrid = ({ onGridChange, onSaveSchedule }) => {
  const [gridData, setGridData] = useState([]);
  const [modelGroomers, setModelGroomers] = useState([]); // Model-specific groomers
  const [modelVans, setModelVans] = useState([]);         // Model-specific vans
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      // Fetch model_groomers data
      fetch(`${process.env.REACT_APP_API_URL}/model-groomers`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error fetching model groomers: " + res.statusText);
          return res.json();
        })
        .then((data) => {
          console.log("Fetched model groomers:", data);
          setModelGroomers(data);
        })
        .catch((err) => console.error("Error fetching model groomers:", err.message));

      // Fetch model_vans data
      fetch(`${process.env.REACT_APP_API_URL}/model-vans`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error fetching model vans: " + res.statusText);
          return res.json();
        })
        .then((data) => {
          console.log("Fetched model vans:", data);
          setModelVans(data);
        })
        .catch((err) => console.error("Error fetching model vans:", err.message));

      // Fetch model schedule data
      fetch(`${process.env.REACT_APP_API_URL}/model-schedule`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error fetching model schedule");
          return res.json();
        })
        .then((data) => {
          console.log("Fetched model schedule:", data);
          setGridData(data);
        })
        .catch((err) => console.error("Error fetching model schedule:", err.message));
    }
  }, [token]);

  // When grid data changes, pass it up
  const handleGridChange = (newGridData) => {
    setGridData(newGridData);
    if (onGridChange) onGridChange(newGridData);
  };

  // Save the modeled schedule and then re-fetch to update UI
  const handleSave = () => {
    fetch(`${process.env.REACT_APP_API_URL}/model-schedule`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(gridData.flat()),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save model schedule");
        return res.json();
      })
      .then((data) => {
        console.log("Model schedule saved successfully:", data);
        // Re-fetch the model schedule to update the grid state
        fetch(`${process.env.REACT_APP_API_URL}/model-schedule`, {
          headers: { Authorization: "Bearer " + token },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Error re-fetching model schedule");
            return res.json();
          })
          .then((newData) => {
            console.log("Re-fetched model schedule:", newData);
            setGridData(newData);
          })
          .catch((err) => console.error("Error re-fetching model schedule:", err.message));
      })
      .catch((err) => console.error("Error saving model schedule:", err));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Schedule Modeling
      </Typography>
      <Paper sx={{ backgroundColor: "#FFFFFF", p: 1 }}>
        {/* Pass model data to CustomGrid via props */}
        <CustomGrid
          gridData={gridData}
          onGridChange={handleGridChange}
          onSaveSchedule={handleSave}
          numRows={modelVans.length}
          groomers={modelGroomers}  // Using model groomers data
          vans={modelVans}          // Using model vans data
          headerStyle={{ backgroundColor: "#993399" }}      // Purple header
          firstColumnStyle={{ backgroundColor: "#993399", color: "white" }} // Purple first column
        />
      </Paper>
      {/* REMOVED: The extra "Save Modeling Schedule" button from the parent was removed */}
      {/*
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Modeling Schedule
        </Button>
      </Box>
      */}
    </Box>
  );
};

export default ModelingGrid;
