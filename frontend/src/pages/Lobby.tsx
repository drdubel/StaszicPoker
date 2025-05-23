import React from "react";

const LobbyPage: React.FC = () => {
  const getCookies = () => {
    const cookies = document.cookie.split(";");
    const cookieDict: { [key: string]: string } = {};
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      cookieDict[cookie[0].trim()] = cookie[1];
    }
    return cookieDict;
  };

  const createGame = (tableName: string, minBet: number) => {
    const wsId = getCookies()["wsId"];
    const ws = new WebSocket("ws://localhost:8000/ws/create/" + wsId);
    const msg = JSON.stringify({ tableName: tableName, minBet: minBet });

    ws.onopen = function () {
      ws.send(msg);
    };
  };

  const joinGame = (gameId: number) => {
    const wsId = getCookies()["wsId"];
    const ws = new WebSocket(
      "ws://localhost:8000/ws/join/" + gameId + "/" + wsId
    );
    const msg = JSON.stringify({ buyIn: 1000 });

    ws.onopen = function () {
      ws.send(msg);
      window.location.href = "http://localhost:5173/tableLobby/" + gameId;
    };
  };

  const styles = {
    body: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      margin: 0,
      fontFamily: "Arial, sans-serif",
    },
    button: {
      margin: "10px",
      padding: "10px 20px",
      fontSize: "16px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.body}>
      <button style={styles.button} onClick={() => createGame("stolik", 20)}>
        Create Game
      </button>
      <button style={styles.button} onClick={() => joinGame(0)}>
        Join
      </button>
    </div>
  );
};

export default LobbyPage;
