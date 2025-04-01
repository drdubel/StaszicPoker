import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Lobby from "./pages/Lobby";
import TableLobby from "./pages/TableLobby";
import PokerTable from "./pages/PokerTable";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/tableLobby/:gameId" element={<TableLobby />} />
        <Route path="/poker/:gameId" element={<PokerTable />} />
      </Routes>
    </Router>
  );
}

export default App;
