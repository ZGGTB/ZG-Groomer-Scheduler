// src/contexts/VanContext.js
import React, { createContext, useState, useEffect } from "react";

export const VanContext = createContext();

export const VanProvider = ({ children }) => {
  const [vans, setVans] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch the list of vans from the backend when the component mounts.
  useEffect(() => {
    fetch("http://localhost:3001/vans", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error fetching vans");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched vans:", data);
        setVans(data);
      })
      .catch((err) => console.error("Error fetching vans:", err));
  }, [token]);

  // Add a new van.
  // Since the DB auto-generates the ID, we send only the van name.
  const addVan = (vanData) => {
    return fetch("http://localhost:3001/vans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(vanData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to add van");
        }
        return res.json();
      })
      .then((newVan) => {
        setVans((prev) => [...prev, newVan]);
        return newVan;
      })
      .catch((err) => {
        console.error("Error adding van:", err);
        throw err;
      });
  };

  // Update an existing van.
  const updateVan = (updatedVan) => {
    return fetch(`http://localhost:3001/vans/${updatedVan.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(updatedVan),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update van");
        }
        return res.json();
      })
      .then((data) => {
        setVans((prev) =>
          prev.map((van) => (van.id === updatedVan.id ? data : van))
        );
        return data;
      })
      .catch((err) => {
        console.error("Error updating van:", err);
        throw err;
      });
  };

  // Delete a van.
  const deleteVan = (id) => {
    return fetch(`http://localhost:3001/vans/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete van");
        }
        return res.json();
      })
      .then(() => {
        setVans((prev) => prev.filter((van) => van.id !== id));
      })
      .catch((err) => {
        console.error("Error deleting van:", err);
        throw err;
      });
  };

  return (
    <VanContext.Provider value={{ vans, addVan, updateVan, deleteVan }}>
      {children}
    </VanContext.Provider>
  );
};
