import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Lobby from "./pages/Lobby";
import TableLobby from "./pages/TableLobby";
import Poker from "./pages/Poker";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/tableLobby/:tableId" element={<TableLobby />} />
        <Route path="/poker/:tableId" element={<Poker />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
