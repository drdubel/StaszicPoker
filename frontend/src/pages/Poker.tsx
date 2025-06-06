import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const PokerPage: React.FC = () => {
  const { tableId } = useParams();
  const [currentBet, setCurrentBet] = useState(0);
  const [currentPot, setCurrentPot] = useState(0);
  const [yourCurrentBet, setYourCurrentBet] = useState(0);
  const [currentChips, setCurrentChips] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [winningOrder, setWinningOrder] = useState("");
  const [showWinningOrder, setShowWinningOrder] = useState(false);
  const [showNextRound, setShowNextRound] = useState(false);
  const [cards, setCards] = useState(["CB", "CB", "CB", "CB", "CB"]);
  const [playerCards, setPlayerCards] = useState(["CB", "CB"]);
  const [players, setPlayers] = useState<
    {
      id: string;
      chips: number;
      currentBet: number;
      position: number;
      isActive: boolean;
    }[]
  >([]);

  const wsRef = useRef<WebSocket | null>(null);
  const yourIdRef = useRef<string>("");

  const getCookies = () => {
    const cookies = document.cookie.split(";");
    const cookieDict: { [key: string]: string } = {};
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      cookieDict[cookie[0].trim()] = cookie[1];
    }
    return cookieDict;
  };

  useEffect(() => {
    const wsId = getCookies()["wsId"];
    const betting = new WebSocket(
      `wss://czupel.dry.pl/ws/betting/${tableId}/${wsId}`
    );
    wsRef.current = betting;

    betting.onmessage = function (event) {
      let msg = JSON.parse(event.data).replace(/'/g, '"');
      console.log(msg);

      if (msg[0] == "B") {
        setCurrentBet(parseInt(msg.substring(1)));
      } else if (msg[0] == "C") {
        msg = JSON.parse(msg.substring(1));
        console.log(msg);
        setPlayers((prevPlayers) =>
          prevPlayers.map((p, i) => ({
            ...p,
            chips: msg[i],
          }))
        );
        setCurrentChips(msg[yourIdRef.current]);
      } else if (msg[0] == "D") {
        console.log(msg.substring(1));
        msg = JSON.parse(msg.substring(1));
        setCards(msg);
      } else if (msg[0] == "E") {
        const winOrder = JSON.parse(msg.substring(1));
        console.log(winOrder);
        setCurrentPlayer("Game Over");
        setCurrentBet(0);
        setCurrentPot(0);
        setYourCurrentBet(0);
        setWinningOrder(JSON.stringify(winOrder));
        setShowWinningOrder(true);
        setShowNextRound(true);
      } else if (msg[0] == "G") {
        if (msg.substring(1) == yourIdRef.current) {
          setCurrentPlayer("Your turn");
        } else {
          setCurrentPlayer(msg.substring(1));
        }
      } else if (msg[0] == "M") {
        msg = JSON.parse(msg.substring(1));
        // Update all players' current bets
        setPlayers((prevPlayers) =>
          prevPlayers.map((p, i) => ({
            ...p,
            currentBet: msg[i],
          }))
        );
        setYourCurrentBet(msg[yourIdRef.current]);
      } else if (msg[0] == "N") {
        msg = JSON.parse(msg.substring(1));
        setShowWinningOrder(false);
        setShowNextRound(false);
        setPlayerCards(msg);
      } else if (msg[0] == "P") {
        setCurrentPot(parseInt(msg.substring(1)));
      } else if (msg[0] == "Y") {
        yourIdRef.current = msg.substring(1);
        // Initialize players array when we get our position
        const initialPlayers = Array(8)
          .fill(null)
          .map((_, i) => ({
            id: i.toString(),
            chips: 0,
            currentBet: 0,
            position: i,
            isActive: false,
          }));
        setPlayers(initialPlayers);
      }
    };

    return () => {
      betting.close();
    };
  }, []);

  const nextRound = () => {
    if (wsRef.current) {
      wsRef.current.send('"N"');
    }
  };

  const action = (value: number) => {
    const msg = value.toString();
    console.log(msg);
    if (wsRef.current) {
      wsRef.current.send(msg);
    }
  };

  const PlayerPosition: React.FC<{
    player: (typeof players)[0];
    isCurrentPlayer: boolean;
    yourPosition: number;
  }> = ({ player, isCurrentPlayer, yourPosition }) => {
    const getPosition = (pos: number) => {
      let relativePos = (pos - yourPosition + 8) % 8;

      const positions = {
        0: "bottom-24 left-1/2 -translate-x-1/2", // Your position (hidden)
        1: "bottom-8 right-1/5", // Bottom right
        2: "top-1/2 right-8 -translate-y-1/2", // Middle right
        3: "top-8 right-1/5", // Top right
        4: "top-8 left-1/2 -translate-x-1/2", // Top center
        5: "top-8 left-1/5", // Top left
        6: "top-1/2 left-8 -translate-y-1/2", // Middle left
        7: "bottom-8 left-1/5", // Bottom left
      };
      return positions[relativePos as keyof typeof positions] || "";
    };

    if (player.position === parseInt(yourIdRef.current)) {
      return null;
    }

    return (
      <div className={`absolute ${getPosition(player.position)} transform`}>
        <div
          className={`
        p-3 rounded-xl backdrop-blur-sm
        ${
          isCurrentPlayer
            ? "bg-emerald-600/50 ring-2 ring-emerald-400"
            : "bg-slate-800/50"
        }
        ${player.isActive ? "opacity-100" : "opacity-50"}
      `}
        >
          <div className="text-center">
            <p className="text-white font-medium text-sm">
              Player {player.position + 1}
            </p>
            <p className="text-emerald-400 font-bold">${player.chips}</p>
            {player.currentBet > 0 && (
              <p className="text-xs text-slate-300">
                Bet: ${player.currentBet}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 p-4">
      {/* Poker Table */}
      <div className="relative max-w-7xl mx-auto">
        {/* Game Info Bar */}
        <div className="flex justify-between items-center mb-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex space-x-8">
            <div>
              <p className="text-slate-400 text-sm">Current Pot</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${currentPot}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Current Bet</p>
              <p className="text-2xl font-bold text-white">${currentBet}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Current Player</p>
            <p
              className={`text-xl font-semibold ${
                currentPlayer === "Your turn"
                  ? "text-emerald-400"
                  : "text-white"
              }`}
            >
              {currentPlayer}
            </p>
          </div>
        </div>

        {/* Poker Table */}
        <div className="relative w-full aspect-[2/1] bg-emerald-800 rounded-[12rem] border-8 border-brown-900 shadow-2xl mb-8">
          {/* Felt Pattern */}
          <div
            className="absolute inset-0 rounded-[11rem] opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='https://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Community Cards */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-2">
            {cards.map((card, index) => (
              <div
                key={index}
                className="transform transition-transform hover:scale-110 hover:-translate-y-2"
              >
                <img
                  src={`/cards/${card}.png`}
                  alt={`Card ${index + 1}`}
                  className="w-24 rounded-lg shadow-xl"
                />
              </div>
            ))}
          </div>

          {/* Other Players */}
          {players
            .filter(
              (player) =>
                player.chips > 0 ||
                player.currentBet > 0 ||
                player.position === parseInt(yourIdRef.current)
            )
            .map((player) => (
              <PlayerPosition
                key={player.position}
                player={player}
                isCurrentPlayer={currentPlayer === player.position.toString()}
                yourPosition={parseInt(yourIdRef.current)}
              />
            ))}

          {/* Player Cards */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {playerCards.map((card, index) => (
              <div
                key={index}
                className="transform transition-transform hover:scale-110 hover:-translate-y-2"
                style={{ width: "min(12vw, 96px)" }}
              >
                <img
                  src={`/cards/${card}.png`}
                  alt={`Player card ${index + 1}`}
                  className="w-full rounded-lg shadow-xl"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Player Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-slate-400 text-sm">Your Chips</p>
              <p className="text-2xl font-bold text-white">${currentChips}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Your Current Bet</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${yourCurrentBet}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 300, 400, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => action(amount)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => action(currentChips)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                All In
              </button>
              <button
                onClick={() => action(currentBet - yourCurrentBet)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Call
              </button>
              <button
                onClick={() => action(0)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Check
              </button>
              <button
                onClick={() => action(-1)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Fold
              </button>
            </div>
          </div>
        </div>

        {/* Game Over Modal */}
        {showWinningOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">Game Over</h2>
              <p className="text-slate-400 mb-6">
                Winning order: {winningOrder}
              </p>
              {showNextRound && (
                <button
                  onClick={nextRound}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Next Round
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokerPage;
