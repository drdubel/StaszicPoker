import React, { useState, useEffect, useRef } from "react";

const PokerPage: React.FC = () => {
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
    const betting = new WebSocket("ws://localhost:8000/ws/betting/0/" + wsId);
    wsRef.current = betting;

    betting.onmessage = function (event) {
      let msg = JSON.parse(event.data).replace(/'/g, '"');
      console.log(msg);

      if (msg[0] == "B") {
        setCurrentBet(parseInt(msg.substring(1)));
      } else if (msg[0] == "C") {
        msg = JSON.parse(msg.substring(1));
        console.log(msg);
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

  const styles = {
    body: {
      fontFamily: "Arial, sans-serif",
      textAlign: "center" as const,
      marginTop: "50px",
    },
    button: {
      margin: "10px",
      padding: "10px 20px",
      fontSize: "16px",
      cursor: "pointer",
      textAlign: "center" as const,
    },
    message: {
      marginTop: "20px",
      fontSize: "18px",
      color: "#333",
    },
  };

  return (
    <div style={styles.body}>
      <h1>Example HTML with 5 Buttons</h1>
      <button style={styles.button} onClick={() => action(100)}>
        Bet 100
      </button>
      <button style={styles.button} onClick={() => action(200)}>
        Bet 200
      </button>
      <button style={styles.button} onClick={() => action(300)}>
        Bet 300
      </button>
      <button style={styles.button} onClick={() => action(400)}>
        Bet 400
      </button>
      <button style={styles.button} onClick={() => action(500)}>
        Bet 500
      </button>
      <button style={styles.button} onClick={() => action(currentChips)}>
        All in
      </button>
      <button
        style={styles.button}
        onClick={() => action(currentBet - yourCurrentBet)}
      >
        Call
      </button>
      <button style={styles.button} onClick={() => action(0)}>
        Check
      </button>
      <button style={styles.button} onClick={() => action(-1)}>
        Fold
      </button>

      <div id="message" style={styles.message}></div>

      <h1>
        Current bet: <span>{currentBet}</span>
      </h1>
      <h1>
        Your current bet: <span>{yourCurrentBet}</span>
      </h1>
      <h1>
        Current player: <span>{currentPlayer}</span>
      </h1>
      <h1>
        Current pot: <span>{currentPot}</span>
      </h1>
      <h1>
        Current chips: <span>{currentChips}</span>
      </h1>

      <div>
        {cards.map((card, index) => (
          <img
            key={index}
            src={`/cards/${card}.png`}
            alt={`Card ${index + 1}`}
            width="125"
          />
        ))}
      </div>

      <div>
        {playerCards.map((card, index) => (
          <img
            key={index}
            src={`/cards/${card}.png`}
            alt={`Player card ${index + 1}`}
            width="125"
          />
        ))}
      </div>

      {showWinningOrder && (
        <h1>
          Winning order: <span>{winningOrder}</span>
        </h1>
      )}

      {showNextRound && (
        <button style={styles.button} onClick={nextRound}>
          Next Round
        </button>
      )}
    </div>
  );
};

export default PokerPage;
