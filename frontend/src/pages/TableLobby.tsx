import React, { useEffect, useState } from "react";

interface Cookies {
  [key: string]: string;
}

const TableLobby: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const gameId = 0;

  const getCookies = (): Cookies => {
    const cookies = document.cookie.split(";");
    const cookieDict: Cookies = {};

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      cookieDict[cookie[0].trim()] = cookie[1];
    }

    return cookieDict;
  };

  useEffect(() => {
    const wsId = getCookies()["wsId"];
    const websocket = new WebSocket(
      `ws://localhost:8000/ws/start/${gameId}/${wsId}`
    );

    websocket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log(msg);
      if (msg === "DISCONNECT") {
        window.location.href = "/";
        return;
      }
      if (msg === "0") {
        window.location.href = `http://localhost:5173/poker/${gameId}`;
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const startGame = () => {
    if (ws) {
      const msg = "start";
      ws.send(msg);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        margin: 0,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <button
        onClick={startGame}
        style={{
          margin: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Start Game
      </button>
    </div>
  );
};

export default TableLobby;
