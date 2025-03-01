// src/components/TitleEditorModal.js
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TitleEditorModal = ({ open, initialTitleHtml, onSave, onClose }) => {
  const [titleHtml, setTitleHtml] = useState(initialTitleHtml || '');

  useEffect(() => {
    setTitleHtml(initialTitleHtml || '');
  }, [initialTitleHtml]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Event Title</DialogTitle>
      <DialogContent>
        <ReactQuill value={titleHtml} onChange={setTitleHtml} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onSave(titleHtml)} variant="contained" color="primary">
          Save
        </Button>
        <Button onClick={onClose} variant="contained" color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TitleEditorModal;
