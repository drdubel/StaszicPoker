import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface PlayerData {
  userid: string;
  wins: number;
  losses: number;
  earnings: number;
}

type SortColumn = 0 | 1 | 2 | 3;

const StatsPage: React.FC = () => {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const filtered = players.filter((player) =>
      player.userid.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlayers(filtered);
  }, [players, searchTerm]);

  useEffect(() => {
    const getCookies = (): Record<string, string> => {
      const cookies = document.cookie.split(";");
      const cookieDict: Record<string, string> = {};

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].split("=");
        if (cookie.length === 2) {
          cookieDict[cookie[0].trim()] = cookie[1];
        }
      }
      return cookieDict;
    };

    const wsId = getCookies()["wsId"];

    if (wsId) {
      const wss = new WebSocket(`wss://czupel.dry.pl/wss/read/${wsId}`);
      wss.onmessage = (event) => {
        try {
          const data = JSON.parse(JSON.parse(event.data));
          const playersData: PlayerData[] = data.map((item: any[]) => ({
            userid: item[0],
            wins: item[1],
            losses: item[2],
            earnings: item[3],
          }));
          setPlayers(playersData);
        } catch (error) {
          console.error("Error processing WebSocket data:", error);
        }
      };
      wsRef.current = wss;
    }

    return () => wsRef.current?.close();
  }, []);

  const sortTable = (columnIndex: SortColumn) => {
    const sorted = [...filteredPlayers].sort((a, b) => {
      const valA = [a.userid, a.wins, a.losses, a.earnings][columnIndex];
      const valB = [b.userid, b.wins, b.losses, b.earnings][columnIndex];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection ? valA - valB : valB - valA;
      }
      return sortDirection
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    setFilteredPlayers(sorted);
    setSortDirection(!sortDirection);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 relative overflow-hidden p-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate("/lobby")}
          className="bg-slate-700/60 hover:bg-slate-700 text-white px-5 py-2 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
        >
          ← Back to Lobby
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 bg-clip-text text-transparent mb-2">
          Poker Leaderboard
        </h1>
        <p className="text-slate-400 text-lg mb-4">
          Track top players and their stats
        </p>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by player name..."
          className="w-full bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl px-4 py-3 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors mb-6"
        />

        <div className="overflow-x-auto bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-xl">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-slate-300 text-sm">
                {["Player", "Wins", "Losses", "Earnings ($)"].map((col, i) => (
                  <th
                    key={col}
                    onClick={() => sortTable(i as SortColumn)}
                    className="py-4 px-6 cursor-pointer hover:text-white"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr
                  key={`${player.userid}-${index}`}
                  className="text-white border-t border-slate-700 hover:bg-slate-700/30"
                >
                  <td className="py-3 px-6 font-medium">{player.userid}</td>
                  <td className="py-3 px-6">{player.wins}</td>
                  <td className="py-3 px-6">{player.losses}</td>
                  <td className="py-3 px-6 text-emerald-400">
                    ${player.earnings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPlayers.length === 0 && players.length > 0 && (
            <div className="text-center py-8 text-slate-400">
              No players found matching "{searchTerm}"
            </div>
          )}

          {players.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Connecting to server...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
