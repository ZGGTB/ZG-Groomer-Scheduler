// src/contexts/GroomerContext.js
import React, { createContext, useState, useEffect } from "react";

export const GroomerContext = createContext();

export const GroomerProvider = ({ children }) => {
  const [groomers, setGroomers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found; groomers will not be fetched.");
      return;
    }
    fetch("http://localhost:3001/groomers", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error fetching groomers: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched groomers:", data);
        setGroomers(data);
      })
      .catch((err) => console.error("Error fetching groomers:", err));
  }, []);

  const addGroomer = (newGroomer) => {
    setGroomers((prev) => [...prev, newGroomer]);
  };

  const updateGroomer = (updatedGroomer) => {
    setGroomers((prev) =>
      prev.map((g) => (g.id === updatedGroomer.id ? updatedGroomer : g))
    );
  };

  const deleteGroomer = (id) => {
    setGroomers((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <GroomerContext.Provider value={{ groomers, addGroomer, updateGroomer, deleteGroomer }}>
      {children}
    </GroomerContext.Provider>
  );
};
