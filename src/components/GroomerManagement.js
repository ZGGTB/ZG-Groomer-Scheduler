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

// Full day names array
const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Helper to create an initial blank schedule object.
const initialSchedule = dayNames.reduce(
  (acc, day) => ({ ...acc, [day]: "" }),
  {}
);

// SimpleScheduleRow: displays a single row of schedule for a groomer.
// For each day, it shows an abbreviated day and a check mark if the schedule value is non-empty.
const SimpleScheduleRow = ({ schedule }) => {
  return (
    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
      {dayNames.map((day) => (
        <Box key={day} sx={{ textAlign: "center", width: "40px" }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: "bold" }}>
            {day.substring(0, 3)}
          </Typography>
          <Typography variant="caption">
            {schedule && schedule[day] ? "✓" : ""}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const GroomerManagement = () => {
  const { groomers, addGroomer, updateGroomer, deleteGroomer, setGroomers } =
    useContext(GroomerContext);
  const { vans } = useContext(VanContext);

  // Local state for token
  const [token, setToken] = useState(null);

  // State to control the Add Groomer dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // State for editing an existing groomer.
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentGroomer, setCurrentGroomer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSchedule, setEditSchedule] = useState(initialSchedule);
  const [editInactive, setEditInactive] = useState("N"); // "N" = active, "Y" = inactive

  // State for new groomer form in the Add Groomer dialog
  const [newName, setNewName] = useState("");
  const [newSchedule, setNewSchedule] = useState(initialSchedule);

  // State to toggle showing inactive groomers in the list
  const [showInactive, setShowInactive] = useState(false);

  // Retrieve token on mount.
  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  // Fetch groomers when token becomes available.
  useEffect(() => {
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL}/groomers`, {
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

  // Handler to add a new groomer via the dialog.
  const handleAddGroomer = () => {
    if (newName.trim()) {
      const groomerToAdd = {
        id: Date.now().toString(),
        name: newName.trim(),
        schedule: newSchedule,
        inactive: "N",
      };
      fetch(`${process.env.REACT_APP_API_URL}/groomers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(groomerToAdd),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to add groomer");
          return res.json();
        })
        .then((data) => {
          console.log("Groomer added:", data);
          // Optionally update context/local state here.
          addGroomer(groomerToAdd);
          setNewName("");
          setNewSchedule(initialSchedule);
          setAddDialogOpen(false);
        })
        .catch((err) => {
          console.error("Error adding groomer:", err);
          alert("Error adding groomer: " + err.message);
        });
    }
  };
  

  // Open edit dialog for an existing groomer.
  const handleEditClick = (groomer) => {
    setCurrentGroomer(groomer);
    setEditName(groomer.name);
    let sched = {};
    try {
      sched =
        typeof groomer.schedule === "string"
          ? JSON.parse(groomer.schedule)
          : groomer.schedule || {};
    } catch (e) {
      sched = {};
    }
    dayNames.forEach((day) => {
      if (!(day in sched)) {
        sched[day] = "";
      }
    });
    setEditSchedule(sched);
    setEditInactive(groomer.inactive || "N");
    setEditDialogOpen(true);
  };

  // Save edited groomer.
  const handleEditSave = () => {
    if (currentGroomer && editName.trim()) {
      fetch(`${process.env.REACT_APP_API_URL}/groomers/${currentGroomer.id}`, {
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
          updateGroomer({
            ...currentGroomer,
            name: editName.trim(),
            schedule: editSchedule,
            inactive: editInactive,
          });
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

      {/* Button to open Add Groomer dialog */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={() => setAddDialogOpen(true)}>
          Add Groomer
        </Button>
      </Box>

      {/* Add Groomer Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Groomer</DialogTitle>
        <DialogContent>
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
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, [day]: e.target.value })
                }
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
          <Button onClick={handleAddGroomer} variant="contained" color="primary">
            Add Groomer
          </Button>
          <Button onClick={() => setAddDialogOpen(false)} variant="contained" color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkbox to include inactive groomers */}
      <FormControlLabel
        control={
          <Checkbox
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
        }
        label="Include Inactive Groomers"
      />

      {/* List of existing groomers */}
      <List>
        {groomers
          .filter((g) => showInactive || g.inactive !== "Y")
          .map((groomer) => (
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
                secondary={<SimpleScheduleRow schedule={
                  typeof groomer.schedule === "string"
                    ? JSON.parse(groomer.schedule)
                    : groomer.schedule || {}
                } />}
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
