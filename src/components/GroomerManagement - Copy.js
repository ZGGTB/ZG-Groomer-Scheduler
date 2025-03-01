// src/components/GroomerManagement.js
import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { GroomerContext } from "../contexts/GroomerContext";
import { VanContext } from "../contexts/VanContext";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const initialSchedule = dayNames.reduce((acc, day) => ({ ...acc, [day]: "" }), {});

const GroomerManagement = () => {
  const { groomers, addGroomer, updateGroomer, deleteGroomer, setGroomers } = useContext(GroomerContext);
  const { vans } = useContext(VanContext);

  const [token, setToken] = useState(null);
  const [newName, setNewName] = useState("");
  const [newSchedule, setNewSchedule] = useState(initialSchedule);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentGroomer, setCurrentGroomer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSchedule, setEditSchedule] = useState(initialSchedule);
  const [editInactive, setEditInactive] = useState("N"); // NEW: for inactive flag
  const [showInactive, setShowInactive] = useState(false); // controls whether to include inactive groomers in list

  // Retrieve token on mount.
  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  // Fetch groomers when token becomes available.
  useEffect(() => {
    if (token) {
      fetch("http://localhost:3001/groomers", {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch groomers");
          }
          return res.json();
        })
        .then((data) => {
          setGroomers(data);
          console.log("Fetched groomers:", data);
        })
        .catch((err) => console.error("Error fetching groomers:", err));
    }
  }, [token, setGroomers]);

  // Handler to add a new groomer.
  const handleAddGroomer = () => {
    if (newName.trim()) {
      // New groomers default to active ("N")
      addGroomer({ id: Date.now().toString(), name: newName.trim(), schedule: newSchedule, inactive: "N" });
      setNewName("");
      setNewSchedule(initialSchedule);
    }
  };

  // Open edit dialog for an existing groomer.
  const handleEditClick = (groomer) => {
    setCurrentGroomer(groomer);
    setEditName(groomer.name);
    // Parse schedule
    let sched = {};
    try {
      sched = typeof groomer.schedule === "string" ? JSON.parse(groomer.schedule) : groomer.schedule || {};
    } catch (e) {
      sched = {};
    }
    dayNames.forEach((day) => {
      if (!(day in sched)) {
        sched[day] = "";
      }
    });
    setEditSchedule(sched);
    // Set inactive flag (default to "N" if missing)
    setEditInactive(groomer.inactive || "N");
    setEditDialogOpen(true);
  };

  // Save edited groomer (includes inactive flag)
  const handleEditSave = () => {
    if (currentGroomer && editName.trim()) {
      fetch(`http://localhost:3001/groomers/${currentGroomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: editName.trim(),
          schedule: editSchedule,
          inactive: editInactive,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to update groomer");
          }
          return res.json();
        })
        .then((data) => {
          console.log("Groomer updated:", data);
          updateGroomer({ ...currentGroomer, name: editName.trim(), schedule: editSchedule, inactive: editInactive });
          setEditDialogOpen(false);
          setCurrentGroomer(null);
        })
        .catch((err) => {
          console.error("Error updating groomer:", err);
          alert("Error updating groomer: " + err.message);
        });
    }
  };

  const handleDeleteGroomer = (groomerId) => {
    if (window.confirm(`Are you sure you want to delete this groomer?`)) {
      deleteGroomer(groomerId);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Groomer Management
      </Typography>
      {/* NEW: Checkbox to include inactive groomers */}
      <FormControlLabel
        control={
          <Checkbox
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
        }
        label="Include Inactive Groomers"
      />
      {/* Form for adding a new groomer */}
      <Box sx={{ mb: 3, border: "1px solid #ccc", p: 2 }}>
        <Typography variant="subtitle1">Add New Groomer</Typography>
        <TextField
          label="Groomer Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Normal Schedule (Select Van for each day)
        </Typography>
        {dayNames.map((day) => (
          <FormControl key={day} fullWidth sx={{ mb: 1 }}>
            <InputLabel>{day}</InputLabel>
            <Select
              value={newSchedule[day] || ""}
              label={day}
              onChange={(e) => setNewSchedule({ ...newSchedule, [day]: e.target.value })}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {vans &&
                vans.map((van) => (
                  <MenuItem key={van.id} value={van.id}>
                    {van.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        ))}
        <Button variant="contained" onClick={handleAddGroomer}>
          Add Groomer
        </Button>
      </Box>
      {/* List of existing groomers */}
      <List>
        {(groomers.filter((g) => showInactive || g.inactive !== "Y")).map((groomer) => (
          <ListItem
            key={groomer.id}
            secondaryAction={
              <>
                <IconButton edge="end" onClick={() => handleEditClick(groomer)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteGroomer(groomer.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText
              primary={`${groomer.name}${groomer.inactive === "Y" ? " (Inactive)" : ""}`}
              secondary={
                groomer.schedule
                  ? "Normal Schedule: " +
                    dayNames
                      .map((day) => {
                        const vanId = groomer.schedule[day] || "";
                        const vanObj = vans ? vans.find((v) => v.id === vanId) : null;
                        return `${day}: ${vanObj ? vanObj.name : vanId || "None"}`;
                      })
                      .join(", ")
                  : "No normal schedule set."
              }
            />
          </ListItem>
        ))}
      </List>
      {/* Dialog for editing an existing groomer */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Groomer</DialogTitle>
        <DialogContent>
          <TextField
            label="Groomer Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {/* NEW: Field to select active/inactive status */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={editInactive}
              onChange={(e) => setEditInactive(e.target.value)}
            >
              <MenuItem value="N">Active</MenuItem>
              <MenuItem value="Y">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Normal Schedule (Select Van for each day)
          </Typography>
          {dayNames.map((day) => (
            <FormControl key={day} fullWidth sx={{ mb: 1 }}>
              <InputLabel>{day}</InputLabel>
              <Select
                value={editSchedule[day] || ""}
                label={day}
                onChange={(e) => setEditSchedule({ ...editSchedule, [day]: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {vans &&
                  vans.map((van) => (
                    <MenuItem key={van.id} value={van.id}>
                      {van.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save
          </Button>
          <Button onClick={() => setEditDialogOpen(false)} variant="contained" color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroomerManagement;
