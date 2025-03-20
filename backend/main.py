import json
import logging

from fastapi import FastAPI, WebSocket

from backend.gameLogic import Table
from backend.websocket import ws_manager

logger = logging.getLogger(__name__)

app = FastAPI()
tables: dict[int, Table] = {}


@app.websocket("/ws/join/{tableId}/{wsId}")
async def joinTable(websocket: WebSocket, tableId: int, wsId: str):
    await ws_manager.connect(websocket)

    message = await websocket.receive_text()
    message = json.loads(message)

    buyIn = int(message["buyIn"])

    try:
        tables[tableId].add_player(wsId, buyIn)

        await ws_manager.broadcast("0", "join")

    except KeyError:
        print("Table not found")

        await ws_manager.broadcast("-1", "join")


@app.websocket("/ws/create/{wsId}")
async def createTable(websocket: WebSocket):
    await ws_manager.connect(websocket)

    message = await websocket.receive_text()
    message = json.loads(message)

    tables[int((Table.tableId - 1) % 1e9)] = Table(message["minBet"])

    await ws_manager.broadcast("Table created", "create")


@app.websocket("/ws/betting/{tableId}/{wsId}")
async def websocket_betting(websocket: WebSocket, tableId: int, wsId: str):
    await ws_manager.connect(websocket)

    print(tableId, tables)
    if tableId in tables and tables[tableId].get_current_player() != wsId:
        print("Not your turn")

        return

    while websocket:
        message = await websocket.receive_text()
        message = json.loads(message)
        print(tableId, message)

        tables[tableId].action(wsId, message["action"], message.get("bet", 0))

        if isinstance(message, int):
            print("Bet:", message)

        else:
            if message:
                print("Check")
            else:
                print("Fold")

        await ws_manager.broadcast(str(message), "betting")
