import { useParams } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";

function Poker() {
  const { tableId } = useParams();
  const wsId = document.cookie
    .split("; ")
    .find((row) => row.startsWith("wsId="))
    ?.split("=")[1];

  const [gameState, setGameState] = useState({
    playerCards: ["CB", "CB"],
    communityCards: ["CB", "CB", "CB", "CB", "CB"],
    currentBet: 0,
    currentPot: 0,
    yourCurrentBet: 0,
    currentChips: 0,
    currentPlayer: "",
    playerId: "",
  });

  const { lastMessage, sendMessage } = useWebSocket(
    `ws://127.0.0.1:8000/ws/betting/${tableId}/${wsId}`
  );

  useEffect(() => {
    if (!lastMessage) return;

    const type = lastMessage[0];
    const data = lastMessage.substring(1);

    switch (type) {
      case "Y":
        setGameState((prev) => ({ ...prev, playerId: data }));
        break;
      case "N":
        setGameState((prev) => ({ ...prev, playerCards: JSON.parse(data) }));
        break;
      case "D":
        setGameState((prev) => ({ ...prev, communityCards: JSON.parse(data) }));
        break;
      case "B":
        setGameState((prev) => ({ ...prev, currentBet: parseInt(data) }));
        break;
      case "P":
        setGameState((prev) => ({ ...prev, currentPot: parseInt(data) }));
        break;
      case "G":
        setGameState((prev) => ({ ...prev, currentPlayer: data }));
        break;
      // Add other message types as needed
    }
  }, [lastMessage]);

  const placeBet = (amount: number) => {
    sendMessage(amount.toString());
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <div className="flex gap-2">
        {gameState.communityCards.map((card, i) => (
          <img
            key={i}
            src={`/cards/${card}.png`}
            alt={`Community card ${i + 1}`}
            className="h-32 w-24"
          />
        ))}
      </div>
      <div className="flex gap-2">
        {gameState.playerCards.map((card, i) => (
          <img
            key={i}
            src={`/cards/${card}.png`}
            alt={`Your card ${i + 1}`}
            className="h-32 w-24"
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => placeBet(100)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Bet 100
        </button>
        <button
          onClick={() => placeBet(0)}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Check
        </button>
        <button
          onClick={() => placeBet(-1)}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Fold
        </button>
      </div>
      <div className="text-lg">
        <p>Current bet: {gameState.currentBet}</p>
        <p>Current pot: {gameState.currentPot}</p>
        <p>Your chips: {gameState.currentChips}</p>
        <p>
          Current player:{" "}
          {gameState.currentPlayer === gameState.playerId
            ? "Your turn"
            : gameState.currentPlayer}
        </p>
      </div>
    </div>
  );
}

export default Poker;
