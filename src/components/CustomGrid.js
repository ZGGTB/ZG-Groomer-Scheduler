// src/components/CustomGrid.js
import React, { useState, useContext } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { VanContext } from "../contexts/VanContext";
import { GroomerContext } from "../contexts/GroomerContext";

// --- Constants ---
const cellWidth = 110;
const cellHeight = 80;
const numDays = 14; // expected number of columns
const fixedStartDateStr = "2025-02-20";

// --- Helper: Add a number of days to a date string (YYYY-MM-DD) in UTC ---
function addDaysToDate(dateStr, days) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// --- Helper: Build a 2D grid dynamically from schedule cells using van list ---
export const buildGridFromSchedule = (cells, vanList) => {
  const vanIds = vanList.map((v) => v.id).sort((a, b) => a - b);
  const datesSet = new Set();
  cells.forEach((cell) => {
    datesSet.add(cell.day);
  });
  const dates = [...datesSet].sort();
  console.log("Distinct van IDs (from vanList):", vanIds);
  console.log("Distinct dates (from schedule):", dates);
  const cellMap = {};
  cells.forEach((cell) => {
    const key = `${cell.van_id}-${cell.day}`;
    if (!cellMap[key]) {
      cellMap[key] = {
        van_id: cell.van_id,
        day: cell.day,
        assignment: cell.assignment,
        status: cell.status,
        history:
          typeof cell.history === "string"
            ? JSON.parse(cell.history)
            : cell.history || [],
      };
    }
  });
  console.log("Unique cell map:", cellMap);
  const grid = vanIds.map((van_id) => {
    return dates.map((date) => {
      const key = `${van_id}-${date}`;
      if (cellMap[key]) {
        return cellMap[key];
      } else {
        return {
          van_id,
          day: date,
          assignment: "",
          status: "Blank",
          history: [],
        };
      }
    });
  });
  console.log("Built dynamic grid:", grid);
  return grid;
};

// --- Helper: Determine background color based on cell status ---
const getCellBackgroundColor = (status) => {
  if (status === "Scheduled") return "#CCFFCC"; // pale green
  if (status === "Called Out") return "#FFCCCC"; // pale red
  if (status === "Filled In") return "#FFDAB9";    // pale orange
  if (status === "Time Off") return "#FFFACD";     // pale yellow
  if (status === "Event") return "#ADD8E6";          // pale blue
  if (status === "Terminated") return "#8B4513";     // pale brown
  return "inherit";
};

//
// MODIFIED: Accept additional props for groomers, vans, headerStyle, and firstColumnStyle.
// This allows ModelingGrid to pass in its own model-specific data and styling.
const CustomGrid = ({
  gridData,
  onGridChange,
  onSaveSchedule,
  numRows,
  groomers: propsGroomers,
  vans: propsVans,
  headerStyle,      // optional style for header boxes (e.g. backgroundColor)
  firstColumnStyle, // optional style for first column boxes
}) => {
  const { vans: contextVans } = useContext(VanContext);
  const { groomers: contextGroomers } = useContext(GroomerContext);
  const usedVans = propsVans && propsVans.length > 0 ? propsVans : contextVans;
  const usedGroomers = propsGroomers && propsGroomers.length > 0 ? propsGroomers : contextGroomers;

  const vanList =
    usedVans && usedVans.length > 0
      ? usedVans
      : Array.from({ length: numRows }, (_, i) => ({ id: i + 1, name: `Van ${i + 1}` }));

  const adjustedGridData =
    gridData && gridData.length > 0
      ? buildGridFromSchedule(gridData, vanList)
      : [];

  // --- Compute duplicate assignments per column ---
  let duplicateMap = {};
  if (adjustedGridData && adjustedGridData.length > 0) {
    const numCols = adjustedGridData[0].length;
    for (let col = 0; col < numCols; col++) {
      duplicateMap[col] = {};
      adjustedGridData.forEach((row) => {
        const cell = row[col];
        if (cell && cell.assignment && cell.assignment.trim() !== "") {
          duplicateMap[col][cell.assignment] =
            (duplicateMap[col][cell.assignment] || 0) + 1;
        }
      });
    }
  }
  console.log("Duplicate mapping by column:", duplicateMap);

  // --- Local state for editing and modals ---
  const [editingCell, setEditingCell] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorGroomer, setEditorGroomer] = useState("");
  const [editorStatus, setEditorStatus] = useState("");
  const [editorNote, setEditorNote] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [hiddenRows, setHiddenRows] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showHiddenColumns, setShowHiddenColumns] = useState(false);

  const currentUser = localStorage.getItem("username") || "Unknown";

  // --- Function to toggle column hidden state ---
  const toggleHideColumn = (colIndex) => {
    if (hiddenColumns.includes(colIndex)) {
      setHiddenColumns(hiddenColumns.filter((i) => i !== colIndex));
    } else {
      setHiddenColumns([...hiddenColumns, colIndex]);
    }
  };

  // --- Compute visible column indices ---
  const visibleColumnIndices =
    adjustedGridData.length > 0
      ? adjustedGridData[0]
          .map((_, i) => i)
          .filter((i) => !(hiddenColumns.includes(i) && !showHiddenColumns))
      : [];

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const [ , srcVan, srcDay ] = source.droppableId.split("-").map(Number);
    const [ , destVan, destDay ] = destination.droppableId.split("-").map(Number);
    const newGrid = adjustedGridData.map((row) => row.slice());
    const timestamp = new Date().toISOString();
    const distinctDates =
      newGrid.length > 0 ? newGrid[0].map((cell) => cell.day) : [];
    const dragDropRecord = {
      timestamp,
      action: "drag-drop",
      details: `Copied "${newGrid[srcVan][srcDay].assignment}" from Van ${vanList[srcVan].name}, Day ${srcDay + 1} to Van ${vanList[destVan].name}, Day ${destDay + 1} by ${currentUser}`,
    };
    newGrid[destVan][destDay].history.push(dragDropRecord);
    const sourceCellData = { ...newGrid[srcVan][srcDay] };
    sourceCellData.van_id = vanList[destVan].id;
    sourceCellData.day = distinctDates[destDay];
    newGrid[destVan][destDay] = {
      ...sourceCellData,
      history: [...(sourceCellData.history || []), dragDropRecord],
    };
    console.log(`Copied cell from [${srcVan}, ${srcDay}] to [${destVan}, ${destDay}]`);
    onGridChange(newGrid.flat());
  };

  const openEditorModal = (vanIndex, dayIndex) => {
    setEditingCell({ vanIndex, dayIndex });
    const cellData =
      adjustedGridData[vanIndex][dayIndex] || { assignment: "", status: "" };
    setEditorGroomer(cellData.assignment);
    setEditorStatus(cellData.status);
    setEditorNote("");
    setEditorOpen(true);
  };

  const handleEditorSave = () => {
    if (editingCell) {
      const { vanIndex, dayIndex } = editingCell;
      const newGrid = adjustedGridData.map((row) => row.slice());
      const timestamp = new Date().toISOString();
      const updateRecord = {
        timestamp,
        action: "updated",
        details: `Set to ${editorGroomer} and ${editorStatus}. Note: ${editorNote}. User: ${currentUser}`,
      };
      newGrid[vanIndex][dayIndex].assignment = editorGroomer;
      newGrid[vanIndex][dayIndex].status = editorStatus;
      newGrid[vanIndex][dayIndex].history.push(updateRecord);
      onGridChange(newGrid.flat());
      fetch(`${process.env.REACT_APP_API_URL}/cell-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          cell_id: `${newGrid[vanIndex][dayIndex].van_id}-${newGrid[vanIndex][dayIndex].day}`,
          date: newGrid[vanIndex][dayIndex].day,
          action: updateRecord.action,
          name: editorGroomer,
          status: editorStatus,
          note: editorNote,
          user: currentUser,
          timestamp,
        }),
      })
        .then((res) => res.json())
        .then((data) => console.log("History saved:", data))
        .catch((err) => console.error("Error saving history:", err));
      setEditorOpen(false);
      setEditingCell(null);
    }
  };

  const openHistoryModal = (vanIndex, dayIndex) => {
    const cellData = adjustedGridData[vanIndex][dayIndex];
    if (cellData) {
      const cell_id = `${cellData.van_id}-${cellData.day}`;
      const token = localStorage.getItem("token");
      fetch(`${process.env.REACT_APP_API_URL}/cell-history/${cell_id}`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch cell history");
          }
          return res.json();
        })
        .then((data) => {
          setCurrentHistory(data);
          setHistoryModalOpen(true);
        })
        .catch((err) => {
          console.error("Error fetching cell history:", err);
          setCurrentHistory([]);
          setHistoryModalOpen(true);
        });
    } else {
      setCurrentHistory([]);
      setHistoryModalOpen(true);
    }
  };

  const toggleHideRow = (vanIndex) => {
    if (hiddenRows.includes(vanIndex)) {
      setHiddenRows(hiddenRows.filter((i) => i !== vanIndex));
    } else {
      setHiddenRows([...hiddenRows, vanIndex]);
    }
  };

  // --- Render Grid Header using visibleColumnIndices ---
  const header = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `${cellWidth}px repeat(${visibleColumnIndices.length}, ${cellWidth}px)`,
        backgroundColor: headerStyle ? headerStyle.backgroundColor : "#1976d2",
        borderBottom: "1px solid #ccc",
      }}
    >
      <Box
        sx={{
          width: cellWidth,
          height: cellHeight,
          border: "1px solid #1976d2",
          boxSizing: "border-box",
          backgroundColor: firstColumnStyle ? firstColumnStyle.backgroundColor : "#FFFFFF",
          color: firstColumnStyle ? firstColumnStyle.color : "black",
          position: "sticky",
          left: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "inherit",
          textAlign: "center",
          p: 1,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: "7.25pt", textAlign: "center", lineHeight: 1.2 }}>
          Scheduled = <span style={{ fontWeight: "bold", color: "#008000" }}>Green</span>
          <br />
          Called Out = <span style={{ color: "#FF0000" }}>Red</span>
          <br />
          Filled In = <span style={{ color: "#FFA500" }}>Orange</span>
          <br />
          Time Off = <span style={{ color: "#FFFF00" }}>Yellow</span>
          <br />
          Event = <span style={{ color: "#ADD8E6" }}>Blue</span>
          <br />
          Terminated = <span style={{ color: "#8B4513" }}>Brown</span>
        </Typography>
      </Box>
      {visibleColumnIndices.map((i) => (
        <Box
          key={i}
          sx={{
            width: cellWidth,
            height: cellHeight,
            border: "1px solid #ccc",
            boxSizing: "border-box",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            // MODIFIED: Use headerStyle for day header background if provided.
            backgroundColor: headerStyle ? headerStyle.backgroundColor : "#1976d2",
            color: "white",
            opacity: hiddenColumns.includes(i) ? 0.5 : 1,
          }}
        >
          <Typography variant="caption">
            {adjustedGridData[0][i] && adjustedGridData[0][i].day
              ? new Date(adjustedGridData[0][i].day + "T00:00:00").toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })
              : ""}
            <br />
            {adjustedGridData[0][i] && adjustedGridData[0][i].day
              ? new Date(adjustedGridData[0][i].day + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                })
              : ""}
          </Typography>
          <IconButton
            size="small"
            onClick={() => toggleHideColumn(i)}
            sx={{ color: "white", p: 0 }}
          >
            {hiddenColumns.includes(i) ? (
              <VisibilityOffIcon fontSize="small" />
            ) : (
              <VisibilityIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      ))}
    </Box>
  );

  // --- Render Grid Body using visibleColumnIndices ---
  let body = null;
  if (!adjustedGridData || adjustedGridData.length === 0) {
    body = <Typography>No schedule data available.</Typography>;
  } else {
    body = usedVans.map((van, vanIndex) => {
      if (hiddenRows.includes(vanIndex) && !showHidden) return null;
      const row = adjustedGridData[vanIndex];
      if (!row || (adjustedGridData.length > 0 && row.length !== adjustedGridData[0].length)) {
        console.error(`Row for vanIndex ${vanIndex} is incomplete.`);
        return null;
      }
      return (
        <Box
          key={van.id}
          sx={{
            display: "grid",
            gridTemplateColumns: `${cellWidth}px repeat(${visibleColumnIndices.length}, ${cellWidth}px)`,
            opacity: hiddenRows.includes(vanIndex) ? 0.5 : 1,
          }}
        >
          <Box
            sx={{
              width: cellWidth,
              height: cellHeight,
              border: "1px solid #ccc",
              boxSizing: "border-box",
              textAlign: "center",
              fontWeight: "bold",
              backgroundColor: firstColumnStyle ? firstColumnStyle.backgroundColor : "#1976d2",
              color: firstColumnStyle ? firstColumnStyle.color : "white",
              position: "sticky",
              left: 0,
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
            }}
          >
            <Typography>{van.name}</Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleHideRow(vanIndex);
              }}
            >
              {hiddenRows.includes(vanIndex) ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
          {visibleColumnIndices.map((colIndex) => {
            const cellData = row[colIndex];
            const droppableId = `cell-${vanIndex}-${colIndex}`;
            const isSelected =
              editingCell &&
              editingCell.vanIndex === vanIndex &&
              editingCell.dayIndex === colIndex;
            let baseColor = getCellBackgroundColor(cellData ? cellData.status : "Blank");
            if (
              cellData &&
              cellData.assignment &&
              duplicateMap[colIndex] &&
              duplicateMap[colIndex][cellData.assignment] > 1
            ) {
              baseColor = "#FF0000";
            }
            return (
              <Box
                key={`${vanIndex}-${colIndex}`}
                sx={{
                  width: cellWidth,
                  height: cellHeight,
                  border: isSelected ? "2px solid #1976d2" : "1px solid #ccc",
                  boxSizing: "border-box",
                  position: "relative",
                }}
                onClick={() => openEditorModal(vanIndex, colIndex)}
              >
                <Droppable droppableId={droppableId}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: snapshot.isDraggingOver ? "#f0f0f0" : baseColor,
                      }}
                    >
                      <Draggable draggableId={`draggable-${vanIndex}-${colIndex}`} index={0}>
                        {(provided2, snapshot2) => (
                          <Box
                            ref={provided2.innerRef}
                            {...provided2.draggableProps}
                            {...provided2.dragHandleProps}
                            style={{ ...provided2.draggableProps.style }}
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              border: "1px solid #aaa",
                              borderRadius: 1,
                              backgroundColor: snapshot2.isDragging ? "#ddd" : "transparent",
                              p: 1,
                              boxSizing: "border-box",
                              position: "relative",
                            }}
                          >
                            <Typography variant="body2">
                              {cellData ? cellData.assignment : ""}
                            </Typography>
                            <Typography variant="caption">
                              {cellData ? cellData.status : "Blank"}
                            </Typography>
                            <Box sx={{ position: "absolute", top: 0, right: 0 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openHistoryModal(vanIndex, colIndex);
                                }}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        )}
                      </Draggable>
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Box>
            );
          })}
        </Box>
      );
    });
  }

  return (
    <>
      {hiddenRows.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Button variant="outlined" onClick={() => setShowHidden(!showHidden)}>
            {showHidden ? "Hide Hidden Rows" : "Show Hidden Rows"}
          </Button>
        </Box>
      )}
      {hiddenColumns.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Button variant="outlined" onClick={() => setShowHiddenColumns(!showHiddenColumns)}>
            {showHiddenColumns ? "Hide Hidden Columns" : "Show Hidden Columns"}
          </Button>
        </Box>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ overflowX: "auto", maxWidth: "100%", maxHeight: "80vh" }}>
          <Box sx={{ position: "sticky", top: 0, zIndex: 10 }}>{header}</Box>
          {body}
        </Box>
      </DragDropContext>
      <Box sx={{ mt: 2, textAlign: "right" }}>
        <Button variant="contained" onClick={() => onSaveSchedule(adjustedGridData)}>
          Save Schedule
        </Button>
      </Box>
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)}>
        <DialogTitle>Edit Assignment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="editor-groomer-label">Groomer</InputLabel>
            <Select
              labelId="editor-groomer-label"
              value={editorGroomer}
              label="Groomer"
              onChange={(e) => setEditorGroomer(e.target.value)}
            >
              {usedGroomers
                .filter((g) => g.inactive !== "Y")
                .map((g) => (
                  <MenuItem key={g.id} value={g.name}>
                    {g.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="editor-status-label">Status</InputLabel>
            <Select
              labelId="editor-status-label"
              value={editorStatus}
              label="Status"
              onChange={(e) => setEditorStatus(e.target.value)}
            >
              <MenuItem value="Scheduled">Scheduled</MenuItem>
              <MenuItem value="Called Out">Called Out</MenuItem>
              <MenuItem value="Filled In">Filled In</MenuItem>
              <MenuItem value="Time Off">Time Off</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
              <MenuItem value="Blank">Blank</MenuItem>
              <MenuItem value="Terminated">Terminated</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Note"
            fullWidth
            margin="normal"
            value={editorNote}
            onChange={(e) => setEditorNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditorSave} variant="contained" color="primary">
            Save
          </Button>
          <Button onClick={() => setEditorOpen(false)} variant="contained" color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{ "& .MuiDialog-paper": { width: "80%" } }}
      >
        <DialogTitle>Cell History</DialogTitle>
        <DialogContent dividers>
          {currentHistory.length > 0 ? (
            currentHistory.map((record, idx) => (
              <Box key={idx} sx={{ mb: 1 }}>
                <Typography variant="caption" display="block" sx={{ fontWeight: "bold" }}>
                  HISTORY CREATION DATE: {new Date(record.timestamp).toLocaleDateString()} TIME: {new Date(record.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  Action: {record.action} | Name: {record.name} | Status: {record.status} | Note: {record.note} | User: {record.user}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography>No history available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryModalOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomGrid;
