import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Player = {
  name: string;
};

const TableLobby = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomName = searchParams.get("room");

  useEffect(() => {
    if (!roomName) return;

    const ws = new WebSocket(`ws://localhost:5000/ws/lobby/${roomName}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "players") {
        setPlayers(data.players);
      }

      if (data.type === "start_game") {
        navigate(`/table?room=${roomName}`);
      }
    };

    setSocket(ws);

    return () => ws.close();
  }, [roomName]);

  const startGame = () => {
    socket?.send(JSON.stringify({ action: "start_game" }));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Room: {roomName}</h2>
      <h3 className="mt-4 text-lg">Players in Room:</h3>
      <ul className="list-disc list-inside">
        {players.map((p, i) => (
          <li key={i}>{p.name}</li>
        ))}
      </ul>

      <button
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={startGame}
      >
        Start Game
      </button>
    </div>
  );
};

export default TableLobby;
