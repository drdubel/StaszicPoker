import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Lobby from "./pages/Lobby";
import TableLobby from "./pages/TableLobby";
import Poker from "./pages/Poker";
import Stats from "./pages/Stats";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/tableLobby/:tableId" element={<TableLobby />} />
        <Route path="/poker/:tableId" element={<Poker />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
