import asyncio
from typing import List

import structlog
from fastapi import WebSocket

logger = structlog.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.command_q = asyncio.queues.Queue()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: str, app: str):
        for connection in tuple(self.active_connections):
            try:
                if app in connection.url.path:
                    await connection.send_json(message)
            except Exception as _:
                self.disconnect(connection)
                logger.warning("removing closed connection %s", connection)
                continue


ws_manager = ConnectionManager()
