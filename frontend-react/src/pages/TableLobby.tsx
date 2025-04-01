import React from "react";
import { startGame } from "../utils/websocket";

const TableLobby: React.FC = () => {
  return (
    <div className="table-lobby">
      <button onClick={startGame}>Start Game</button>
    </div>
  );
};

export default TableLobby;
