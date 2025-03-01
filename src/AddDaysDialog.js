// src/AddDaysDialog.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const AddDaysDialog = ({ open, onClose, onSubmit, currentLastDate }) => {
  // currentLastDate should be a string in "YYYY-MM-DD" format representing the current last date in the grid
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    if (!endDate) return;
    const last = new Date(currentLastDate);
    const end = new Date(endDate);
    if (end <= last) {
      alert("End date must be after the current last date: " + currentLastDate);
      return;
    }
    onSubmit(endDate);
    setEndDate("");
  };

  const handleClose = () => {
    setEndDate("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add Additional Days</DialogTitle>
      <DialogContent>
        <TextField
          label="New End Date"
          type="date"
          fullWidth
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} color="primary">Add Days</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDaysDialog;
