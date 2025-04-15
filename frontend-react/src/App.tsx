import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Lobby from "./components/Lobby";
import TableLobby from "./components/TableLobby";
import PokerTable from "./components/PokerTable";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/table-lobby" element={<TableLobby />} />
        <Route path="/poker" element={<PokerTable />} />
      </Routes>
    </Router>
  );
}

export default App;
