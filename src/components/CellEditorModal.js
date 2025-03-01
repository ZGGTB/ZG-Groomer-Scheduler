// src/components/CellEditorModal.js
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GroomerContext } from '../contexts/GroomerContext';

const CellEditorModal = ({ open, initialGroomer, initialStatus, onSave, onClose }) => {
  const { groomers } = useContext(GroomerContext);
  const [groomer, setGroomer] = useState(initialGroomer || '');
  const [status, setStatus] = useState(initialStatus || '');

  useEffect(() => {
    setGroomer(initialGroomer || '');
    setStatus(initialStatus || '');
  }, [initialGroomer, initialStatus]);

  const handleSave = () => {
    onSave({ groomer, status });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Assignment</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel id="groomer-select-label">Groomer</InputLabel>
          <Select labelId="groomer-select-label" value={groomer} label="Groomer" onChange={(e) => setGroomer(e.target.value)}>
            {groomers.map((g) => (
              <MenuItem key={g.id} value={g.name}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel id="status-select-label">Status</InputLabel>
          <Select labelId="status-select-label" value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="Scheduled">Scheduled</MenuItem>
            <MenuItem value="Callout">Callout</MenuItem>
            <MenuItem value="Filled In">Filled In</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
        <Button onClick={onClose} variant="contained" color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CellEditorModal;
