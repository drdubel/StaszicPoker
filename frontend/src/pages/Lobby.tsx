import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";

function Lobby() {
  const navigate = useNavigate();
  const wsId = document.cookie
    .split("; ")
    .find((row) => row.startsWith("wsId="))
    ?.split("=")[1];

  const { sendMessage } = useWebSocket(`ws://localhost:8000/ws/create/${wsId}`);

  const createGame = (tableName: string, minBet: number) => {
    sendMessage({ tableName, minBet });
  };

  const joinGame = (gameId: number) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/join/${gameId}/${wsId}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ buyIn: 1000 }));
      navigate(`/tableLobby/${gameId}`);
    };
  };

  return (
    <div className="flex h-screen items-center justify-center gap-4">
      <button
        onClick={() => createGame("table", 20)}
        className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
      >
        Create Game
      </button>
      <button
        onClick={() => joinGame(0)}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Join Game
      </button>
    </div>
  );
}

export default Lobby;
