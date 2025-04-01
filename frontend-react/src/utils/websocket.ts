import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const getCookies = () => {
  return document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
};

const wsId = getCookies()["wsId"];

export const createGame = (tableName: string, minBet: number) => {
  const ws = new WebSocket(`ws://127.0.0.1:5000/ws/create/${wsId}`);
  ws.onopen = () => ws.send(JSON.stringify({ tableName, minBet }));
};

export const joinGame = (gameId: number, navigate: ReturnType<typeof useNavigate>) => {
  const ws = new WebSocket(`ws://127.0.0.1:5000/ws/join/${gameId}/${wsId}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ buyIn: 1000 }));
    navigate(`/tableLobby/${gameId}`);
  };
};

export const startGame = () => {
  const ws = new WebSocket(`ws://127.0.0.1:5000/ws/start/0`);
  ws.onmessage = (event) => {
    if (event.data === "0") window.location.href = "/poker/0";
  };
  ws.send("start");
};

export const sendAction = (value: number) => {
  const ws = new WebSocket(`ws://127.0.0.1:5000/ws/betting/0/${wsId}`);
  ws.onopen = () => ws.send(value.toString());
};

export const usePokerWebSocket = () => {
  const [currentBet, setCurrentBet] = useState(0);
  const [yourCurrentBet, setYourCurrentBet] = useState(0);
  const [currentPot, setCurrentPot] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState("Waiting");
  const [currentChips, setCurrentChips] = useState(0);
  const [cards, setCards] = useState<string[]>(Array(5).fill("CB"));
  const [playerCards, setPlayerCards] = useState<string[]>(Array(2).fill("CB"));
  
  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:5000/ws/betting/0/${wsId}`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (Array.isArray(msg)) {
        if (msg.length === 5) setCards(msg);
        else setPlayerCards(msg);
      } else {
        const type = msg[0];
        const value = msg.substring(1);
        if (type === "B") setCurrentBet(parseInt(value));
        else if (type === "M") setYourCurrentBet(parseInt(value));
        else if (type === "P") setCurrentPot(parseInt(value));
        else if (type === "G") setCurrentPlayer(value);
        else if (type === "C") setCurrentChips(parseInt(value));
      }
    };
    return () => ws.close();
  }, []);

  return { currentBet, yourCurrentBet, currentPot, currentPlayer, currentChips, cards, playerCards };
};
