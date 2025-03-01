// src/components/VanManagement.js
import React, { useState, useContext } from "react";
import { Box, TextField, Button, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { VanContext } from "../contexts/VanContext";

const VanManagement = () => {
  const { vans, addVan, updateVan, deleteVan } = useContext(VanContext);
  const [newVanName, setNewVanName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentVan, setCurrentVan] = useState(null);
  const [editedVanName, setEditedVanName] = useState("");

  // Handler to add a new van.
  // Note: We do not supply an ID; the backend will generate one.
  const handleAddVan = () => {
    if (newVanName.trim()) {
      addVan({ name: newVanName.trim() })
        .then(() => setNewVanName(""))
        .catch((err) => console.error("Error adding van:", err));
    }
  };

  // Open the edit dialog.
  const handleEditClick = (van) => {
    setCurrentVan(van);
    setEditedVanName(van.name);
    setEditDialogOpen(true);
  };

  // Save the edited van.
  const handleEditSave = () => {
    if (currentVan && editedVanName.trim()) {
      updateVan({ ...currentVan, name: editedVanName.trim() })
        .then(() => {
          setEditDialogOpen(false);
          setCurrentVan(null);
        })
        .catch((err) => console.error("Error updating van:", err));
    }
  };

  // Delete a van.
  const handleDeleteVan = (van) => {
    if (window.confirm(`Are you sure you want to delete van "${van.name}"?`)) {
      deleteVan(van.id)
        .catch((err) => console.error("Error deleting van:", err));
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Van Management
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="New Van Name"
          value={newVanName}
          onChange={(e) => setNewVanName(e.target.value)}
          variant="outlined"
        />
        <Button variant="contained" onClick={handleAddVan}>
          Add Van
        </Button>
      </Box>
      <List>
        {vans &&
          vans.map((van) => (
            <ListItem key={van.id} secondaryAction={
              <>
                <IconButton edge="end" onClick={() => handleEditClick(van)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteVan(van)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }>
              <ListItemText primary={van.name} />
            </ListItem>
          ))}
      </List>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Van</DialogTitle>
        <DialogContent>
          <TextField
            label="Van Name"
            value={editedVanName}
            onChange={(e) => setEditedVanName(e.target.value)}
            fullWidth
          />
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

export default VanManagement;
