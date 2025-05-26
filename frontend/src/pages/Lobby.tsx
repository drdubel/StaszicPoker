import React, { useState, useEffect } from "react";

interface Table {
  id: number;
  name: string;
  players: number;
  maxPlayers: number;
  minBet: number;
  status: "waiting" | "playing";
  pot: number;
}

const LobbyPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableMinBet, setNewTableMinBet] = useState(20);
  const [buyInAmount, setBuyInAmount] = useState(1000);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const cookies = document.cookie.split(";");
    const hasAccessToken = cookies.some((cookie) =>
      cookie.trim().startsWith("access_token=")
    );
    if (!hasAccessToken) {
      window.location.href = "/";
    }
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/tables");
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const createGame = async () => {
    if (!newTableName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/create-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName: newTableName,
          minBet: newTableMinBet,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewTableName("");
        setNewTableMinBet(20);
        fetchTables();

        // Auto-join the created table
        joinGame(data.tableId);
      }
    } catch (error) {
      console.error("Failed to create table:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinGame = (gameId: number) => {
    const wsId = getCookies()["wsId"];
    const ws = new WebSocket(
      "ws://localhost:8000/ws/join/" + gameId + "/" + wsId
    );
    const msg = JSON.stringify({ buyIn: buyInAmount });

    ws.onopen = function () {
      ws.send(msg);
      window.location.href = "http://localhost:5173/tableLobby/" + gameId;
    };
  };

  const handleJoinClick = (tableId: number) => {
    setSelectedTableId(tableId);
    setShowJoinModal(true);
  };

  const confirmJoin = () => {
    if (selectedTableId !== null) {
      joinGame(selectedTableId);
      setShowJoinModal(false);
    }
  };

  const isValidMinBet = () => {
    const n = newTableMinBet;
    return !isNaN(n) && n >= 1;
  };
  const isValidBuyIn = () => {
    const n = buyInAmount;
    return !isNaN(n) && n >= 100;
  };

  const getStatusColor = (status: string) => {
    return status === "waiting" ? "text-green-400" : "text-yellow-400";
  };

  const getStatusText = (status: string) => {
    return status === "waiting" ? "Waiting" : "In Progress";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Floating poker elements */}
      <div className="absolute top-20 left-20 w-6 h-6 bg-red-500 rounded-full opacity-20 animate-bounce delay-300"></div>
      <div className="absolute top-40 right-32 w-4 h-4 bg-blue-500 rounded-full opacity-20 animate-bounce delay-700"></div>
      <div className="absolute bottom-32 left-40 w-5 h-5 bg-yellow-500 rounded-full opacity-20 animate-bounce delay-1000"></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-purple-500 rounded-full opacity-20 animate-bounce delay-500"></div>

      {/* Decorative card suits */}
      <div className="absolute top-10 right-10 text-6xl text-emerald-500/10 animate-pulse">
        ♦
      </div>
      <div className="absolute bottom-10 left-10 text-6xl text-emerald-500/10 animate-pulse delay-1000">
        ♣
      </div>
      <div className="absolute top-1/2 right-10 text-4xl text-emerald-500/10 animate-pulse delay-500">
        ♥
      </div>
      <div className="absolute top-1/3 left-10 text-5xl text-emerald-500/10 animate-pulse delay-300">
        ♠
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-xl">♠</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 bg-clip-text text-transparent">
                  StaszicPoker
                </h1>
                <p className="text-slate-400">Premium Poker Experience</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative">Create Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Active Tables</h2>
          <p className="text-slate-400">
            Choose a table to join or create your own
          </p>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105 shadow-xl hover:shadow-2xl group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {table.name || `Table #${table.id}`}
                  </h3>
                  <span
                    className={`text-sm font-medium ${getStatusColor(
                      table.status
                    )}`}
                  >
                    {getStatusText(table.status)}
                  </span>
                </div>
                <div className="text-2xl text-emerald-400/50 group-hover:text-emerald-400 transition-colors">
                  ♠
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-400">
                  <span>Players:</span>
                  <span className="text-white font-medium">
                    {table.players}/{table.maxPlayers}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Small Blind:</span>
                  <span className="text-white font-medium">
                    ${table.minBet}
                  </span>
                </div>
                {table.status === "playing" && (
                  <div className="flex justify-between text-slate-400">
                    <span>Current Pot:</span>
                    <span className="text-emerald-400 font-medium">
                      ${table.pot}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleJoinClick(table.id)}
                disabled={
                  table.players >= table.maxPlayers ||
                  table.status !== "waiting"
                }
                className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 relative overflow-hidden ${
                  table.players >= table.maxPlayers ||
                  table.status === "playing"
                    ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl group"
                }`}
              >
                {table.players < table.maxPlayers
                  ? table.status === "playing"
                    ? "Game in Progress"
                    : "Join Table"
                  : "Table Full"}
              </button>
            </div>
          ))}

          {tables.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-2xl mb-6">
                <span className="text-4xl">🎴</span>
              </div>
              <h3 className="text-xl text-white mb-2">No tables available</h3>
              <p className="text-slate-400 mb-6">
                Be the first to create a table!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-3 rounded-2xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">Create First Table</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">
              Create New Table
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Table Name
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="w-full bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-2xl px-4 py-3 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Small Blind ($)
                </label>
                <input
                  type="number"
                  value={newTableMinBet}
                  onChange={(e) => setNewTableMinBet(parseInt(e.target.value))}
                  min="1"
                  className="w-full bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Buy-in Amount ($)
                </label>
                <input
                  type="number"
                  value={buyInAmount}
                  onChange={(e) => setBuyInAmount(parseInt(e.target.value))}
                  min="100"
                  step="100"
                  className="w-full bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <p className="text-sm text-slate-400 mt-2">
                  Recommended: $1000 - $5000
                </p>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-slate-600/50 backdrop-blur hover:bg-slate-600/70 text-white py-3 rounded-2xl font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createGame}
                disabled={
                  loading ||
                  !newTableName.trim() ||
                  !isValidMinBet() ||
                  !isValidBuyIn()
                }
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">
                  {loading ? "Creating..." : "Create & Join"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Table Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Join Table</h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Buy-in Amount ($)
              </label>
              <input
                type="number"
                value={buyInAmount}
                onChange={(e) =>
                  setBuyInAmount(parseInt(e.target.value) || 1000)
                }
                min="100"
                step="100"
                className="w-full bg-slate-700/50 backdrop-blur border border-slate-600/50 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <p className="text-sm text-slate-400 mt-2">
                Recommended: $1000 - $5000
              </p>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-slate-600/50 backdrop-blur hover:bg-slate-600/70 text-white py-3 rounded-2xl font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmJoin}
                disabled={!isValidBuyIn()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">Join Table</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyPage;
