// src/Utilities.js
import React, { useState, useContext } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton, // Using ListItemButton ensures each item is clickable
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  OutlinedInput,
  Checkbox,
} from "@mui/material";
import { GroomerContext } from "./contexts/GroomerContext";
import { VanContext } from "./contexts/VanContext";

// Define the list of available utilities
const utilitiesList = [
  { id: "createGroomerNormalSchedule", title: "Create Groomer Normal Schedule" },
  { id: "deleteGroomerSchedule", title: "Delete Groomer Schedule" },
];

// Component for the Create Groomer Normal Schedule Utility
const CreateGroomerNormalScheduleUtility = ({ refreshScheduleData, currentLastDate }) => {
  const [selectedGroomer, setSelectedGroomer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [resultMessage, setResultMessage] = useState("");
  const { groomers } = useContext(GroomerContext);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // DEBUG: Uncomment the following line to verify groomers data
  // console.log("Active groomers:", groomers.filter(g => g.inactive !== "Y"));

  const computePreview = () => {
    if (!selectedGroomer || !startDate || !currentLastDate) return [];
    const selectedGroomerObj = groomers.find((g) => g.id === selectedGroomer);
    if (!selectedGroomerObj || !selectedGroomerObj.schedule) return [];
    const [syear, smonth, sday] = startDate.split("-");
    const start = new Date(syear, smonth - 1, sday);
    const [lyear, lmonth, lday] = currentLastDate.split("-");
    const end = new Date(lyear, lmonth - 1, lday);
    let preview = [];
    let current = new Date(start);
    while (current <= end) {
      const dayOfWeek = dayNames[current.getDay()];
      if (selectedGroomerObj.schedule[dayOfWeek] && selectedGroomerObj.schedule[dayOfWeek] !== "") {
        preview.push({
          date: current.toLocaleDateString("en-US"),
          day: dayOfWeek,
          van: selectedGroomerObj.schedule[dayOfWeek],
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return preview;
  };

  const handlePreview = () => {
    const preview = computePreview();
    setPreviewData(preview);
  };

  const handleRunUtility = () => {
    if (!selectedGroomer || !startDate) {
      alert("Please select a groomer and a start date.");
      return;
    }
    fetch("http://localhost:3001/create-groomer-normal-schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        groomer_id: selectedGroomer,
        start_date: startDate,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => { throw new Error(text); });
        }
        return res.json();
      })
      .then((data) => {
        setResultMessage(data.message || "Utility executed successfully.");
        if (refreshScheduleData) refreshScheduleData();
      })
      .catch((err) => setResultMessage("Error: " + err.message));
  };

  // Only show active groomers in the Create utility
  const activeGroomers = groomers.filter((g) => g.inactive !== "Y");

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Create Groomer Normal Schedule
      </Typography>
      <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Select Groomer</InputLabel>
          <Select
            label="Select Groomer"
            value={selectedGroomer}
            onChange={(e) => {
              setSelectedGroomer(e.target.value);
              setPreviewData([]);
            }}
          >
            {activeGroomers.length > 0 ? (
              activeGroomers.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">
                <em>No active groomers available</em>
              </MenuItem>
            )}
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPreviewData([]);
          }}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={handlePreview}>
            Preview
          </Button>
          <Button variant="contained" onClick={handleRunUtility}>
            Run Utility
          </Button>
        </Box>
      </Box>
      {previewData.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Schedule Preview:</Typography>
          {previewData.map((item, idx) => (
            <Typography key={idx} variant="body2">
              {item.date} ({item.day}) → Van: {item.van}
            </Typography>
          ))}
        </Box>
      )}
      {resultMessage && (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {resultMessage}
        </Typography>
      )}
    </Box>
  );
};

const DeleteGroomerScheduleUtility = ({ refreshScheduleData }) => {
  const [selectedGroomer, setSelectedGroomer] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedVans, setSelectedVans] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [resultMessage, setResultMessage] = useState("");
  const { groomers } = useContext(GroomerContext);
  const { vans } = useContext(VanContext);

  const handleVansChange = (event) => {
    const { value } = event.target;
    setSelectedVans(typeof value === "string" ? value.split(",") : value);
  };

  const handlePreview = () => {
    if (!selectedGroomer || !targetDate) {
      alert("Please select a groomer and a target date.");
      return;
    }
    const vansParam = selectedVans.length === 0 ? "ALL" : selectedVans.join(",");
    fetch("http://localhost:3001/delete-groomer-schedule-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        groomer_id: selectedGroomer,
        target_date: targetDate,
        vans: vansParam,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => { throw new Error(text); });
        }
        return res.json();
      })
      .then((data) => setPreviewData(data))
      .catch((err) => setResultMessage("Error: " + err.message));
  };

  const handleRunUtility = () => {
    if (!selectedGroomer || !targetDate) {
      alert("Please select a groomer and a target date.");
      return;
    }
    const vansParam = selectedVans.length === 0 ? "ALL" : selectedVans.join(",");
    fetch("http://localhost:3001/delete-groomer-schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        groomer_id: selectedGroomer,
        target_date: targetDate,
        vans: vansParam,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => { throw new Error(text); });
        }
        return res.json();
      })
      .then((data) => {
        setResultMessage(data.message || "Utility executed successfully.");
        if (refreshScheduleData) refreshScheduleData();
      })
      .catch((err) => setResultMessage("Error: " + err.message));
  };

  const allGroomers = groomers;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Delete Groomer Schedule
      </Typography>
      <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Select Groomer</InputLabel>
          <Select
            label="Select Groomer"
            value={selectedGroomer}
            onChange={(e) => setSelectedGroomer(e.target.value)}
          >
            {allGroomers.length > 0 ? (
              allGroomers.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name} {g.inactive === "Y" ? "(Inactive)" : ""}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">
                <em>No groomers available</em>
              </MenuItem>
            )}
          </Select>
        </FormControl>
        <TextField
          label="Target Date"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
        <FormControl fullWidth>
          <InputLabel>Select Vans</InputLabel>
          <Select
            multiple
            value={selectedVans}
            onChange={handleVansChange}
            input={<OutlinedInput label="Select Vans" />}
            renderValue={(selected) => (selected.length === 0 ? "ALL" : selected.join(", "))}
          >
            <MenuItem value="ALL">
              <Checkbox checked={selectedVans.length === 0} />
              <ListItemText primary="ALL" />
            </MenuItem>
            {vans &&
              vans.map((van) => (
                <MenuItem key={van.id} value={van.id}>
                  <Checkbox checked={selectedVans.indexOf(van.id) > -1} />
                  <ListItemText primary={van.name} />
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={handlePreview}>
            Preview
          </Button>
          <Button variant="contained" onClick={handleRunUtility}>
            Run Utility
          </Button>
        </Box>
      </Box>
      {previewData.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Preview of Schedule Records to Delete:</Typography>
          {previewData.map((item, idx) => (
            <Typography key={idx} variant="body2">
              {item.day} - Van {item.van_id} - Assignment: {item.assignment}
            </Typography>
          ))}
        </Box>
      )}
      {resultMessage && (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {resultMessage}
        </Typography>
      )}
    </Box>
  );
};

const Utilities = ({ refreshScheduleData, currentLastDate }) => {
  const [selectedUtility, setSelectedUtility] = useState(null);

  const handleUtilitySelect = (utility) => {
    setSelectedUtility(utility);
  };

  return (
    <Box sx={{ display: "flex", height: "100%", p: 2 }}>
      {/* Left panel: List of utilities */}
      <Box sx={{ width: "30%", borderRight: "1px solid #ccc", pr: 2 }}>
        <Typography variant="h6" gutterBottom>
          Utilities
        </Typography>
        <List>
          {utilitiesList.map((utility) => (
            <ListItemButton
              key={utility.id}
              selected={selectedUtility && selectedUtility.id === utility.id}
              onClick={() => handleUtilitySelect(utility)}
            >
              <ListItemText primary={utility.title} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      {/* Right panel: Utility criteria and results */}
      <Box sx={{ flexGrow: 1, pl: 2 }}>
        {selectedUtility ? (
          <>
            {selectedUtility.id === "createGroomerNormalSchedule" ? (
              <CreateGroomerNormalScheduleUtility refreshScheduleData={refreshScheduleData} currentLastDate={currentLastDate} />
            ) : selectedUtility.id === "deleteGroomerSchedule" ? (
              <DeleteGroomerScheduleUtility refreshScheduleData={refreshScheduleData} />
            ) : (
              <Typography variant="body1">Utility not defined.</Typography>
            )}
          </>
        ) : (
          <Typography variant="body1">Select a utility from the list.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default Utilities;
