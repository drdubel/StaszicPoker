import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Cookies {
  [key: string]: string;
}

const TableLobby: React.FC = () => {
  const [wss, setWs] = useState<WebSocket | null>(null);
  const { tableId } = useParams<{ tableId: string }>();
  const [isLoading, setIsLoading] = useState(false);

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
      `wss://czupel.dry.pl/ws/start/${tableId}/${wsId}`
    );

    websocket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log(msg);
      if (msg === "0") {
        window.location.href = `https://staszicpoker-1.onrender.com/poker/${tableId}`;
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [tableId]);

  const startGame = () => {
    if (wss) {
      setIsLoading(true);
      const msg = "start";
      wss.send(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl p-8 shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Waiting for Players
          </h1>

          <div className="flex justify-center">
            <button
              onClick={startGame}
              disabled={isLoading}
              className={`
                px-6 py-3 rounded-lg font-semibold text-white
                transition-all duration-200
                ${
                  isLoading
                    ? "bg-emerald-600/50 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
                }
                shadow-lg hover:shadow-emerald-500/25
              `}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="https://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Starting Game...
                </span>
              ) : (
                "Start Game"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableLobby;
