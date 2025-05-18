import { useNavigate, useParams } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useEffect } from "react";

function TableLobby() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const wsId = document.cookie
    .split("; ")
    .find((row) => row.startsWith("wsId="))
    ?.split("=")[1];

  const { lastMessage, sendMessage } = useWebSocket(
    `ws://localhost:8000/ws/start/${tableId}/${wsId}`
  );

  useEffect(() => {
    if (lastMessage === "0") {
      navigate(`/poker/${tableId}`);
    }
  }, [lastMessage, navigate, tableId]);

  const startGame = () => {
    sendMessage("start");
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={startGame}
        className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
      >
        Start Game
      </button>
    </div>
  );
}

export default TableLobby;
