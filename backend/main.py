import json
from contextlib import asynccontextmanager
from hashlib import md5
from pickle import dump, load
from secrets import token_urlsafe
from typing import Optional

from funkybob import UniqueRandomNameGenerator
import structlog
from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import Cookie, FastAPI, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import HTMLResponse, RedirectResponse

from backend.database import Database
from backend.gameLogic import Table
from backend.websocket import ws_manager

database = Database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init()
    yield


logger = structlog.get_logger()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie", "Authorization"],
)
app.add_middleware(SessionMiddleware, secret_key="!secret")

tables: dict[int, Table] = {}


config = Config("backend/data/.env")
oauth = OAuth(config)

CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth.register(
    name="google",
    server_metadata_url=CONF_URL,
    client_kwargs={"scope": "openid email profile"},
)

with open("backend/data/cookies.pickle", "rb") as cookies:
    access_cookies: dict = load(cookies)


@app.get("/")
async def homepage():
    return {"status": "ok"}


@app.get("/lobby")
async def lobby():
    return {"status": "ok"}


@app.get("/stats")
async def stats():
    return {"status": "ok"}


@app.get("/api/tables")
async def get_tables():
    """Get list of all available tables"""
    table_list = []
    for table_id, table in tables.items():
        table_info = {
            "id": table_id,
            "name": table.name,
            "players": len(table.players),
            "maxPlayers": 8,
            "minBet": table.min_bet,
            "status": "waiting" if not table.started else "playing",
            "pot": table.pot if table.started else 0,
        }
        table_list.append(table_info)
    return {"tables": table_list}


@app.post("/api/create-table")
async def create_table_api(request: Request):
    """Create a new table via API"""
    data = await request.json()
    min_bet = data.get("minBet", 20)
    table_name = data.get("tableName", f"Table {Table.tableId}")

    new_table = Table(database, min_bet, table_name)
    tables[new_table.tableId] = new_table

    return {"success": True, "tableId": new_table.tableId, "tableName": table_name}


@app.get("/tableLobby/{tableId}")
async def tableLobby(tableId: int):
    if tableId not in tables:
        return {"error": "Table not found"}, 404
    return {"status": "ok", "tableId": tableId}


@app.get("/poker/{tableId}")
async def rooms(tableId: int):
    if tableId not in tables:
        return {"error": "Table not found"}, 404
    return {"status": "ok", "tableId": tableId}


@app.get("/login")
async def login(request: Request):
    redirect_uri = "http://localhost:8000/auth"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth")
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        return HTMLResponse(f"<h1>{error.error}</h1>")
    user = token.get("userinfo")

    if user:
        request.session["user"] = dict(user)

        wsId = md5(user["email"].encode()).hexdigest()
        print(wsId)
        access_token = token_urlsafe()
        access_cookies[access_token] = (user["email"], wsId)

        with open("backend/data/cookies.pickle", "wb") as cookies:
            dump(access_cookies, cookies)

        response = RedirectResponse(url="http://localhost:5173/lobby")
        response.set_cookie("access_token", access_token, max_age=3600 * 24 * 30)
        response.set_cookie("wsId", wsId, max_age=3600 * 24 * 30)

        return response


@app.get("/logout")
async def logout(request: Request, response: Response, access_token: Optional[str] = Cookie(None)):
    if access_token in access_cookies:
        access_cookies.pop(access_token)

        with open("backend/data/cookies.pickle", "wb") as cookies:
            dump(access_cookies, cookies)

    request.session.pop("user", None)
    response.delete_cookie(key="access_token")

    return RedirectResponse(url="http://localhost:5173/")


@app.websocket("/ws/create/{wsId}")
async def createTable(websocket: WebSocket):
    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        message = json.loads(message)

        new_table = Table(message["minBet"])
        tables[new_table.tableId] = new_table

        await ws_manager.broadcast(f"C{new_table.tableId}", "create")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/start/{tableId}/{wsId}")
async def startTable(websocket: WebSocket, tableId: int, wsId: str, access_token: Optional[str] = Cookie(None)):
    if tableId not in tables or wsId not in tables[tableId].players:
        logger.info("Player/Table not found")
        # await websocket.accept()
        # await websocket.send_text('"DISCONNECT"')
        # await websocket.close()
        return

    if access_token not in access_cookies or wsId != access_cookies[access_token][1]:
        logger.info("Player not authorized")
        # await websocket.accept()
        # await websocket.send_text('"DISCONNECT"')
        # await websocket.close()
        return

    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        logger.info(message)

        if message == "start":
            if tableId in tables and tables[tableId].player_num > 1:
                print(tables[tableId].player_num)
                await ws_manager.broadcast("0", f"start/{tableId}")

            else:
                logger.info("Table not found")

                await ws_manager.broadcast("-1", f"start/{tableId}")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/join/{tableId}/{wsId}")
async def joinTable(websocket: WebSocket, tableId: int, wsId: str, access_token: Optional[str] = Cookie(None)):
    if tableId not in tables:
        logger.info("Table not found")
        # await websocket.accept()
        # await websocket.send_text('"DISCONNECT"')
        # await websocket.close()
        return

    if access_token not in access_cookies or wsId != access_cookies[access_token][1]:
        logger.info("Player not authorized")
        # await websocket.accept()
        # await websocket.send_text('"DISCONNECT"')
        # await websocket.close()
        return

    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        message = json.loads(message)

        buyIn = int(message["buyIn"])

        if wsId in tables[tableId].players:
            logger.info("Player already in table")
            ws_manager.disconnect(websocket)

            return

        tables[tableId].add_player(wsId, buyIn)

        await ws_manager.broadcast("0", f"join/{tableId}/{wsId}")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/nextRound/{tableId}")
async def nextRound(websocket: WebSocket, tableId: int):
    await ws_manager.connect(websocket)

    try:
        message = await websocket.receive_text()
        logger.info(message)

        if message == "nextRound":
            if tableId in tables:
                await ws_manager.broadcast("0", f"nextRound/{tableId}")

            else:
                logger.info("Table not found")

                await ws_manager.broadcast("-1", f"nextRound/{tableId}")

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/betting/{tableId}/{wsId}")
async def websocket_betting(websocket: WebSocket, tableId: int, wsId: str, access_token: Optional[str] = Cookie(None)):
    if tableId not in tables or wsId not in tables[tableId].players:
        logger.info("Player/Table not found")
        # await websocket.accept()
        # await websocket.send_text('"DISCONNECT"')
        # await websocket.close()
        return

    if access_token not in access_cookies or wsId != access_cookies[access_token][1]:
        logger.info("Player not authorized")
        # await websocket.accept()
        # await websocket.send_text('"DISCONNECT"')
        # await websocket.close()
        return

    await ws_manager.connect(websocket)

    try:
        if tableId in tables:
            if not tables[tableId].started:
                await ws_manager.broadcast(f"Y{tables[tableId].player_order.index(wsId)}", f"betting/{tableId}/{wsId}")

            if not tables[tableId].started and tables[tableId].player_num == len(
                [x for x in ws_manager.active_connections if f"/ws/betting/{tableId}" in x.url.path]
            ):
                await tables[tableId].next_round()

                tables[tableId].started = True

        while websocket and tableId in tables and wsId in tables[tableId].players:
            message = await websocket.receive_text()
            print(message)

            message = json.loads(message)
            logger.info((tableId, message))

            if message == "N":
                await tables[tableId].next_round()

                continue

            if tableId in tables and tables[tableId].get_current_player() != wsId:
                logger.warning("Not your turn")

                continue

            await tables[tableId].action(wsId, message)

    except WebSocketDisconnect:
        if tableId in tables:
            tables[tableId].remove_player(wsId)

            if len(tables[tableId].players) < 2:
                del tables[tableId]

            else:
                await ws_manager.broadcast(f"Y{tables[tableId].player_order.index(wsId)}", f"betting/{tableId}/{wsId}")

        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


@app.websocket("/ws/read/{wsId}")
async def read_data(websocket: WebSocket, wsId: str):
    await ws_manager.connect(websocket)

    try:
        while websocket:
            message = await database.get_data()
            message = [list(row) for row in message]

            for row in message:
                it = iter(UniqueRandomNameGenerator(seed=int(row[0], 16)))
                row[0] = next(it)

            print(message)

            await ws_manager.broadcast(f"{message}".replace("'", '"'), f"read/{wsId}")
            break

    except WebSocketDisconnect:
        logger.info("Player disconnected")

        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)
