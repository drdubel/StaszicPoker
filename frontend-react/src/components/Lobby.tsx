import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Room = {
  name: string;
  players: number;
};

const Lobby = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Example: Fetch room list from backend
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data.rooms))
      .catch((err) => console.error("Failed to load rooms", err));
  }, []);

  const createRoom = async () => {
    if (!newRoom) return;
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoom }),
      });
      if (res.ok) {
        navigate(`/table-lobby?room=${newRoom}`);
      }
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  const joinRoom = (roomName: string) => {
    navigate(`/table-lobby?room=${roomName}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Game Lobby</h2>

      <div className="mb-4">
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="Room name"
          className="border p-2 rounded mr-2"
        />
        <button
          onClick={createRoom}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Room
        </button>
      </div>

      <ul>
        {rooms.map((room) => (
          <li
            key={room.name}
            className="mb-2 flex justify-between items-center"
          >
            <span>
              {room.name} ({room.players} players)
            </span>
            <button
              onClick={() => joinRoom(room.name)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded"
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
