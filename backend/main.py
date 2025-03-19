import logging

from fastapi import FastAPI, WebSocket

from backend.gameLogic import Table
from backend.websocket import ws_manager

logger = logging.getLogger(__name__)

app = FastAPI()
tables: dict[int, Table] = {0: Table(10)}


@app.websocket("/ws/join/{tableId}/{wsId}")
async def joinTable(websocket: WebSocket, tableId: str, wsId: str):
    await ws_manager.connect(websocket)

    buyIn = websocket.iter_json()["buyIn"]
    tables[tableId].add_player(wsId, buyIn)
    await ws_manager.broadcast("Player joined", "join")


@app.websocket("/ws/betting/{tableId}/{wsId}")
async def websocket_betting(websocket: WebSocket, tableId: str, wsId: str):
    await ws_manager.connect(websocket)

    async def receive_command(websocket: WebSocket):
        async for cmd in websocket.iter_json():
            logger.debug("putting %s in command queue", cmd)
            print(tableId, cmd)

            if isinstance(cmd, int):
                print("Bet:", cmd)

            else:
                if cmd:
                    print("Check")
                else:
                    print("Fold")

            await ws_manager.broadcast(str(cmd), "betting")

    await receive_command(websocket)
