import React from "react";
import { sendAction, usePokerWebSocket } from "../utils/websocket";

const PokerTable: React.FC = () => {
  const {
    currentBet,
    currentPot,
    currentPlayer,
    currentChips,
    yourCurrentBet,
    cards,
    playerCards,
  } = usePokerWebSocket();

  return (
    <div className="poker-table">
      <h1>Poker Game</h1>
      <button onClick={() => sendAction(100)}>Bet 100</button>
      <button onClick={() => sendAction(200)}>Bet 200</button>
      <button onClick={() => sendAction(300)}>Bet 300</button>
      <button onClick={() => sendAction(400)}>Bet 400</button>
      <button onClick={() => sendAction(500)}>Bet 500</button>
      <button onClick={() => sendAction(currentChips)}>All in</button>
      <button onClick={() => sendAction(currentBet - yourCurrentBet)}>
        Call
      </button>
      <button onClick={() => sendAction(0)}>Check</button>
      <button onClick={() => sendAction(-1)}>Fold</button>
      <h2>Current Bet: {currentBet}</h2>
      <h2>Your Bet: {yourCurrentBet}</h2>
      <h2>Current Player: {currentPlayer}</h2>
      <h2>Pot: {currentPot}</h2>
      <h2>Chips: {currentChips}</h2>
      <div>
        {cards.map((card, index) => (
          <img
            key={index}
            src={`/static/cards/${card}.png`}
            alt={`Card ${index + 1}`}
            width={125}
          />
        ))}
      </div>
      <div>
        {playerCards.map((card, index) => (
          <img
            key={index}
            src={`/static/cards/${card}.png`}
            alt={`Player Card ${index + 1}`}
            width={125}
          />
        ))}
      </div>
    </div>
  );
};

export default PokerTable;
