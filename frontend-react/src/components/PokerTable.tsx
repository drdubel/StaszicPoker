import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "./Card";

type Player = {
  name: string;
  chips: number;
  is_turn: boolean;
};

type GameState = {
  community_cards: string[]; // e.g., ["AS", "5H"]
  players: Player[];
  pot: number;
  hand: string[]; // cards for the current player
};

const PokerTable = () => {
  const [searchParams] = useSearchParams();
  const roomName = searchParams.get("room");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [actionValue, setActionValue] = useState("");

  useEffect(() => {
    if (!roomName) return;

    const ws = new WebSocket(`ws://127.0.0.1:5000/ws/betting/${roomName}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "state") {
        setGameState(data.state);
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [roomName]);

  const sendAction = (action: string, amount?: number) => {
    socket?.send(JSON.stringify({ action, amount }));
    setActionValue("");
  };

  if (!gameState) return <div className="p-4">Waiting for game state...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Poker Game</h2>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Pot: ${gameState.pot}</h3>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Community Cards:</h3>
        <div className="flex space-x-2 mt-2">
          {gameState.community_cards.map((card, i) => (
            <Card key={i} code={card} />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Your Hand:</h3>
        <div className="flex space-x-2 mt-2">
          {gameState.hand.map((card, i) => (
            <Card key={i} code={card} />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Players:</h3>
        <ul className="list-inside list-disc">
          {gameState.players.map((p, i) => (
            <li key={i} className={p.is_turn ? "font-bold text-blue-600" : ""}>
              {p.name} - ${p.chips}
              {p.is_turn && " (Your Turn)"}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex space-x-2">
        <button
          onClick={() => sendAction("check")}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Check
        </button>
        <button
          onClick={() => sendAction("call")}
          className="bg-yellow-300 px-4 py-2 rounded"
        >
          Call
        </button>
        <button
          onClick={() => sendAction("fold")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Fold
        </button>

        <input
          type="number"
          value={actionValue}
          onChange={(e) => setActionValue(e.target.value)}
          placeholder="Raise Amount"
          className="border px-2 py-1 rounded w-24"
        />
        <button
          onClick={() => sendAction("raise", parseInt(actionValue))}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Raise
        </button>
      </div>
    </div>
  );
};

export default PokerTable;
