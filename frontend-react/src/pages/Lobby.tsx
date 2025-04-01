import React from "react";
import { useNavigate } from "react-router-dom";
import { createGame, joinGame } from "../utils/websocket";

const Lobby: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateGame = () => {
    createGame("stolik", 20);
  };

  const handleJoinGame = () => {
    joinGame(0, navigate);
  };

  return (
    <div className="lobby">
      <button onClick={handleCreateGame}>Create Game</button>
      <button onClick={handleJoinGame}>Join</button>
    </div>
  );
};

export default Lobby;
