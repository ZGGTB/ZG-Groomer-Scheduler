// src/Reports.js
import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
} from "@mui/material";

// NEW: Define the list of available reports.
const reportsList = [
  { id: "groomerScheduleChange", title: "Groomer Schedule Change" },
  // Additional reports can be added here.
];

// NEW/CHANGED: Component for the Groomer Schedule Change Report
const GroomerScheduleChangeReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [reportData, setReportData] = useState(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);

  const handleRunReport = () => {
    if (!startDate || !endDate) {
      alert("Please select both a start and an end date.");
      return;
    }
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      status: statusFilter,
    }).toString();
    fetch(`http://localhost:3001/event-history?${params}`, { 
      headers: { Authorization: "Bearer " + localStorage.getItem("token") } 
    })
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          return res.text().then(text => { 
            console.error("Response text:", text);
            throw new Error("Failed to fetch report data: " + text);
          });
        }
        return res.json();
      })
      .then((data) => {
        setReportData(data);
        setReportGeneratedAt(new Date());
      })
      .catch((err) => {
        console.error("Error running report:", err);
        alert("Error running report: " + err.message);
      });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Groomer Schedule Change Report
      </Typography>
      {/* Report criteria form */}
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400, mb: 2 }}
      >
        <TextField
          label="Start Date"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField
          label="End Date"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Scheduled">Scheduled</MenuItem>
            <MenuItem value="Called Out">Called Out</MenuItem>
            <MenuItem value="Filled In">Filled In</MenuItem>
            <MenuItem value="Time Off">Time Off</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleRunReport}>
          Run Report
        </Button>
      </Box>
      {/* Report header with title and generation timestamp */}
      {reportGeneratedAt && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Groomer Schedule Change Report</Typography>
          <Typography variant="caption">
            Report generated: {reportGeneratedAt.toLocaleString()}
          </Typography>
        </Box>
      )}
      {/* CHANGED: Report results display formatted similar to the cell history window */}
      {reportData && reportData.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {reportData.map((record, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Typography variant="caption" display="block" sx={{ fontWeight: "bold" }}>
                HISTORY CREATION DATE: {new Date(record.timestamp).toLocaleDateString()} TIME: {new Date(record.timestamp).toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                Action: {record.action} | Name: {record.name} | Status: {record.status} | Note: {record.note} | User: {record.user}
              </Typography>
            </Box>
          ))}
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </Box>
      )}
    </Box>
  );
};

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const handleReportSelect = (report) => {
    setSelectedReport(report);
  };

  return (
    <Box sx={{ display: "flex", height: "100%", p: 2 }}>
      {/* Left panel: List of reports */}
      <Box sx={{ width: "30%", borderRight: "1px solid #ccc", pr: 2 }}>
        <Typography variant="h6" gutterBottom>
          Reports
        </Typography>
        <List>
          {reportsList.map((report) => (
            <ListItem key={report.id} disablePadding>
              <ListItemButton
                selected={selectedReport?.id === report.id}
                onClick={() => handleReportSelect(report)}
              >
                <ListItemText primary={report.title} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      {/* Right panel: Report criteria and results */}
      <Box sx={{ flexGrow: 1, pl: 2 }}>
        {selectedReport ? (
          <>
            {selectedReport.id === "groomerScheduleChange" ? (
              <GroomerScheduleChangeReport />
            ) : (
              <Typography variant="body1">Report not defined.</Typography>
            )}
          </>
        ) : (
          <Typography variant="body1">Select a report from the list.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default Reports;
